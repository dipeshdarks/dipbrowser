import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import { getDatabase } from '../database/sqlite'
import { Bookmark, BookmarkFolder } from '../../shared/types'

export function registerBookmarkIpc(window: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.BOOKMARK_ADD, (_event, bookmark: { title: string; url: string; favicon: string | null; folderId?: number | null }) => {
    const db = getDatabase()
    const maxPos = (db.prepare('SELECT COALESCE(MAX(position), -1) as pos FROM bookmarks WHERE folder_id IS ?').get(bookmark.folderId ?? null) as { pos: number }).pos

    const result = db.prepare('INSERT INTO bookmarks (title, url, favicon, folder_id, position) VALUES (?, ?, ?, ?, ?)')
      .run(bookmark.title, bookmark.url, bookmark.favicon, bookmark.folderId ?? null, maxPos + 1)

    return { id: result.lastInsertRowid, ...bookmark, position: maxPos + 1 }
  })

  ipcMain.handle(IPC_CHANNELS.BOOKMARK_REMOVE, (_event, id: number) => {
    const db = getDatabase()
    db.prepare('DELETE FROM bookmarks WHERE id = ?').run(id)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.BOOKMARK_LIST, () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM bookmarks ORDER BY position ASC').all() as Bookmark[]
  })

  ipcMain.handle(IPC_CHANNELS.BOOKMARK_CHECK, (_event, url: string) => {
    const db = getDatabase()
    const bookmark = db.prepare('SELECT id FROM bookmarks WHERE url = ?').get(url)
    return bookmark ? (bookmark as { id: number }).id : null
  })

  ipcMain.handle(IPC_CHANNELS.BOOKMARK_GET_ALL, () => {
    const db = getDatabase()
    const bookmarks = db.prepare('SELECT * FROM bookmarks ORDER BY position ASC').all() as Bookmark[]
    const folders = db.prepare('SELECT * FROM bookmark_folders ORDER BY position ASC').all() as BookmarkFolder[]
    return { bookmarks, folders }
  })
}
