import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'

export function registerWindowIpc(window: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, () => {
    window.minimize()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, () => {
    if (window.isMaximized()) {
      window.unmaximize()
    } else {
      window.maximize()
    }
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, () => {
    window.close()
  })

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, () => {
    return window.isMaximized()
  })

  window.on('maximize', () => {
    window.webContents.send('window:maximized-changed', true)
  })

  window.on('unmaximize', () => {
    window.webContents.send('window:maximized-changed', false)
  })

  ipcMain.handle(IPC_CHANNELS.OPEN_DEVTOOLS, (_event, tabId?: string) => {
    window.webContents.send('devtools:open-tab', tabId)
  })

  ipcMain.handle(IPC_CHANNELS.VIEW_SOURCE, (_event, url: string) => {
    window.webContents.send('webview:view-source', url)
  })
}
