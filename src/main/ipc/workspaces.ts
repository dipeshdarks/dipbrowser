import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import { getDatabase } from '../database/sqlite'
import { Workspace } from '../../shared/types'
import { randomUUID } from 'crypto'

export function registerWorkspaceIpc(window: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.WORKSPACE_CREATE, (_event, workspace: { name: string; icon?: string; color?: string }) => {
    const db = getDatabase()
    const id = randomUUID()
    const maxPos = (db.prepare('SELECT COALESCE(MAX(position), -1) as pos FROM workspaces').get() as { pos: number }).pos

    db.prepare('INSERT INTO workspaces (id, name, icon, color, position) VALUES (?, ?, ?, ?, ?)')
      .run(id, workspace.name, workspace.icon || '📁', workspace.color || '#1ED5A9', maxPos + 1)

    return { id, ...workspace, position: maxPos + 1 }
  })

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_DELETE, (_event, id: string) => {
    const db = getDatabase()
    db.prepare('DELETE FROM workspaces WHERE id = ?').run(id)
  })

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_LIST, () => {
    const db = getDatabase()
    return db.prepare('SELECT * FROM workspaces ORDER BY position ASC').all() as Workspace[]
  })

  ipcMain.handle(IPC_CHANNELS.WORKSPACE_UPDATE, (_event, id: string, updates: Partial<Workspace>) => {
    const db = getDatabase()
    const fields: string[] = []
    const values: unknown[] = []

    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`)
        values.push(value)
      }
    }

    if (fields.length > 0) {
      values.push(id)
      db.prepare(`UPDATE workspaces SET ${fields.join(', ')} WHERE id = ?`).run(...values)
    }
  })
}
