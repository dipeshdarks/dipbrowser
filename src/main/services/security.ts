import { session, app } from 'electron'
import { getSiteShields } from './shields'

const TRACKER_HOSTS = new Set([
  'google-analytics.com',
  'googletagmanager.com',
  'connect.facebook.net',
  'doubleclick.net',
  'hotjar.com',
  'mixpanel.com',
  'segment.com',
  'amplitude.com',
  'heap.io',
  'fullstory.com',
  'mouseflow.com',
  'crazyegg.com',
  'optimizely.com',
  'convert.com',
])

const AD_HOSTS = new Set([
  'pagead2.googlesyndication.com',
  'adservice.google.com',
  'ad.doubleclick.net',
  'ad.turn.com',
  'ads.yahoo.com',
  'advertising.com',
  'media.net',
  'amazon-adsystem.com',
  'quantserve.com',
  'scorecardresearch.com',
  'rubiconproject.com',
  'pubmatic.com',
  'openx.net',
  'casalemedia.com',
  'taboola.com',
  'outbrain.com',
])

const TRACKING_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'utm_id',
  'utm_cid',
  'fbclid',
  'gclid',
  'gclsrc',
  'dclid',
  'gbraid',
  'wbraid',
  'msclkid',
  'twclid',
  'li_fat_id',
  'mc_cid',
  'mc_eid',
  'oly_anon_id',
  'oly_enc_id',
  '_openstat',
  'vero_id',
  'wickedid',
  'yclid',
  '__hsa_cam__',
  '__hsa_ad__',
  '__hsa_grp__',
  '__hsa_ver__',
  '__hsa_la__',
  '__hsa_ol__',
  '__hsa_src__',
  '__hsa_net__',
  '__hsa_acc__',
])

let cachedSettings: {
  httpsUpgrade: boolean
  adBlocker: boolean
  trackerBlocking: boolean
  queryFiltering: boolean
  gpcHeader: boolean
  deAmpEnabled: boolean
  cosmeticFiltering: boolean
  fingerprintProtection: boolean
  referrerTrimming: boolean
} | null = null

export function refreshSecuritySettings(settings: {
  httpsUpgrade: boolean
  adBlocker: boolean
  trackerBlocking: boolean
  queryFiltering?: boolean
  gpcHeader?: boolean
  deAmpEnabled?: boolean
  cosmeticFiltering?: boolean
  fingerprintProtection?: boolean
  referrerTrimming?: boolean
}): void {
  cachedSettings = {
    httpsUpgrade: settings.httpsUpgrade,
    adBlocker: settings.adBlocker,
    trackerBlocking: settings.trackerBlocking,
    queryFiltering: settings.queryFiltering ?? true,
    gpcHeader: settings.gpcHeader ?? true,
    deAmpEnabled: settings.deAmpEnabled ?? true,
    cosmeticFiltering: settings.cosmeticFiltering ?? true,
    fingerprintProtection: settings.fingerprintProtection ?? true,
    referrerTrimming: settings.referrerTrimming ?? true,
  }
}

function hostMatches(hostname: string, hosts: Set<string>): boolean {
  if (hosts.has(hostname)) return true
  const parts = hostname.split('.')
  for (let i = 1; i < parts.length; i++) {
    if (hosts.has(parts.slice(i).join('.'))) return true
  }
  return false
}

function stripTrackingParams(url: string): string {
  try {
    const parsed = new URL(url)
    let changed = false
    for (const key of TRACKING_PARAMS) {
      if (parsed.searchParams.has(key)) {
        parsed.searchParams.delete(key)
        changed = true
      }
    }
    return changed ? parsed.toString() : url
  } catch {
    return url
  }
}

function detectAmpUrl(url: string): string | null {
  try {
    const parsed = new URL(url)

    if (parsed.hostname.endsWith('.ampproject.org') || parsed.hostname.endsWith('.amp.cloudflare.com')) {
      const path = parsed.pathname
      if (path.includes('/s/') || path.includes('/c/')) {
        return parsed.origin
      }
      return parsed.origin
    }

    if (parsed.pathname.endsWith('/amp/') || parsed.pathname.endsWith('.amp') || parsed.pathname.includes('/amphtml')) {
      return null
    }

    return null
  } catch {
    return null
  }
}

function extractCanonicalUrl(html: string): string | null {
  const canonicalMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)
  if (canonicalMatch) {
    return canonicalMatch[1]
  }

  const ogUrlMatch = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']+)["']/i)
  if (ogUrlMatch) {
    return ogUrlMatch[1]
  }

  return null
}

export function setupSecurityFeatures(): void {
  const defaultSession = session.defaultSession

  defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    const headers = { ...details.requestHeaders }

    if (cachedSettings?.gpcHeader) {
      headers['Sec-GPC'] = '1'
      headers['Global-Privacy-Control'] = '1'
    }

    if (cachedSettings?.referrerTrimming && headers['Referer']) {
      try {
        const refererUrl = new URL(headers['Referer'])
        const requestUrl = new URL(details.url)
        if (refererUrl.hostname !== requestUrl.hostname) {
          headers['Referer'] = requestUrl.origin + '/'
        }
      } catch {
        delete headers['Referer']
      }
    }

    callback({ requestHeaders: headers })
  })

  defaultSession.webRequest.onBeforeRequest((details, callback) => {
    if (!cachedSettings) {
      callback({ cancel: false })
      return
    }

    let hostname = ''
    let url = details.url
    try {
      const parsed = new URL(url)
      hostname = parsed.hostname
    } catch {
      callback({ cancel: false })
      return
    }

    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

    if (!isLocalhost) {
      const siteShields = getSiteShields(hostname)

      if (siteShields.queryFiltering && cachedSettings.queryFiltering) {
        const cleaned = stripTrackingParams(url)
        if (cleaned !== url) {
          callback({ redirectURL: cleaned })
          return
        }
      }

      if (siteShields.httpsUpgrade && cachedSettings.httpsUpgrade && url.startsWith('http://')) {
        callback({ redirectURL: url.replace('http://', 'https://') })
        return
      }

      if (siteShields.trackerBlocking && cachedSettings.trackerBlocking && hostMatches(hostname, TRACKER_HOSTS)) {
        callback({ cancel: true })
        return
      }

      if (siteShields.adBlocker && cachedSettings.adBlocker && hostMatches(hostname, AD_HOSTS)) {
        callback({ cancel: true })
        return
      }
    } else {
      if (cachedSettings.queryFiltering) {
        const cleaned = stripTrackingParams(url)
        if (cleaned !== url) {
          callback({ redirectURL: cleaned })
          return
        }
      }

      if (cachedSettings.trackerBlocking && hostMatches(hostname, TRACKER_HOSTS)) {
        callback({ cancel: true })
        return
      }

      if (cachedSettings.adBlocker && hostMatches(hostname, AD_HOSTS)) {
        callback({ cancel: true })
        return
      }
    }

    callback({ cancel: false })
  })

  app.on('certificate-error', (event, _webContents, _url, _error, _certificate, callback) => {
    if (app.isPackaged) {
      event.preventDefault()
      callback(false)
    } else {
      callback(true)
    }
  })
}

export function clearSessionData(): void {
  if (cachedSettings?.httpsUpgrade) {
    session.defaultSession.clearStorageData()
    session.defaultSession.clearCache()
  }
}
