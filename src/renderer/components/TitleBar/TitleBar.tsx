import { useState } from 'react'
import { useUIStore } from '../../stores/ui-store'
import api from '../../lib/ipc-client'

export default function TitleBar() {
  const { isMaximized } = useUIStore()

  return (
    <div className="flex items-center h-9 bg-dip-bg border-b border-dip-border drag-region select-none">
      <div className="flex items-center px-3 gap-2 no-drag">
        <div className="w-5 h-5 rounded-md bg-dip-accent flex items-center justify-center">
          <span className="text-[10px] font-bold text-dip-bg">D</span>
        </div>
        <span className="text-xs font-semibold text-dip-text-secondary">DipBrowser</span>
      </div>

      <div className="flex-1" />

      <div className="flex items-center no-drag">
        <WindowButton
          icon={
            <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
              <rect width="10" height="1" />
            </svg>
          }
          onClick={() => api.window.minimize()}
        />
        <WindowButton
          icon={
            isMaximized ? (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="2" y="0" width="8" height="8" rx="1" />
                <rect x="0" y="2" width="8" height="8" rx="1" fill="#0F1117" />
                <rect x="0" y="2" width="8" height="8" rx="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="0.5" y="0.5" width="9" height="9" rx="1" />
              </svg>
            )
          }
          onClick={() => api.window.maximize()}
        />
        <WindowButton
          icon={
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M1 0L0 1L4 5L0 9L1 10L5 6L9 10L10 9L6 5L10 1L9 0L5 4L1 0Z" />
            </svg>
          }
          onClick={() => api.window.close()}
          hoverBg="hover:bg-dip-danger"
        />
      </div>
    </div>
  )
}

function WindowButton({ icon, onClick, hoverBg = 'hover:bg-dip-surface-3' }: {
  icon: React.ReactNode
  onClick: () => void
  hoverBg?: string
}) {
  return (
    <button
      className={`flex items-center justify-center w-11 h-9 text-dip-text-secondary ${hoverBg} transition-colors`}
      onClick={onClick}
    >
      {icon}
    </button>
  )
}
