import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '../shared/constants'

const electronAPI = {
  tabs: {
    create: (url?: string, workspaceId?: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_CREATE, url, workspaceId),
    close: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_CLOSE, id),
    switch: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_SWITCH, id),
    update: (id: string, updates: Record<string, unknown>) => ipcRenderer.invoke(IPC_CHANNELS.TAB_UPDATE, id, updates),
    list: (workspaceId?: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_LIST, workspaceId),
    reorder: (id: string, position: number) => ipcRenderer.invoke(IPC_CHANNELS.TAB_REORDER, id, position),
    pin: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_PIN, id),
    restore: () => ipcRenderer.invoke(IPC_CHANNELS.TAB_RESTORE),
    suspend: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_SUSPEND, id),
    resume: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.TAB_RESUME, id),
    onCreated: (callback: (tab: unknown) => void) => {
      ipcRenderer.on(IPC_CHANNELS.TAB_CREATE, (_event, tab) => callback(tab))
      return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.TAB_CREATE)
    },
    onClosed: (callback: (id: string) => void) => {
      ipcRenderer.on(IPC_CHANNELS.TAB_CLOSE, (_event, id) => callback(id))
      return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.TAB_CLOSE)
    },
    onSwitched: (callback: (tab: unknown) => void) => {
      ipcRenderer.on(IPC_CHANNELS.TAB_SWITCH, (_event, tab) => callback(tab))
      return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.TAB_SWITCH)
    },
    onUpdated: (callback: (tab: unknown) => void) => {
      ipcRenderer.on(IPC_CHANNELS.TAB_UPDATE, (_event, tab) => callback(tab))
      return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.TAB_UPDATE)
    },
    onListChanged: (callback: (tabs: unknown[]) => void) => {
      ipcRenderer.on(IPC_CHANNELS.TAB_LIST, (_event, tabs) => callback(tabs))
      return () => ipcRenderer.removeAllListeners(IPC_CHANNELS.TAB_LIST)
    },
  },

  navigation: {
    navigate: (tabId: string, url: string) => ipcRenderer.invoke(IPC_CHANNELS.NAVIGATE, tabId, url),
    back: (tabId: string) => ipcRenderer.invoke(IPC_CHANNELS.BACK, tabId),
    forward: (tabId: string) => ipcRenderer.invoke(IPC_CHANNELS.FORWARD, tabId),
    reload: (tabId: string) => ipcRenderer.invoke(IPC_CHANNELS.RELOAD, tabId),
    hardReload: (tabId: string) => ipcRenderer.invoke(IPC_CHANNELS.HARD_RELOAD, tabId),
    getUrl: (tabId: string) => ipcRenderer.invoke(IPC_CHANNELS.GET_URL, tabId),
    onNavigate: (callback: (data: { tabId: string; url: string }) => void) => {
      ipcRenderer.on('webview:navigate', (_event, data) => callback(data))
      return () => ipcRenderer.removeAllListeners('webview:navigate')
    },
  },

  bookmarks: {
    add: (bookmark: { title: string; url: string; favicon: string | null; folderId?: number | null }) =>
      ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_ADD, bookmark),
    remove: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_REMOVE, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_LIST),
    check: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_CHECK, url),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.BOOKMARK_GET_ALL),
  },

  history: {
    add: (entry: { title: string; url: string; favicon: string | null }) =>
      ipcRenderer.invoke(IPC_CHANNELS.HISTORY_ADD, entry),
    remove: (id: number) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_REMOVE, id),
    clear: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_CLEAR),
    search: (query: string) => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_SEARCH, query),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_GET_ALL),
  },

  downloads: {
    start: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_START, url),
    cancel: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_CANCEL, id),
    pause: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_PAUSE, id),
    resume: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_RESUME, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_LIST),
    open: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_OPEN, id),
    show: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_SHOW, id),
    getDownloadPath: () => ipcRenderer.invoke(IPC_CHANNELS.DOWNLOAD_GET_PATH),
    onProgress: (callback: (data: unknown) => void) => {
      ipcRenderer.on('download:progress', (_event, data) => callback(data))
      return () => ipcRenderer.removeAllListeners('download:progress')
    },
    onComplete: (callback: (data: unknown) => void) => {
      ipcRenderer.on('download:complete', (_event, data) => callback(data))
      return () => ipcRenderer.removeAllListeners('download:complete')
    },
  },

  settings: {
    get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET, key),
    set: (key: string, value: unknown) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, key, value),
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET_ALL),
    onChanged: (callback: (key: string, value: unknown) => void) => {
      ipcRenderer.on('settings:changed', (_event, key, value) => callback(key, value))
      return () => ipcRenderer.removeAllListeners('settings:changed')
    },
  },

  workspaces: {
    create: (workspace: { name: string; icon?: string; color?: string }) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_CREATE, workspace),
    delete: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_DELETE, id),
    list: () => ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_LIST),
    update: (id: string, updates: Record<string, unknown>) =>
      ipcRenderer.invoke(IPC_CHANNELS.WORKSPACE_UPDATE, id, updates),
  },

  permissions: {
    check: (url: string, permission: string) => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_CHECK, url, permission),
    grant: (url: string, permission: string) => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_GRANT, url, permission),
    deny: (url: string, permission: string) => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_DENY, url, permission),
  },

  window: {
    minimize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MINIMIZE),
    maximize: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_MAXIMIZE),
    close: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_CLOSE),
    isMaximized: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED),
    onMaximizedChanged: (callback: (maximized: boolean) => void) => {
      ipcRenderer.on('window:maximized-changed', (_event, maximized) => callback(maximized))
      return () => ipcRenderer.removeAllListeners('window:maximized-changed')
    },
  },

  devtools: {
    open: (tabId?: string) => ipcRenderer.invoke(IPC_CHANNELS.OPEN_DEVTOOLS, tabId),
    viewSource: (url: string) => ipcRenderer.invoke(IPC_CHANNELS.VIEW_SOURCE, url),
    onOpenTab: (callback: (tabId: string) => void) => {
      ipcRenderer.on('devtools:open-tab', (_event, tabId) => callback(tabId))
      return () => ipcRenderer.removeAllListeners('devtools:open-tab')
    },
  },

  webview: {
    onBack: (callback: (tabId: string) => void) => {
      ipcRenderer.on('webview:back', (_event, tabId) => callback(tabId))
      return () => ipcRenderer.removeAllListeners('webview:back')
    },
    onForward: (callback: (tabId: string) => void) => {
      ipcRenderer.on('webview:forward', (_event, tabId) => callback(tabId))
      return () => ipcRenderer.removeAllListeners('webview:forward')
    },
    onReload: (callback: (tabId: string) => void) => {
      ipcRenderer.on('webview:reload', (_event, tabId) => callback(tabId))
      return () => ipcRenderer.removeAllListeners('webview:reload')
    },
    onHardReload: (callback: (tabId: string) => void) => {
      ipcRenderer.on('webview:hard-reload', (_event, tabId) => callback(tabId))
      return () => ipcRenderer.removeAllListeners('webview:hard-reload')
    },
    onViewSource: (callback: (url: string) => void) => {
      ipcRenderer.on('webview:view-source', (_event, url) => callback(url))
      return () => ipcRenderer.removeAllListeners('webview:view-source')
    },
  },

  reader: {
    check: (tabId: string) => ipcRenderer.invoke('reader:check', tabId),
    activate: (tabId: string) => ipcRenderer.invoke('reader:activate', tabId),
    deactivate: (tabId: string) => ipcRenderer.invoke('reader:deactivate', tabId),
    getCss: () => ipcRenderer.invoke('reader:get-css'),
  },

  shield: {
    get: (hostname: string) => ipcRenderer.invoke('shield:get', hostname),
    set: (hostname: string, key: string, value: boolean) => ipcRenderer.invoke('shield:set', hostname, key, value),
    delete: (hostname: string) => ipcRenderer.invoke('shield:delete', hostname),
    getAll: () => ipcRenderer.invoke('shield:get-all'),
  },

  omnibox: {
    suggestions: (query: string) => ipcRenderer.invoke('omnibox:suggestions', query),
  },
}

contextBridge.exposeInMainWorld('dipAPI', electronAPI)

export type ElectronAPI = typeof electronAPI
