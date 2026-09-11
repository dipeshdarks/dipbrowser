import { create } from 'zustand'
import { Settings, DownloadItem, Workspace } from '@shared/types'
import api from '../lib/ipc-client'

interface SettingsStore {
  settings: Settings | null
  downloads: DownloadItem[]
  workspaces: Workspace[]

  loadSettings: () => Promise<void>
  updateSetting: (key: string, value: unknown) => Promise<void>
  loadDownloads: () => Promise<void>
  startDownload: (url: string) => Promise<void>
  cancelDownload: (id: string) => Promise<void>
  openDownload: (id: string) => Promise<void>
  showDownload: (id: string) => Promise<void>
  loadWorkspaces: () => Promise<void>
  createWorkspace: (name: string, icon?: string, color?: string) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  settings: null,
  downloads: [],
  workspaces: [],

  loadSettings: async () => {
    const settings = await api.settings.getAll()
    set({ settings })
  },

  updateSetting: async (key: string, value: unknown) => {
    await api.settings.set(key, value)
    set((state) => ({
      settings: state.settings ? { ...state.settings, [key]: value } : null,
    }))
  },

  loadDownloads: async () => {
    const downloads = await api.downloads.list()
    set({ downloads })
  },

  startDownload: async (url: string) => {
    await api.downloads.start(url)
    const downloads = await api.downloads.list()
    set({ downloads })
  },

  cancelDownload: async (id: string) => {
    await api.downloads.cancel(id)
    const downloads = await api.downloads.list()
    set({ downloads })
  },

  openDownload: async (id: string) => {
    await api.downloads.open(id)
  },

  showDownload: async (id: string) => {
    await api.downloads.show(id)
  },

  loadWorkspaces: async () => {
    const workspaces = await api.workspaces.list()
    set({ workspaces })
  },

  createWorkspace: async (name: string, icon?: string, color?: string) => {
    await api.workspaces.create({ name, icon, color })
    const workspaces = await api.workspaces.list()
    set({ workspaces })
  },

  deleteWorkspace: async (id: string) => {
    await api.workspaces.delete(id)
    const workspaces = await api.workspaces.list()
    set({ workspaces })
  },
}))
