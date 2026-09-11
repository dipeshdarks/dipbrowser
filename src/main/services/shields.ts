import { getDatabase } from '../database/sqlite'

interface SiteShieldSettings {
  hostname: string
  adBlocker: boolean
  trackerBlocking: boolean
  httpsUpgrade: boolean
  queryFiltering: boolean
  gpcHeader: boolean
}

const DEFAULT_SHIELDS: SiteShieldSettings = {
  hostname: '',
  adBlocker: true,
  trackerBlocking: true,
  httpsUpgrade: true,
  queryFiltering: true,
  gpcHeader: true,
}

export function getSiteShields(hostname: string): SiteShieldSettings {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM site_shields WHERE hostname = ?').get(hostname) as SiteShieldSettings | undefined

    if (row) {
      return {
        hostname: row.hostname,
        adBlocker: Boolean(row.adBlocker),
        trackerBlocking: Boolean(row.trackerBlocking),
        httpsUpgrade: Boolean(row.httpsUpgrade),
        queryFiltering: Boolean(row.queryFiltering),
        gpcHeader: Boolean(row.gpcHeader),
      }
    }

    return { ...DEFAULT_SHIELDS, hostname }
  } catch {
    return { ...DEFAULT_SHIELDS, hostname }
  }
}

export function setSiteShield(hostname: string, key: keyof SiteShieldSettings, value: boolean): void {
  if (key === 'hostname') return

  const db = getDatabase()
  const existing = db.prepare('SELECT hostname FROM site_shields WHERE hostname = ?').get(hostname)

  if (existing) {
    db.prepare(`UPDATE site_shields SET ${key} = ? WHERE hostname = ?`).run(value ? 1 : 0, hostname)
  } else {
    const defaults = { ...DEFAULT_SHIELDS, hostname }
    defaults[key] = value
    db.prepare('INSERT INTO site_shields (hostname, adBlocker, trackerBlocking, httpsUpgrade, queryFiltering, gpcHeader) VALUES (?, ?, ?, ?, ?, ?)').run(
      hostname,
      defaults.adBlocker ? 1 : 0,
      defaults.trackerBlocking ? 1 : 0,
      defaults.httpsUpgrade ? 1 : 0,
      defaults.queryFiltering ? 1 : 0,
      defaults.gpcHeader ? 1 : 0,
    )
  }
}

export function deleteSiteShield(hostname: string): void {
  const db = getDatabase()
  db.prepare('DELETE FROM site_shields WHERE hostname = ?').run(hostname)
}

export function getAllSiteShields(): SiteShieldSettings[] {
  try {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM site_shields ORDER BY hostname').all() as SiteShieldSettings[]
    return rows.map(row => ({
      ...row,
      adBlocker: Boolean(row.adBlocker),
      trackerBlocking: Boolean(row.trackerBlocking),
      httpsUpgrade: Boolean(row.httpsUpgrade),
      queryFiltering: Boolean(row.queryFiltering),
      gpcHeader: Boolean(row.gpcHeader),
    }))
  } catch {
    return []
  }
}

export function shouldBlockRequest(hostname: string, type: 'ad' | 'tracker', globalSettings: { adBlocker: boolean; trackerBlocking: boolean }): boolean {
  const shields = getSiteShields(hostname)

  if (type === 'ad' && shields.adBlocker) return true
  if (type === 'tracker' && shields.trackerBlocking) return true

  if (type === 'ad' && globalSettings.adBlocker) return true
  if (type === 'tracker' && globalSettings.trackerBlocking) return true

  return false
}

export function shouldUpgradeHttps(hostname: string, globalHttpsUpgrade: boolean): boolean {
  const shields = getSiteShields(hostname)
  return shields.httpsUpgrade || globalHttpsUpgrade
}

export function shouldStripQueryParams(hostname: string, globalQueryFiltering: boolean): boolean {
  const shields = getSiteShields(hostname)
  return shields.queryFiltering || globalQueryFiltering
}

export function shouldSendGpc(hostname: string, globalGpcHeader: boolean): boolean {
  const shields = getSiteShields(hostname)
  return shields.gpcHeader || globalGpcHeader
}
