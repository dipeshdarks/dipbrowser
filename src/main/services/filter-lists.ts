import { net } from 'electron'
import { getDatabase } from '../database/sqlite'

const EASYLIST_URL = 'https://easylist.to/easylist/easylist.txt'
const EASYPRIVACY_URL = 'https://easylist.to/easylist/easyprivacy.txt'

interface CosmeticRule {
  selector: string
  domain: string | null
  exception: boolean
}

let cosmeticRules: CosmeticRule[] = []
let lastFetchTime: number = 0
const FETCH_INTERVAL = 24 * 60 * 60 * 1000

export async function initFilterLists(): Promise<void> {
  try {
    const db = getDatabase()
    const lists = db.prepare('SELECT * FROM filter_lists WHERE enabled = 1').all() as Array<{
      id: number
      name: string
      url: string
      content: string | null
      lastUpdated: string | null
    }>

    if (lists.length === 0) {
      await fetchAndCacheFilterLists()
    } else {
      for (const list of lists) {
        if (list.content) {
          parseCosmeticRules(list.content)
        }
      }

      const lastUpdated = lists[0]?.lastUpdated
      if (lastUpdated) {
        const age = Date.now() - new Date(lastUpdated).getTime()
        if (age > FETCH_INTERVAL) {
          fetchAndCacheFilterLists()
        }
      }
    }
  } catch (err) {
    console.error('[FilterLists] Init failed:', err)
  }
}

async function fetchAndCacheFilterLists(): Promise<void> {
  try {
    const easylist = await fetchFilterList(EASYLIST_URL)
    const easyprivacy = await fetchFilterList(EASYPRIVACY_URL)

    const db = getDatabase()
    const upsert = db.prepare("INSERT OR REPLACE INTO filter_lists (name, url, content, lastUpdated) VALUES (?, ?, ?, datetime('now'))")

    if (easylist) {
      upsert.run('EasyList', EASYLIST_URL, easylist)
      parseCosmeticRules(easylist)
    }

    if (easyprivacy) {
      upsert.run('EasyPrivacy', EASYPRIVACY_URL, easyprivacy)
      parseCosmeticRules(easyprivacy)
    }

    lastFetchTime = Date.now()
    console.log('[FilterLists] Updated filter lists')
  } catch (err) {
    console.error('[FilterLists] Fetch failed:', err)
  }
}

function fetchFilterList(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const request = net.request(url)
    let body = ''

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        body += chunk.toString()
      })
      response.on('end', () => {
        resolve(body)
      })
    })

    request.on('error', (err) => {
      console.error(`[FilterLists] Error fetching ${url}:`, err)
      resolve(null)
    })

    request.end()
  })
}

function parseCosmeticRules(content: string): void {
  const lines = content.split('\n')
  const rules: CosmeticRule[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('!') || trimmed.startsWith('[')) continue

    const hashMatch = trimmed.match(/^(.+?)##(.+)$/)
    if (hashMatch) {
      const domain = hashMatch[1].trim() || null
      const selector = hashMatch[2].trim()
      if (selector) {
        rules.push({ selector, domain, exception: false })
      }
      continue
    }

    const exceptionMatch = trimmed.match(/^(.+?)#@#(.+)$/)
    if (exceptionMatch) {
      const domain = exceptionMatch[1].trim() || null
      const selector = exceptionMatch[2].trim()
      if (selector) {
        rules.push({ selector, domain, exception: true })
      }
      continue
    }

    const globalMatch = trimmed.match(/^##(.+)$/)
    if (globalMatch) {
      const selector = globalMatch[1].trim()
      if (selector) {
        rules.push({ selector, domain: null, exception: false })
      }
    }
  }

  cosmeticRules = rules
}

export function getCosmeticFiltersForDomain(hostname: string): string[] {
  const selectors: Set<string> = new Set()
  const exceptionSelectors: Set<string> = new Set()

  for (const rule of cosmeticRules) {
    if (rule.exception) {
      if (!rule.domain || hostname.includes(rule.domain)) {
        exceptionSelectors.add(rule.selector)
      }
    } else {
      if (!rule.domain || hostname.includes(rule.domain)) {
        if (!exceptionSelectors.has(rule.selector)) {
          selectors.add(rule.selector)
        }
      }
    }
  }

  return Array.from(selectors)
}

export function buildCosmeticStyleSheet(hostname: string): string {
  const selectors = getCosmeticFiltersForDomain(hostname)
  if (selectors.length === 0) return ''

  const css = selectors.map(s => `${s} { display: none !important; }`).join('\n')
  return `/* DipBrowser Cosmetic Filtering */\n${css}`
}

export function getFilterListStats(): { totalRules: number; lastFetch: number } {
  return {
    totalRules: cosmeticRules.length,
    lastFetch: lastFetchTime,
  }
}
