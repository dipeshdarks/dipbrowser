import { BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import { getDatabase } from '../database/sqlite'
import { DownloadItem } from '../../shared/types'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { getSettings } from './settings'

export function registerDownloadIpc(window: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_START, async (_event, url: string) => {
    const settings = getSettings()
    const downloadPath = settings.downloadPath || (await dialog.showOpenDialog(window, { properties: ['openDirectory'] })).filePaths[0]

    if (!downloadPath) return null

    const id = randomUUID()
    const filename = extractFilename(url)
    const filePath = join(downloadPath, filename)

    const db = getDatabase()
    db.prepare('INSERT INTO downloads (id, url, filename, path, state) VALUES (?, ?, ?, ?, ?)')
      .run(id, url, filename, filePath, 'progressing')

    window.webContents.downloadURL(url)

    return { id, url, filename, path: filePath, state: 'progressing' }
  })

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_CANCEL, (_event, id: string) => {
    const db = getDatabase()
    db.prepare('UPDATE downloads SET state = ? WHERE id = ?').run('cancelled', id)
  })

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_PAUSE, (_event, id: string) => {
    const db = getDatabase()
    db.prepare('UPDATE downloads SET state = ? WHERE id = ?').run('paused', id)
  })

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_RESUME, (_event, id: string) => {
    const db = getDatabase()
    db.prepare('UPDATE downloads SET state = ? WHERE id = ?').run('progressing', id)
  })

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_LIST, () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM downloads ORDER BY start_time DESC').all() as DownloadItem[]
  })

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_OPEN, async (_event, id: string) => {
    const db = getDatabase()
    const item = db.prepare('SELECT path FROM downloads WHERE id = ?').get(id) as { path: string } | undefined
    if (item) {
      await shell.openPath(item.path)
    }
  })

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_SHOW, async (_event, id: string) => {
    const db = getDatabase()
    const item = db.prepare('SELECT path FROM downloads WHERE id = ?').get(id) as { path: string } | undefined
    if (item) {
      shell.showItemInFolder(item.path)
    }
  })

  window.webContents.session.on('will-download', (_event, item) => {
    const filename = item.getFilename()
    const totalBytes = item.getTotalBytes()

    const db = getDatabase()
    const existing = db.prepare('SELECT id FROM downloads WHERE filename = ? ORDER BY start_time DESC LIMIT 1').get(filename) as { id: string } | undefined

    if (existing) {
      db.prepare('UPDATE downloads SET total_bytes = ?, state = ? WHERE id = ?').run(totalBytes, 'progressing', existing.id)
    }

    item.on('updated', (_event, state) => {
      if (state === 'progressing') {
        const receivedBytes = item.getReceivedBytes()
        if (existing) {
          db.prepare('UPDATE downloads SET received_bytes = ? WHERE id = ?').run(receivedBytes, existing.id)
        }
        window.webContents.send('download:progress', { id: existing?.id, receivedBytes, totalBytes })
      }
    })

    item.once('done', (_event, state) => {
      if (existing) {
        const finalState = state === 'completed' ? 'completed' : 'cancelled'
        db.prepare('UPDATE downloads SET state = ?, received_bytes = ? WHERE id = ?').run(finalState, totalBytes, existing.id)
        window.webContents.send('download:complete', { id: existing.id, state: finalState })
      }
    })
  })
}

function extractFilename(url: string): string {
  try {
    const pathname = new URL(url).pathname
    const segments = pathname.split('/')
    const last = segments[segments.length - 1]
    return last || 'download'
  } catch {
    return 'download'
  }
}
