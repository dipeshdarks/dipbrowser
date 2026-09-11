import { useState, useCallback, useEffect } from 'react'
import { useTabStore } from '../../stores/tab-store'
import { useBookmarkStore } from '../../stores/bookmark-store'
import { useSettingsStore } from '../../stores/settings-store'
import api from '../../lib/ipc-client'
import ShieldsPanel from '../Shields/ShieldsPanel'
import OmniboxDropdown from './OmniboxDropdown'

export default function NavigationBar() {
  const { activeTabId, getActiveTab, updateTab } = useTabStore()
  const { settings } = useSettingsStore()
  const activeTab = getActiveTab()
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isReaderMode, setIsReaderMode] = useState(false)
  const [showShields, setShowShields] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  useEffect(() => {
    if (activeTab && !isEditing) {
      setInputValue(activeTab.url === 'dipbrowser://newtab' ? '' : activeTab.url)
    }
  }, [activeTab?.url, isEditing])

  useEffect(() => {
    if (activeTab?.url) {
      useBookmarkStore.getState().isBookmarked(activeTab.url).then((id) => {
        setIsBookmarked(id !== null)
      })
    }
  }, [activeTab?.url])

  const handleNavigate = useCallback(async () => {
    if (!activeTabId || !inputValue.trim()) return
    const url = inputValue.trim()
    let finalUrl = url

    if (url.startsWith('search://')) {
      finalUrl = url.replace('search://', '')
    }

    const resolvedUrl = await api.navigation.navigate(activeTabId, finalUrl)
    useTabStore.getState().updateTabLocal(activeTabId, { url: resolvedUrl || finalUrl, loading: true })
    setIsEditing(false)
    setShowDropdown(false)
  }, [activeTabId, inputValue])

  const handleBack = useCallback(() => {
    if (activeTabId) api.navigation.back(activeTabId)
  }, [activeTabId])

  const handleForward = useCallback(() => {
    if (activeTabId) api.navigation.forward(activeTabId)
  }, [activeTabId])

  const handleReload = useCallback(() => {
    if (activeTabId) api.navigation.reload(activeTabId)
  }, [activeTabId])

  const handleHardReload = useCallback(() => {
    if (activeTabId) api.navigation.hardReload(activeTabId)
  }, [activeTabId])

  const handleToggleBookmark = useCallback(async () => {
    if (!activeTab) return
    if (isBookmarked) {
      const id = await useBookmarkStore.getState().isBookmarked(activeTab.url)
      if (id) await useBookmarkStore.getState().removeBookmark(id)
      setIsBookmarked(false)
    } else {
      await useBookmarkStore.getState().addBookmark({
        title: activeTab.title,
        url: activeTab.url,
        favicon: activeTab.favicon,
      })
      setIsBookmarked(true)
    }
  }, [activeTab, isBookmarked])

  const handleToggleReaderMode = useCallback(async () => {
    if (!activeTabId) return
    if (isReaderMode) {
      await window.dipAPI.reader.deactivate(activeTabId)
      setIsReaderMode(false)
    } else {
      await window.dipAPI.reader.activate(activeTabId)
      setIsReaderMode(true)
    }
  }, [activeTabId, isReaderMode])

  const handleOmniboxSelect = useCallback((url: string) => {
    if (!activeTabId) return
    let finalUrl = url
    if (url.startsWith('search://')) {
      finalUrl = url.replace('search://', '')
    }
    api.navigation.navigate(activeTabId, finalUrl)
    useTabStore.getState().updateTabLocal(activeTabId, { url: finalUrl, loading: true })
    setIsEditing(false)
    setShowDropdown(false)
  }, [activeTabId])

  const getDisplayUrl = () => {
    if (!activeTab) return ''
    if (activeTab.url === 'dipbrowser://newtab') return ''
    try {
      const url = new URL(activeTab.url)
      return url.hostname + url.pathname.replace(/\/$/, '')
    } catch {
      return activeTab.url
    }
  }

  return (
    <div className="flex items-center h-10 px-2 gap-1 bg-dip-bg border-b border-dip-border no-drag">
      <NavButton onClick={handleBack} title="Back" disabled={!activeTab}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M10 3L5 8L10 13" />
        </svg>
      </NavButton>

      <NavButton onClick={handleForward} title="Forward" disabled={!activeTab}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 3L11 8L6 13" />
        </svg>
      </NavButton>

      <NavButton onClick={handleReload} title="Reload">
        {activeTab?.loading ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="animate-spin">
            <path d="M7 1A6 6 0 1 0 13 7" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 7A5 5 0 1 1 7 2" />
            <path d="M7 2L10 2L10 5" />
          </svg>
        )}
      </NavButton>

      <NavButton onClick={handleHardReload} title="Hard Reload">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 7A5 5 0 1 1 7 2" />
          <path d="M7 2L10 2L10 5" />
        </svg>
      </NavButton>

      <NavButton title="Home" onClick={() => {
        if (activeTabId) api.navigation.navigate(activeTabId, 'dipbrowser://newtab')
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 7L7 2L12 7" />
          <path d="M3 6.5V12H6V9H8V12H11V6.5" />
        </svg>
      </NavButton>

      <div className="flex-1 relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dip-text-muted pointer-events-none">
          {activeTab?.url && activeTab.url.startsWith('https') ? (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="7" width="8" height="7" rx="1" />
              <path d="M5.5 7V5.5A1.5 1.5 0 0 1 7 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
            </svg>
          ) : (
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="5" />
              <line x1="3" y1="8" x2="13" y2="8" />
              <ellipse cx="8" cy="8" rx="2.5" ry="5" />
            </svg>
          )}
        </div>
        <input
          id="omnibox"
          type="text"
          value={isEditing ? inputValue : getDisplayUrl()}
          onChange={(e) => {
            setInputValue(e.target.value)
            setShowDropdown(true)
          }}
          onFocus={() => {
            setIsEditing(true)
            setShowDropdown(true)
            setInputValue(activeTab?.url === 'dipbrowser://newtab' ? '' : activeTab?.url || '')
            setTimeout(() => document.querySelector<HTMLInputElement>('#omnibox')?.select(), 0)
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsEditing(false)
              setShowDropdown(false)
            }, 200)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleNavigate()
            if (e.key === 'Escape') {
              setIsEditing(false)
              setShowDropdown(false)
              setInputValue(getDisplayUrl())
            }
          }}
          placeholder="Search Google or type a URL"
          className="w-full h-8 pl-9 pr-3 bg-dip-surface border border-dip-border rounded-lg text-dip-text text-xs focus:outline-none focus:ring-2 focus:ring-dip-accent/50 focus:border-dip-accent placeholder-dip-text-muted transition-all"
        />
        <OmniboxDropdown
          query={inputValue}
          onSelect={handleOmniboxSelect}
          visible={showDropdown && isEditing}
        />
      </div>

      <NavButton onClick={handleToggleBookmark} title={isBookmarked ? 'Remove Bookmark' : 'Bookmark this page'}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill={isBookmarked ? '#1ED5A9' : 'none'} stroke={isBookmarked ? '#1ED5A9' : 'currentColor'} strokeWidth="1.5">
          <path d="M3 2H11V13L7 10L3 13V2Z" />
        </svg>
      </NavButton>

      {settings?.speedreaderEnabled && (
        <NavButton onClick={handleToggleReaderMode} title={isReaderMode ? 'Exit Reader Mode' : 'Reader Mode'}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill={isReaderMode ? '#1ED5A9' : 'none'} stroke={isReaderMode ? '#1ED5A9' : 'currentColor'} strokeWidth="1.5">
            <path d="M2 3H12M2 7H10M2 11H8" />
          </svg>
        </NavButton>
      )}

      <div className="relative">
        <NavButton onClick={() => setShowShields(!showShields)} title="Shields">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 1L2 3.5V7C2 9.6 4.2 12 7 12.5C9.8 12 12 9.6 12 7V3.5L7 1Z" />
          </svg>
        </NavButton>
        {showShields && activeTab && (
          <ShieldsPanel
            hostname={(() => {
              try {
                return new URL(activeTab.url).hostname
              } catch {
                return ''
              }
            })()}
            onClose={() => setShowShields(false)}
          />
        )}
      </div>
    </div>
  )
}

function NavButton({ children, onClick, title, disabled }: {
  children: React.ReactNode
  onClick?: () => void
  title: string
  disabled?: boolean
}) {
  return (
    <button
      className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${disabled ? 'text-dip-text-muted cursor-not-allowed' : 'text-dip-text-secondary hover:bg-dip-surface-2 hover:text-dip-text'}`}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  )
}
