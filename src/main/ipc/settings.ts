import { BrowserWindow, ipcMain, dialog } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import { getDatabase } from '../database/sqlite'
import { Settings } from '../../shared/types'
import { refreshSecuritySettings } from '../services/security'

const DEFAULT_SETTINGS: Settings = {
  homepage: 'dipbrowser://newtab',
  searchEngine: 'Google',
  searchEngineUrl: 'https://www.google.com/search?q=%s',
  showBookmarkBar: false,
  showSidebar: true,
  downloadPath: '',
  httpsUpgrade: true,
  adBlocker: true,
  trackerBlocking: true,
  queryFiltering: true,
  gpcHeader: true,
  clearCookiesOnExit: false,
  sleepingTabsEnabled: true,
  sleepingTabsTimeout: 300,
  theme: 'dark',
  language: 'en',
  ephemeralStorage: true,
  deAmpEnabled: true,
  cosmeticFiltering: true,
  speedreaderEnabled: true,
  fingerprintProtection: true,
  referrerTrimming: true,
}

let settingsCache: Settings | null = null

function loadSettingsFromDb(): Settings {
  const db = getDatabase()
  const rows = db.prepare('SELECT key, value FROM settings WHERE key != ?').all('db_version') as Array<{ key: string; value: string }>

  const settings = { ...DEFAULT_SETTINGS }
  for (const row of rows) {
    const key = row.key as keyof Settings
    if (key in settings) {
      const value = row.value
      if (typeof settings[key] === 'boolean') {
        (settings as Record<string, unknown>)[key] = value === 'true'
      } else if (typeof settings[key] === 'number') {
        (settings as Record<string, unknown>)[key] = Number(value)
      } else {
        (settings as Record<string, unknown>)[key] = value
      }
    }
  }
  return settings
}

export function getSettings(): Settings {
  if (!settingsCache) {
    settingsCache = loadSettingsFromDb()
  }
  return settingsCache
}

function invalidateSettingsCache(): void {
  settingsCache = null
  const settings = getSettings()
  refreshSecuritySettings({
    httpsUpgrade: settings.httpsUpgrade,
    adBlocker: settings.adBlocker,
    trackerBlocking: settings.trackerBlocking,
    queryFiltering: settings.queryFiltering,
    gpcHeader: settings.gpcHeader,
    deAmpEnabled: settings.deAmpEnabled,
    cosmeticFiltering: settings.cosmeticFiltering,
    fingerprintProtection: settings.fingerprintProtection,
    referrerTrimming: settings.referrerTrimming,
  })
}

export function registerSettingsIpc(window: BrowserWindow): void {
  invalidateSettingsCache()

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, (_event, key: string) => {
    const settings = getSettings()
    return (settings as Record<string, unknown>)[key]
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET, (_event, key: string, value: unknown) => {
    const db = getDatabase()
    db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run(key, String(value))
    invalidateSettingsCache()
    window.webContents.send('settings:changed', key, value)
    return true
  })

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_ALL, () => {
    return getSettings()
  })

  ipcMain.handle(IPC_CHANNELS.DOWNLOAD_GET_PATH, async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: 'Select Download Folder',
    })
    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0]
    }
    return null
  })
}
