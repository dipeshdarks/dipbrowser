import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'
import { getSiteShields, setSiteShield, deleteSiteShield, getAllSiteShields } from '../services/shields'

export function registerShieldIpc(window: BrowserWindow): void {
  ipcMain.handle('shield:get', (_event, hostname: string) => {
    return getSiteShields(hostname)
  })

  ipcMain.handle('shield:set', (_event, hostname: string, key: string, value: boolean) => {
    setSiteShield(hostname, key as any, value)
    return true
  })

  ipcMain.handle('shield:delete', (_event, hostname: string) => {
    deleteSiteShield(hostname)
    return true
  })

  ipcMain.handle('shield:get-all', () => {
    return getAllSiteShields()
  })
}
