import { useCallback, useState } from 'react'
import { useTabStore } from '../../stores/tab-store'
import Tab from './Tab'
import api from '../../lib/ipc-client'

export default function TabBar() {
  const { activeTabId, createTab, getWorkspaceTabs } = useTabStore()
  const tabs = getWorkspaceTabs()
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const handleNewTab = useCallback(() => {
    createTab()
  }, [createTab])

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    const sourceIndex = parseInt(e.dataTransfer.getData('text/plain'))
    if (!isNaN(sourceIndex) && sourceIndex !== targetIndex) {
      const tab = tabs[sourceIndex]
      if (tab) {
        api.tabs.reorder(tab.id, targetIndex)
      }
    }
    setDragOverIndex(null)
  }, [tabs])

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  return (
    <div className="flex items-end h-10 bg-dip-bg pl-0 pr-2 gap-0.5 overflow-x-auto scrollbar-thin">
      <div className="flex items-end flex-1 min-w-0 gap-0.5">
        {tabs.map((tab, index) => (
          <Tab
            key={tab.id}
            tab={tab}
            isActive={tab.id === activeTabId}
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            isDragOver={dragOverIndex === index}
          />
        ))}
      </div>

      <button
        className="flex items-center justify-center w-8 h-8 mb-1 rounded-lg text-dip-text-secondary hover:bg-dip-surface-2 hover:text-dip-text transition-colors no-drag shrink-0"
        onClick={handleNewTab}
        title="New Tab (Ctrl+T)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
          <line x1="7" y1="2" x2="7" y2="12" />
          <line x1="2" y1="7" x2="12" y2="7" />
        </svg>
      </button>
    </div>
  )
}
