import { useEffect, useRef } from 'react'
import { useUIStore, ContextMenuItem } from '../../stores/ui-store'

export default function ContextMenu() {
  const { contextMenu, hideContextMenu } = useUIStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = () => hideContextMenu()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideContextMenu()
    }

    if (contextMenu) {
      document.addEventListener('click', handleClick)
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu, hideContextMenu])

  if (!contextMenu) return null

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] bg-dip-surface border border-dip-border rounded-lg shadow-xl py-1 animate-fade-in"
      style={{ left: contextMenu.x, top: contextMenu.y }}
    >
      {contextMenu.items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="my-1 border-t border-dip-border" />
        }
        return (
          <MenuItem key={index} item={item} onClose={hideContextMenu} />
        )
      })}
    </div>
  )
}

function MenuItem({ item, onClose }: { item: ContextMenuItem; onClose: () => void }) {
  const handleClick = () => {
    if (item.action && !item.disabled) {
      item.action()
    }
    onClose()
  }

  return (
    <button
      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
        item.disabled
          ? 'text-dip-text-muted cursor-not-allowed'
          : 'text-dip-text-secondary hover:bg-dip-surface-2 hover:text-dip-text'
      }`}
      onClick={handleClick}
      disabled={item.disabled}
    >
      {item.icon && <span className="w-4 text-center">{item.icon}</span>}
      <span>{item.label}</span>
    </button>
  )
}
