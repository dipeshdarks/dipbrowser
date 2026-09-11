import { useState, useCallback } from 'react'
import { useTabStore } from '../../stores/tab-store'
import { useSettingsStore } from '../../stores/settings-store'
import { useUIStore } from '../../stores/ui-store'
import api from '../../lib/ipc-client'

interface SidebarItem {
  id: string
  icon: React.ReactNode
  label: string
  panel?: string
}

export default function Sidebar() {
  const { sidebarWidth, activePanel, setActivePanel, toggleSidebar } = useUIStore()
  const { currentWorkspaceId, setWorkspace } = useTabStore()
  const { workspaces } = useSettingsStore()
  const [showWorkspaces, setShowWorkspaces] = useState(true)

  const items: SidebarItem[] = [
    {
      id: 'home',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 9L9 3L15 9" />
          <path d="M4 8V15H7.5V11H10.5V15H14V8" />
        </svg>
      ),
      label: 'Home',
    },
    {
      id: 'bookmarks',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 3H14V17L9 13L4 17V3Z" />
        </svg>
      ),
      label: 'Bookmarks',
      panel: 'bookmarks',
    },
    {
      id: 'history',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="9" r="6" />
          <path d="M9 6V9L11 11" />
        </svg>
      ),
      label: 'History',
      panel: 'history',
    },
    {
      id: 'downloads',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 3V12" />
          <path d="M5 9L9 13L13 9" />
          <path d="M3 15H15" />
        </svg>
      ),
      label: 'Downloads',
      panel: 'downloads',
    },
    {
      id: 'extensions',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 2H12V6H16V12H12V16H6V12H2V6H6V2Z" />
        </svg>
      ),
      label: 'Extensions',
    },
    {
      id: 'notes',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="2" width="12" height="14" rx="2" />
          <line x1="6" y1="6" x2="12" y2="6" />
          <line x1="6" y1="9" x2="12" y2="9" />
          <line x1="6" y1="12" x2="9" y2="12" />
        </svg>
      ),
      label: 'Notes',
    },
    {
      id: 'settings',
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="9" r="2" />
          <path d="M9 2V4M9 14V16M16 9H14M4 9H2M14 4L12.5 5.5M5.5 12.5L4 14M14 14L12.5 12.5M5.5 5.5L4 4" />
        </svg>
      ),
      label: 'Settings',
      panel: 'settings',
    },
  ]

  const handleItemClick = useCallback((item: SidebarItem) => {
    if (item.id === 'home') {
      const activeTab = useTabStore.getState().getActiveTab()
      if (activeTab) {
        api.navigation.navigate(activeTab.id, 'dipbrowser://newtab')
      }
      return
    }
    if (item.panel) {
      setActivePanel(activePanel === item.panel ? 'none' : item.panel)
    }
  }, [activePanel, setActivePanel])

  return (
    <div
      className="flex flex-col h-full bg-dip-surface border-r border-dip-border shrink-0 overflow-hidden"
      style={{ width: sidebarWidth }}
    >
      <div className="flex items-center justify-between px-2 py-2 border-b border-dip-border">
        <span className="text-xs font-semibold text-dip-text-secondary px-2">DipBrowser</span>
        <button
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-dip-surface-2 text-dip-text-muted transition-colors"
          onClick={toggleSidebar}
          title="Toggle Sidebar"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4H12M2 7H12M2 10H12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        <div className="px-2 space-y-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                activePanel === item.panel
                  ? 'bg-dip-surface-2 text-dip-accent'
                  : 'text-dip-text-secondary hover:bg-dip-surface-2 hover:text-dip-text'
              }`}
              onClick={() => handleItemClick(item)}
            >
              <span className="shrink-0">{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="px-2 mt-4">
          <button
            className="flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-dip-text-secondary"
            onClick={() => setShowWorkspaces(!showWorkspaces)}
          >
            <span>Workspaces</span>
            <svg
              width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
              className={`transition-transform ${showWorkspaces ? 'rotate-0' : '-rotate-90'}`}
            >
              <path d="M2 3L5 6L8 3" />
            </svg>
          </button>

          {showWorkspaces && (
            <div className="space-y-0.5 mt-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentWorkspaceId === ws.id
                      ? 'bg-dip-surface-2 text-dip-text'
                      : 'text-dip-text-secondary hover:bg-dip-surface-2 hover:text-dip-text'
                  }`}
                  onClick={() => setWorkspace(ws.id)}
                >
                  <span
                    className="w-6 h-6 rounded-md flex items-center justify-center text-xs shrink-0"
                    style={{ backgroundColor: ws.color + '20', color: ws.color }}
                  >
                    {ws.icon}
                  </span>
                  <span className="truncate">{ws.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-dip-border px-3 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-dip-accent/20 flex items-center justify-center text-dip-accent text-xs font-bold">
            D
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-dip-text truncate">DipSync</div>
            <div className="text-[10px] text-dip-text-muted flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-dip-success animate-pulse-dot" />
              Synced
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
