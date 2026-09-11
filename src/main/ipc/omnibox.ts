import { BrowserWindow, ipcMain } from 'electron'
import { getDatabase } from '../database/sqlite'
import { getSearchSuggestions } from '../services/search-suggestions'
import { getSettings } from './settings'

interface OmniboxResult {
  type: 'search' | 'history' | 'bookmark'
  title: string
  url: string
  favicon: string | null
}

export function registerOmniboxIpc(window: BrowserWindow): void {
  ipcMain.handle('omnibox:suggestions', async (_event, query: string) => {
    if (!query || query.length < 1) return []

    const results: OmniboxResult[] = []

    try {
      const db = getDatabase()

      const historyResults = db.prepare(`
        SELECT title, url, favicon FROM history
        WHERE url LIKE ? OR title LIKE ?
        ORDER BY visit_count DESC, last_visited DESC
        LIMIT 5
      `).all(`%${query}%`, `%${query}%`) as Array<{ title: string; url: string; favicon: string | null }>

      for (const row of historyResults) {
        results.push({
          type: 'history',
          title: row.title || row.url,
          url: row.url,
          favicon: row.favicon,
        })
      }

      const bookmarkResults = db.prepare(`
        SELECT title, url, favicon FROM bookmarks
        WHERE url LIKE ? OR title LIKE ?
        ORDER BY position
        LIMIT 5
      `).all(`%${query}%`, `%${query}%`) as Array<{ title: string; url: string; favicon: string | null }>

      for (const row of bookmarkResults) {
        if (!results.some(r => r.url === row.url)) {
          results.push({
            type: 'bookmark',
            title: row.title || row.url,
            url: row.url,
            favicon: row.favicon,
          })
        }
      }
    } catch (err) {
      console.error('[Omnibox] Database search failed:', err)
    }

    try {
      const settings = getSettings()
      const suggestions = await getSearchSuggestions(query, settings.searchEngine)

      for (const suggestion of suggestions) {
        if (!results.some(r => r.title === suggestion)) {
          results.unshift({
            type: 'search',
            title: suggestion,
            url: `search://${suggestion}`,
            favicon: null,
          })
        }
      }
    } catch (err) {
      console.error('[Omnibox] Search suggestions failed:', err)
    }

    return results.slice(0, 10)
  })
}
