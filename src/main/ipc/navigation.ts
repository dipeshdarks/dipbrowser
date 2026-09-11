import { BrowserWindow, ipcMain } from 'electron'
import { TabManager } from '../services/tab-manager'
import { IPC_CHANNELS, SEARCH_ENGINES } from '../../shared/constants'
import { getDatabase } from '../database/sqlite'
import { getSettings } from './settings'

export function registerNavigationIpc(window: BrowserWindow, tabManager: TabManager): void {
  ipcMain.handle(IPC_CHANNELS.NAVIGATE, (_event, tabId: string, url: string) => {
    const resolvedUrl = resolveUrl(url)
    const tab = tabManager.updateTab(tabId, { url: resolvedUrl, loading: true })
    if (tab) {
      window.webContents.send(IPC_CHANNELS.TAB_UPDATE, { ...tab, url: resolvedUrl })
    }
    return resolvedUrl
  })

  ipcMain.handle(IPC_CHANNELS.BACK, (_event, tabId: string) => {
    window.webContents.send('webview:back', tabId)
  })

  ipcMain.handle(IPC_CHANNELS.FORWARD, (_event, tabId: string) => {
    window.webContents.send('webview:forward', tabId)
  })

  ipcMain.handle(IPC_CHANNELS.RELOAD, (_event, tabId: string) => {
    window.webContents.send('webview:reload', tabId)
  })

  ipcMain.handle(IPC_CHANNELS.HARD_RELOAD, (_event, tabId: string) => {
    window.webContents.send('webview:hard-reload', tabId)
  })

  ipcMain.handle(IPC_CHANNELS.GET_URL, (_event, tabId: string) => {
    const tab = tabManager.getTab(tabId)
    return tab?.url ?? ''
  })
}

function resolveUrl(input: string): string {
  const trimmed = input.trim()

  if (trimmed === 'dipbrowser://newtab') return trimmed

  if (/^https?:\/\//.test(trimmed)) return trimmed

  if (/^localhost(:\d+)?(\/.*)?$/.test(trimmed)) return `http://${trimmed}`

  if (/^[\w-]+(\.[\w-]+)+\/?.*$/.test(trimmed)) {
    return `https://${trimmed}`
  }

  const settings = getSettings()
  const engineUrl = SEARCH_ENGINES[settings.searchEngine] || SEARCH_ENGINES.Google
  return engineUrl.replace('%s', encodeURIComponent(trimmed))
}

export function addHistory(title: string, url: string, favicon: string | null): void {
  if (url === 'dipbrowser://newtab') return

  const db = getDatabase()
  const existing = db.prepare('SELECT id, visit_count FROM history WHERE url = ?').get(url) as { id: number; visit_count: number } | undefined

  if (existing) {
    db.prepare('UPDATE history SET visit_count = ?, last_visited = CURRENT_TIMESTAMP, title = ?, favicon = ? WHERE id = ?')
      .run(existing.visit_count + 1, title, favicon, existing.id)
  } else {
    db.prepare('INSERT INTO history (title, url, favicon) VALUES (?, ?, ?)').run(title, url, favicon)
  }
}
