export interface Tab {
  id: string
  title: string
  url: string
  favicon: string | null
  loading: boolean
  pinned: boolean
  workspaceId: string
  partition: string
  lastActive: number
  position: number
}

export interface Bookmark {
  id: number
  title: string
  url: string
  favicon: string | null
  folderId: number | null
  position: number
  createdAt: string
}

export interface BookmarkFolder {
  id: number
  name: string
  parentId: number | null
  position: number
}

export interface HistoryEntry {
  id: number
  title: string
  url: string
  favicon: string | null
  visitCount: number
  lastVisited: string
}

export interface DownloadItem {
  id: string
  url: string
  filename: string
  path: string
  totalBytes: number
  receivedBytes: number
  state: 'progressing' | 'completed' | 'cancelled' | 'paused'
  startTime: string
  mimeType: string
}

export interface Workspace {
  id: string
  name: string
  icon: string
  color: string
  position: number
}

export interface SitePermission {
  url: string
  permission: string
  granted: boolean
}

export interface BrowserSettings {
  homepage: string
  searchEngine: string
  searchEngineUrl: string
  showBookmarkBar: boolean
  showSidebar: boolean
  downloadPath: string
  httpsUpgrade: boolean
  adBlocker: boolean
  trackerBlocking: boolean
  queryFiltering: boolean
  gpcHeader: boolean
  clearCookiesOnExit: boolean
  sleepingTabsEnabled: boolean
  sleepingTabsTimeout: number
  theme: 'dark' | 'light' | 'system'
  language: string
  ephemeralStorage: boolean
  deAmpEnabled: boolean
  cosmeticFiltering: boolean
  speedreaderEnabled: boolean
  fingerprintProtection: boolean
  referrerTrimming: boolean
}

export interface Settings {
  homepage: string
  searchEngine: string
  searchEngineUrl: string
  showBookmarkBar: boolean
  showSidebar: boolean
  downloadPath: string
  httpsUpgrade: boolean
  adBlocker: boolean
  trackerBlocking: boolean
  queryFiltering: boolean
  gpcHeader: boolean
  clearCookiesOnExit: boolean
  sleepingTabsEnabled: boolean
  sleepingTabsTimeout: number
  theme: 'dark' | 'light' | 'system'
  language: string
  ephemeralStorage: boolean
  deAmpEnabled: boolean
  cosmeticFiltering: boolean
  speedreaderEnabled: boolean
  fingerprintProtection: boolean
  referrerTrimming: boolean
}

export interface SiteShieldSettings {
  hostname: string
  adBlocker: boolean
  trackerBlocking: boolean
  httpsUpgrade: boolean
  queryFiltering: boolean
  gpcHeader: boolean
}

export interface FilterList {
  id: number
  name: string
  url: string
  content: string | null
  lastUpdated: string | null
  enabled: boolean
}

export interface CosmeticFilter {
  selector: string
  domain: string | null
}

export interface ReaderArticle {
  title: string
  content: string
  byline: string | null
  siteName: string | null
  length: number
}
