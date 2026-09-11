import { create } from 'zustand'
import { Bookmark } from '@shared/types'
import api from '../lib/ipc-client'

interface BookmarkStore {
  bookmarks: Bookmark[]
  loading: boolean

  loadBookmarks: () => Promise<void>
  addBookmark: (bookmark: { title: string; url: string; favicon: string | null; folderId?: number | null }) => Promise<Bookmark>
  removeBookmark: (id: number) => Promise<void>
  isBookmarked: (url: string) => Promise<number | null>
}

export const useBookmarkStore = create<BookmarkStore>((set) => ({
  bookmarks: [],
  loading: false,

  loadBookmarks: async () => {
    set({ loading: true })
    const bookmarks = await api.bookmarks.list()
    set({ bookmarks, loading: false })
  },

  addBookmark: async (bookmark) => {
    const result = await api.bookmarks.add(bookmark)
    set((state) => ({ bookmarks: [...state.bookmarks, result] }))
    return result
  },

  removeBookmark: async (id: number) => {
    await api.bookmarks.remove(id)
    set((state) => ({
      bookmarks: state.bookmarks.filter((b) => b.id !== id),
    }))
  },

  isBookmarked: async (url: string) => {
    return api.bookmarks.check(url)
  },
}))
