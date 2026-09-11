import { useCallback, memo } from 'react'
import { Tab as TabType } from '@shared/types'
import { useTabStore } from '../../stores/tab-store'
import { useUIStore } from '../../stores/ui-store'
import api from '../../lib/ipc-client'

interface TabProps {
  tab: TabType
  isActive: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
  isDragOver: boolean
}

function TabComponent({ tab, isActive, onDragStart, onDragOver, onDrop, onDragEnd, isDragOver }: TabProps) {
  const { switchTab, closeTab, pinTab, createTab } = useTabStore()

  const handleClick = useCallback(() => {
    switchTab(tab.id)
  }, [tab.id, switchTab])

  const handleClose = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    closeTab(tab.id)
  }, [tab.id, closeTab])

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    useUIStore.getState().showContextMenu(e.clientX, e.clientY, [
      { label: tab.pinned ? 'Unpin Tab' : 'Pin Tab', action: () => pinTab(tab.id) },
      { label: 'Reload', action: () => api.navigation.reload(tab.id) },
      { separator: true, label: '' },
      { label: 'Duplicate Tab', action: () => createTab(tab.url) },
      { label: 'Copy URL', action: () => navigator.clipboard.writeText(tab.url) },
      { separator: true, label: '' },
      { label: 'Close Tab', action: () => closeTab(tab.id) },
      { label: 'Close Other Tabs', action: () => {
        const allTabs = useTabStore.getState().getWorkspaceTabs()
        allTabs.filter(t => t.id !== tab.id).forEach(t => closeTab(t.id))
      }},
    ])
  }, [tab, pinTab, closeTab, createTab])

  return (
    <div
      className={`group flex items-center gap-2 h-[34px] px-3 rounded-t-lg cursor-pointer transition-all duration-150 select-none min-w-[120px] max-w-[220px] no-drag relative ${isActive ? 'bg-dip-surface text-dip-text border-t-2 border-t-dip-accent' : 'text-dip-text-secondary hover:bg-dip-surface-2'} ${isDragOver ? 'border-l-2 border-l-dip-accent' : ''} ${tab.pinned ? 'min-w-[42px] max-w-[42px] px-0 justify-center' : ''}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {tab.favicon && !tab.pinned ? (
        <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
      ) : tab.pinned ? (
        <div className="w-4 h-4 rounded-sm bg-dip-accent/20 flex items-center justify-center shrink-0">
          <span className="text-[8px] font-bold text-dip-accent">{(tab.title || tab.url || 'N')[0].toUpperCase()}</span>
        </div>
      ) : null}

      {!tab.pinned && (
        <span className="text-xs truncate flex-1 min-w-0">
          {tab.loading ? 'Loading...' : tab.title || 'New Tab'}
        </span>
      )}

      {!tab.pinned && (
        <button className="opacity-0 group-hover:opacity-100 w-4 h-4 flex items-center justify-center rounded hover:bg-dip-surface-3 text-dip-text-muted transition-all shrink-0" onClick={handleClose}>
          <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
            <path d="M0.5 0.5L7.5 7.5M0.5 7.5L7.5 0.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
          </svg>
        </button>
      )}

      {isActive && (
        <div className="absolute bottom-0 left-2 right-2 h-[2px] bg-dip-accent rounded-t" />
      )}
    </div>
  )
}

export default memo(TabComponent)
