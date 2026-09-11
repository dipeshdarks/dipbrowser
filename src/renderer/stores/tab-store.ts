import { create } from 'zustand'
import { Tab } from '@shared/types'
import api from '../lib/ipc-client'

interface TabStore {
  tabs: Tab[]
  activeTabId: string | null
  currentWorkspaceId: string

  createTab: (url?: string, workspaceId?: string) => Promise<Tab>
  closeTab: (id: string) => Promise<void>
  switchTab: (id: string) => Promise<void>
  updateTab: (id: string, updates: Partial<Tab>) => Promise<void>
  updateTabLocal: (id: string, updates: Partial<Tab>) => void
  reorderTab: (id: string, position: number) => Promise<void>
  pinTab: (id: string) => Promise<void>
  restoreTab: () => Promise<Tab | null>
  setWorkspace: (workspaceId: string) => void
  setTabs: (tabs: Tab[]) => void
  getWorkspaceTabs: () => Tab[]
  getActiveTab: () => Tab | undefined
}

export const useTabStore = create<TabStore>((set, get) => ({
  tabs: [],
  activeTabId: null,
  currentWorkspaceId: 'personal',

  createTab: async (url?: string, workspaceId?: string) => {
    const ws = workspaceId || get().currentWorkspaceId
    const tab = await api.tabs.create(url, ws)
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id,
    }))
    return tab
  },

  closeTab: async (id: string) => {
    await api.tabs.close(id)
    set((state) => {
      const remaining = state.tabs.filter((t) => t.id !== id)
      let nextActive = state.activeTabId

      if (state.activeTabId === id) {
        const closedIndex = state.tabs.findIndex((t) => t.id === id)
        nextActive = remaining[Math.min(closedIndex, remaining.length - 1)]?.id ?? null
      }

      return { tabs: remaining, activeTabId: nextActive }
    })
  },

  switchTab: async (id: string) => {
    await api.tabs.switch(id)
    set({ activeTabId: id })
  },

  updateTab: async (id: string, updates: Partial<Tab>) => {
    await api.tabs.update(id, updates as Record<string, unknown>)
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  updateTabLocal: (id: string, updates: Partial<Tab>) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  },

  reorderTab: async (id: string, position: number) => {
    await api.tabs.reorder(id, position)
  },

  pinTab: async (id: string) => {
    await api.tabs.pin(id)
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
    }))
  },

  restoreTab: async () => {
    const tab = await api.tabs.restore()
    if (tab) {
      set((state) => ({
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      }))
    }
    return tab
  },

  setWorkspace: (workspaceId: string) => {
    set({ currentWorkspaceId: workspaceId })
  },

  setTabs: (tabs: Tab[]) => {
    set({ tabs })
  },

  getWorkspaceTabs: () => {
    const state = get()
    return state.tabs
      .filter((t) => t.workspaceId === state.currentWorkspaceId)
      .sort((a, b) => {
        if (a.pinned && !b.pinned) return -1
        if (!a.pinned && b.pinned) return 1
        return a.position - b.position
      })
  },

  getActiveTab: () => {
    const state = get()
    return state.tabs.find((t) => t.id === state.activeTabId)
  },
}))
