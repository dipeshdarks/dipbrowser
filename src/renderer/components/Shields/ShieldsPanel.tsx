import { useState, useEffect, useCallback } from 'react'

interface SiteShieldSettings {
  hostname: string
  adBlocker: boolean
  trackerBlocking: boolean
  httpsUpgrade: boolean
  queryFiltering: boolean
  gpcHeader: boolean
}

interface ShieldsPanelProps {
  hostname: string
  onClose: () => void
}

export default function ShieldsPanel({ hostname, onClose }: ShieldsPanelProps) {
  const [shields, setShields] = useState<SiteShieldSettings | null>(null)

  useEffect(() => {
    loadShields()
  }, [hostname])

  const loadShields = async () => {
    const data = await window.dipAPI.shield.get(hostname)
    setShields(data)
  }

  const handleToggle = useCallback(async (key: keyof SiteShieldSettings) => {
    if (!shields) return
    const newValue = !shields[key]
    await window.dipAPI.shield.set(hostname, key, newValue)
    setShields({ ...shields, [key]: newValue })
  }, [shields, hostname])

  const handleReset = useCallback(async () => {
    await window.dipAPI.shield.delete(hostname)
    onClose()
  }, [hostname, onClose])

  if (!shields) return null

  const activeCount = [
    shields.adBlocker,
    shields.trackerBlocking,
    shields.httpsUpgrade,
    shields.queryFiltering,
    shields.gpcHeader,
  ].filter(Boolean).length

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-dip-surface border border-dip-border rounded-xl shadow-2xl z-50 overflow-hidden">
      <div className="p-4 border-b border-dip-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeCount > 0 ? 'bg-dip-accent' : 'bg-dip-surface-3'}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill={activeCount > 0 ? '#0F1117' : '#8B8D97'}>
                <path d="M8 1L2 4V8C2 11.3 4.7 14.4 8 15C11.3 14.4 14 11.3 14 8V4L8 1Z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-dip-text">Shields</p>
              <p className="text-[10px] text-dip-text-muted">{hostname}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-dip-surface-3 text-dip-text-muted transition-colors"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M1 0L0 1L4 5L0 9L1 10L5 6L9 10L10 9L6 5L10 1L9 0L5 4L1 0Z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <ShieldToggle
          label="Ads & Trackers"
          description="Block ads and tracking scripts"
          enabled={shields.adBlocker && shields.trackerBlocking}
          onChange={() => {
            handleToggle('adBlocker')
            handleToggle('trackerBlocking')
          }}
        />

        <ShieldToggle
          label="HTTPS Upgrade"
          description="Force HTTPS connections"
          enabled={shields.httpsUpgrade}
          onChange={() => handleToggle('httpsUpgrade')}
        />

        <ShieldToggle
          label="Query Filtering"
          description="Strip tracking parameters"
          enabled={shields.queryFiltering}
          onChange={() => handleToggle('queryFiltering')}
        />

        <ShieldToggle
          label="Privacy Control"
          description="Send Do-Not-Track signal"
          enabled={shields.gpcHeader}
          onChange={() => handleToggle('gpcHeader')}
        />
      </div>

      <div className="p-3 border-t border-dip-border">
        <button
          onClick={handleReset}
          className="w-full py-2 text-xs text-dip-text-secondary hover:text-dip-text hover:bg-dip-surface-3 rounded-lg transition-colors"
        >
          Reset to Global Settings
        </button>
      </div>
    </div>
  )
}

function ShieldToggle({ label, description, enabled, onChange }: {
  label: string
  description: string
  enabled: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-dip-surface-2 transition-colors">
      <div className="flex-1">
        <p className="text-xs font-medium text-dip-text">{label}</p>
        <p className="text-[10px] text-dip-text-muted">{description}</p>
      </div>
      <button
        className={`relative w-9 h-5 rounded-full transition-colors ${enabled ? 'bg-dip-accent' : 'bg-dip-surface-3'}`}
        onClick={onChange}
      >
        <div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ left: enabled ? '20px' : '2px' }}
        />
      </button>
    </div>
  )
}
