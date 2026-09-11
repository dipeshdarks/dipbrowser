import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  sidebarWidth: number
  activePanel: 'none' | 'bookmarks' | 'history' | 'downloads' | 'settings' | 'extensions'
  showBookmarkBar: boolean
  isMaximized: boolean
  contextMenu: { x: number; y: number; items: ContextMenuItem[] } | null

  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setSidebarWidth: (width: number) => void
  setActivePanel: (panel: UIStore['activePanel']) => void
  setShowBookmarkBar: (show: boolean) => void
  setIsMaximized: (maximized: boolean) => void
  showContextMenu: (x: number, y: number, items: ContextMenuItem[]) => void
  hideContextMenu: () => void
}

export interface ContextMenuItem {
  label: string
  icon?: string
  action?: () => void
  separator?: boolean
  disabled?: boolean
}

export const useUIStore = create<UIStore>((set, get) => ({
  sidebarOpen: true,
  sidebarWidth: 220,
  activePanel: 'none',
  showBookmarkBar: false,
  isMaximized: false,
  contextMenu: null,

  toggleSidebar: () => {
    const next = !get().sidebarOpen
    set({ sidebarOpen: next })
    window.dipAPI?.settings.set('showSidebar', next)
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  setShowBookmarkBar: (show) => set({ showBookmarkBar: show }),
  setIsMaximized: (maximized) => set({ isMaximized: maximized }),
  showContextMenu: (x, y, items) => set({ contextMenu: { x, y, items } }),
  hideContextMenu: () => set({ contextMenu: null }),
}))
