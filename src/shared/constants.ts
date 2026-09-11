export const APP_NAME = 'DipBrowser'

export const DEFAULT_SEARCH_ENGINE = 'Google'
export const SEARCH_ENGINES: Record<string, string> = {
  Google: 'https://www.google.com/search?q=%s',
  Bing: 'https://www.bing.com/search?q=%s',
  DuckDuckGo: 'https://duckduckgo.com/?q=%s',
  Yahoo: 'https://search.yahoo.com/search?p=%s',
  Brave: 'https://search.brave.com/search?q=%s',
}

export const DEFAULT_HOMEPAGE = 'dipbrowser://newtab'

export const DB_VERSION = 1

export const IPC_CHANNELS = {
  TAB_CREATE: 'tab:create',
  TAB_CLOSE: 'tab:close',
  TAB_SWITCH: 'tab:switch',
  TAB_UPDATE: 'tab:update',
  TAB_LIST: 'tab:list',
  TAB_REORDER: 'tab:reorder',
  TAB_PIN: 'tab:pin',
  TAB_RESTORE: 'tab:restore',
  TAB_SUSPEND: 'tab:suspend',
  TAB_RESUME: 'tab:resume',

  NAVIGATE: 'navigation:navigate',
  BACK: 'navigation:back',
  FORWARD: 'navigation:forward',
  RELOAD: 'navigation:reload',
  HARD_RELOAD: 'navigation:hard-reload',
  GET_URL: 'navigation:get-url',

  BOOKMARK_ADD: 'bookmark:add',
  BOOKMARK_REMOVE: 'bookmark:remove',
  BOOKMARK_LIST: 'bookmark:list',
  BOOKMARK_CHECK: 'bookmark:check',
  BOOKMARK_GET_ALL: 'bookmark:get-all',

  HISTORY_ADD: 'history:add',
  HISTORY_REMOVE: 'history:remove',
  HISTORY_CLEAR: 'history:clear',
  HISTORY_SEARCH: 'history:search',
  HISTORY_GET_ALL: 'history:get-all',

  DOWNLOAD_START: 'download:start',
  DOWNLOAD_CANCEL: 'download:cancel',
  DOWNLOAD_PAUSE: 'download:pause',
  DOWNLOAD_RESUME: 'download:resume',
  DOWNLOAD_LIST: 'download:list',
  DOWNLOAD_GET_PATH: 'download:get-path',
  DOWNLOAD_OPEN: 'download:open',
  DOWNLOAD_SHOW: 'download:show',

  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',

  WORKSPACE_CREATE: 'workspace:create',
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_LIST: 'workspace:list',
  WORKSPACE_UPDATE: 'workspace:update',

  PERMISSION_CHECK: 'permission:check',
  PERMISSION_GRANT: 'permission:grant',
  PERMISSION_DENY: 'permission:deny',

  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  OPEN_DEVTOOLS: 'devtools:open',
  VIEW_SOURCE: 'devtools:view-source',

  SHOW_CONTEXT_MENU: 'context-menu:show',
} as const

export const NEWTAB_SHORTCUTS = [
  { name: 'Google', url: 'https://www.google.com', color: '#4285F4', letter: 'G' },
  { name: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000', letter: 'Y' },
  { name: 'GitHub', url: 'https://github.com', color: '#333333', letter: 'GH' },
  { name: 'Twitter', url: 'https://twitter.com', color: '#1DA1F2', letter: 'X' },
  { name: 'Notion', url: 'https://www.notion.so', color: '#000000', letter: 'N' },
  { name: 'Figma', url: 'https://www.figma.com', color: '#A259FF', letter: 'F' },
  { name: 'LinkedIn', url: 'https://www.linkedin.com', color: '#0A66C2', letter: 'in' },
]
