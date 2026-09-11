import { useEffect, useCallback } from 'react'
import { useTabStore } from './stores/tab-store'
import { useSettingsStore } from './stores/settings-store'
import { useUIStore } from './stores/ui-store'
import { useBookmarkStore } from './stores/bookmark-store'
import TitleBar from './components/TitleBar/TitleBar'
import TabBar from './components/TabBar/TabBar'
import NavigationBar from './components/Navigation/NavigationBar'
import BookmarkBar from './components/Bookmarks/BookmarkBar'
import Sidebar from './components/Sidebar/Sidebar'
import TabContent from './components/TabBar/TabContent'
import ContextMenu from './components/common/ContextMenu'
import DownloadPanel from './components/Downloads/DownloadPanel'
import SettingsPage from './components/Settings/SettingsPage'
import api from './lib/ipc-client'

export default function App() {
  const { tabs, activeTabId, createTab, setTabs, setWorkspace } = useTabStore()
  const { settings, loadSettings, loadDownloads, loadWorkspaces } = useSettingsStore()
  const { sidebarOpen, activePanel, setActivePanel, setIsMaximized, showBookmarkBar } = useUIStore()
  const { loadBookmarks } = useBookmarkStore()

  useEffect(() => {
    const init = async () => {
      await loadSettings()
      await loadBookmarks()
      await loadWorkspaces()
      await loadDownloads()

      const existingTabs = await api.tabs.list()
      if (existingTabs.length === 0) {
        await createTab()
      } else {
        setTabs(existingTabs as any)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (settings) {
      useUIStore.getState().setShowBookmarkBar(settings.showBookmarkBar)
      useUIStore.getState().setSidebarOpen(settings.showSidebar)
    }
  }, [settings])

  useEffect(() => {
    const unmaximize = api.window.onMaximizedChanged((maximized) => {
      setIsMaximized(maximized)
    })
    return () => { unmaximize() }
  }, [])

  const handleNewTab = useCallback(() => {
    createTab()
  }, [createTab])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 't') {
        e.preventDefault()
        handleNewTab()
      }
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault()
        if (activeTabId) {
          useTabStore.getState().closeTab(activeTabId)
        }
      }
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault()
        const allTabs = useTabStore.getState().getWorkspaceTabs()
        const currentIndex = allTabs.findIndex((t) => t.id === activeTabId)
        const nextIndex = e.shiftKey
          ? (currentIndex - 1 + allTabs.length) % allTabs.length
          : (currentIndex + 1) % allTabs.length
        if (allTabs[nextIndex]) {
          useTabStore.getState().switchTab(allTabs[nextIndex].id)
        }
      }
      if (e.ctrlKey && e.key === 'l') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('#omnibox')?.focus()
        document.querySelector<HTMLInputElement>('#omnibox')?.select()
      }
      if (e.key === 'F5') {
        e.preventDefault()
        if (activeTabId) api.navigation.reload(activeTabId)
      }
      if (e.key === 'F12') {
        e.preventDefault()
        api.devtools.open(activeTabId ?? undefined)
      }
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        useUIStore.getState().toggleSidebar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTabId, handleNewTab])

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-dip-bg">
      <TitleBar />
      <TabBar />

      <div className="flex flex-1 min-h-0">
        {sidebarOpen && <Sidebar />}

        <div className="flex flex-col flex-1 min-w-0">
          <NavigationBar />

          {showBookmarkBar && <BookmarkBar />}

          <div className="flex-1 relative min-h-0">
            <TabContent />
          </div>
        </div>

        {activePanel === 'downloads' && <DownloadPanel />}
        {activePanel === 'settings' && <SettingsPage />}
      </div>

      <ContextMenu />
    </div>
  )
}
