import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import { getDatabase } from '../database/sqlite'
import { SitePermission } from '../../shared/types'

export function registerPermissionIpc(window: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.PERMISSION_CHECK, (_event, url: string, permission: string) => {
    const db = getDatabase()
    const entry = db.prepare('SELECT granted FROM permissions WHERE url = ? AND permission = ?').get(url, permission) as { granted: number } | undefined
    return entry ? entry.granted === 1 : null
  })

  ipcMain.handle(IPC_CHANNELS.PERMISSION_GRANT, (_event, url: string, permission: string) => {
    const db = getDatabase()
    db.prepare('INSERT OR REPLACE INTO permissions (url, permission, granted) VALUES (?, ?, 1)').run(url, permission)
  })

  ipcMain.handle(IPC_CHANNELS.PERMISSION_DENY, (_event, url: string, permission: string) => {
    const db = getDatabase()
    db.prepare('INSERT OR REPLACE INTO permissions (url, permission, granted) VALUES (?, ?, 0)').run(url, permission)
  })
}
