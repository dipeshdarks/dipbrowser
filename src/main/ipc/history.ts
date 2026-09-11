import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import { getDatabase } from '../database/sqlite'
import { HistoryEntry } from '../../shared/types'

export function registerHistoryIpc(window: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.HISTORY_ADD, (_event, entry: { title: string; url: string; favicon: string | null }) => {
    const db = getDatabase()
    const existing = db.prepare('SELECT id, visit_count FROM history WHERE url = ?').get(entry.url) as { id: number; visit_count: number } | undefined

    if (existing) {
      db.prepare('UPDATE history SET visit_count = ?, last_visited = CURRENT_TIMESTAMP, title = ?, favicon = ? WHERE id = ?')
        .run(existing.visit_count + 1, entry.title, entry.favicon, existing.id)
    } else {
      db.prepare('INSERT INTO history (title, url, favicon) VALUES (?, ?, ?)').run(entry.title, entry.url, entry.favicon)
    }
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_REMOVE, (_event, id: number) => {
    const db = getDatabase()
    db.prepare('DELETE FROM history WHERE id = ?').run(id)
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_CLEAR, () => {
    const db = getDatabase()
    db.prepare('DELETE FROM history').run()
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_SEARCH, (_event, query: string) => {
    const db = getDatabase()
    const search = `%${query}%`
    return db.prepare('SELECT * FROM history WHERE title LIKE ? OR url LIKE ? ORDER BY last_visited DESC LIMIT 50')
      .all(search, search) as HistoryEntry[]
  })

  ipcMain.handle(IPC_CHANNELS.HISTORY_GET_ALL, () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM history ORDER BY last_visited DESC LIMIT 500').all() as HistoryEntry[]
  })
}
