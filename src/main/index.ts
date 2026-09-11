import { app, BrowserWindow, session } from 'electron'
import { join } from 'path'
import { createBrowserWindow } from './browser-window'
import { initializeDatabase } from './database/sqlite'
import { registerTabIpc } from './ipc/tabs'
import { registerNavigationIpc } from './ipc/navigation'
import { registerBookmarkIpc } from './ipc/bookmarks'
import { registerHistoryIpc } from './ipc/history'
import { registerDownloadIpc } from './ipc/downloads'
import { registerSettingsIpc } from './ipc/settings'
import { registerWorkspaceIpc } from './ipc/workspaces'
import { registerWindowIpc } from './ipc/window'
import { registerPermissionIpc } from './ipc/permissions'
import { registerReaderModeIpc } from './ipc/reader-mode'
import { registerShieldIpc } from './ipc/shields'
import { registerOmniboxIpc } from './ipc/omnibox'
import { TabManager } from './services/tab-manager'
import { SessionManager } from './services/session-manager'
import { setupSecurityFeatures, clearSessionData } from './services/security'
import { initFilterLists } from './services/filter-lists'

let mainWindow: BrowserWindow | null = null
let tabManager: TabManager
let sessionManager: SessionManager

const CSP_HEADER = "default-src 'self' http://localhost:*; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: http:; font-src 'self' data:; connect-src 'self' https: http: ws: wss:; frame-src *; object-src 'none';"

function setupContentSecurity(): void {
  if (!app.isPackaged) return

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [CSP_HEADER]
      }
    })
  })
}

app.whenReady().then(async () => {
  initializeDatabase()

  sessionManager = new SessionManager()
  tabManager = new TabManager(sessionManager)

  setupContentSecurity()

  mainWindow = createBrowserWindow()

  registerTabIpc(mainWindow, tabManager)
  registerNavigationIpc(mainWindow, tabManager)
  registerBookmarkIpc(mainWindow)
  registerHistoryIpc(mainWindow)
  registerDownloadIpc(mainWindow)
  registerSettingsIpc(mainWindow)
  registerWorkspaceIpc(mainWindow)
  registerWindowIpc(mainWindow)
  registerPermissionIpc(mainWindow)
  registerReaderModeIpc(mainWindow)
  registerShieldIpc(mainWindow)
  registerOmniboxIpc(mainWindow)

  setupSecurityFeatures()

  initFilterLists().catch(console.error)

  if (!app.isPackaged) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
})

app.on('window-all-closed', () => {
  clearSessionData()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createBrowserWindow()
  }
})

export function getMainWindow(): BrowserWindow | null {
  return mainWindow
}
