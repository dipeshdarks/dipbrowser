import { create } from 'zustand'
import { HistoryEntry } from '@shared/types'
import api from '../lib/ipc-client'

interface HistoryStore {
  entries: HistoryEntry[]
  searchResults: HistoryEntry[]
  loading: boolean

  loadHistory: () => Promise<void>
  searchHistory: (query: string) => Promise<void>
  removeEntry: (id: number) => Promise<void>
  clearHistory: () => Promise<void>
}

export const useHistoryStore = create<HistoryStore>((set) => ({
  entries: [],
  searchResults: [],
  loading: false,

  loadHistory: async () => {
    set({ loading: true })
    const entries = await api.history.getAll()
    set({ entries, loading: false })
  },

  searchHistory: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: [] })
      return
    }
    const results = await api.history.search(query)
    set({ searchResults: results })
  },

  removeEntry: async (id: number) => {
    await api.history.remove(id)
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }))
  },

  clearHistory: async () => {
    await api.history.clear()
    set({ entries: [], searchResults: [] })
  },
}))
