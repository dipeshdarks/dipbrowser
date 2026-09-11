import { BrowserWindow, ipcMain } from 'electron'
import { TabManager } from '../services/tab-manager'
import { IPC_CHANNELS } from '../../shared/constants'
import { getSettings } from './settings'

export function registerTabIpc(window: BrowserWindow, tabManager: TabManager): void {
  ipcMain.handle(IPC_CHANNELS.TAB_CREATE, (_event, url?: string, workspaceId?: string) => {
    const tab = tabManager.createTab(url, workspaceId)
    return tab
  })

  ipcMain.handle(IPC_CHANNELS.TAB_CLOSE, async (_event, id: string) => {
    const settings = getSettings()
    const tab = await tabManager.closeTab(id, settings.ephemeralStorage)
    return tab
  })

  ipcMain.handle(IPC_CHANNELS.TAB_SWITCH, (_event, id: string) => {
    const tab = tabManager.setActiveTab(id)
    return tab
  })

  ipcMain.handle(IPC_CHANNELS.TAB_UPDATE, (_event, id: string, updates: Record<string, unknown>) => {
    const tab = tabManager.updateTab(id, updates)
    return tab
  })

  ipcMain.handle(IPC_CHANNELS.TAB_LIST, (_event, workspaceId?: string) => {
    if (workspaceId) {
      return tabManager.getWorkspaceTabs(workspaceId)
    }
    return tabManager.getAllTabs()
  })

  ipcMain.handle(IPC_CHANNELS.TAB_REORDER, (_event, id: string, newPosition: number) => {
    tabManager.moveTab(id, newPosition)
    window.webContents.send(IPC_CHANNELS.TAB_LIST, tabManager.getAllTabs())
  })

  ipcMain.handle(IPC_CHANNELS.TAB_PIN, (_event, id: string) => {
    tabManager.pinTab(id)
    window.webContents.send(IPC_CHANNELS.TAB_LIST, tabManager.getAllTabs())
  })

  ipcMain.handle(IPC_CHANNELS.TAB_RESTORE, () => {
    const tab = tabManager.restoreRecentlyClosed()
    if (tab) {
      window.webContents.send(IPC_CHANNELS.TAB_CREATE, tab)
    }
    return tab
  })

  ipcMain.handle(IPC_CHANNELS.TAB_SUSPEND, (_event, id: string) => {
    tabManager.suspendTab(id)
  })

  ipcMain.handle(IPC_CHANNELS.TAB_RESUME, (_event, id: string) => {
    tabManager.resumeTab(id)
  })
}
