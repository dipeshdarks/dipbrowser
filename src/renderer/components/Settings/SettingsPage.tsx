import { useEffect, useState } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { useUIStore } from '../../stores/ui-store'
import { Settings } from '@shared/types'

export default function SettingsPage() {
  const { settings, loadSettings, updateSetting } = useSettingsStore()
  const { setActivePanel } = useUIStore()
  const [activeTab, setActiveTab] = useState('appearance')

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  if (!settings) return null

  const tabs = [
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'privacy', label: 'Privacy & Security', icon: '🔒' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'downloads', label: 'Downloads', icon: '📥' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'about', label: 'About', icon: 'ℹ️' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-[700px] h-[500px] bg-dip-surface border border-dip-border rounded-xl shadow-2xl flex overflow-hidden">
        <div className="w-48 bg-dip-surface-2 border-r border-dip-border p-3 space-y-1">
          <div className="flex items-center justify-between px-3 py-2 mb-2">
            <span className="text-sm font-semibold text-dip-text">Settings</span>
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-dip-surface-3 text-dip-text-muted transition-colors"
              onClick={() => setActivePanel('none')}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                <path d="M1 0L0 1L4 5L0 9L1 10L5 6L9 10L10 9L6 5L10 1L9 0L5 4L1 0Z" />
              </svg>
            </button>
          </div>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                activeTab === tab.id
                  ? 'bg-dip-surface-3 text-dip-accent'
                  : 'text-dip-text-secondary hover:bg-dip-surface-3 hover:text-dip-text'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-dip-text">Appearance</h3>

              <SettingToggle
                label="Show Bookmark Bar"
                description="Display bookmarks below the address bar"
                value={settings.showBookmarkBar}
                onChange={(v) => updateSetting('showBookmarkBar', v)}
              />

              <SettingToggle
                label="Show Sidebar"
                description="Display the navigation sidebar"
                value={settings.showSidebar}
                onChange={(v) => updateSetting('showSidebar', v)}
              />

              <SettingSelect
                label="Theme"
                description="Choose your preferred theme"
                value={settings.theme}
                options={[
                  { value: 'dark', label: 'Dark' },
                  { value: 'light', label: 'Light' },
                  { value: 'system', label: 'System' },
                ]}
                onChange={(v) => updateSetting('theme', v)}
              />
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-dip-text">Privacy & Security</h3>

              <SettingToggle
                label="HTTPS Upgrade"
                description="Automatically upgrade HTTP connections to HTTPS"
                value={settings.httpsUpgrade}
                onChange={(v) => updateSetting('httpsUpgrade', v)}
              />

              <SettingToggle
                label="Ad Blocker"
                description="Block advertisements on websites"
                value={settings.adBlocker}
                onChange={(v) => updateSetting('adBlocker', v)}
              />

              <SettingToggle
                label="Tracker Blocking"
                description="Block tracking scripts and cookies"
                value={settings.trackerBlocking}
                onChange={(v) => updateSetting('trackerBlocking', v)}
              />

              <SettingToggle
                label="Query Parameter Filtering"
                description="Strip tracking parameters (utm_*, fbclid, gclid) from URLs"
                value={settings.queryFiltering}
                onChange={(v) => updateSetting('queryFiltering', v)}
              />

              <SettingToggle
                label="Global Privacy Control"
                description="Send Do-Not-Track signal to websites"
                value={settings.gpcHeader}
                onChange={(v) => updateSetting('gpcHeader', v)}
              />

              <SettingToggle
                label="Ephemeral Storage"
                description="Clear cookies and site data when tabs are closed"
                value={settings.ephemeralStorage}
                onChange={(v) => updateSetting('ephemeralStorage', v)}
              />

              <SettingToggle
                label="De-AMP"
                description="Automatically bypass AMP pages and redirect to original content"
                value={settings.deAmpEnabled}
                onChange={(v) => updateSetting('deAmpEnabled', v)}
              />

              <SettingToggle
                label="Cosmetic Filtering"
                description="Hide ad elements and tracking widgets on pages"
                value={settings.cosmeticFiltering}
                onChange={(v) => updateSetting('cosmeticFiltering', v)}
              />

              <SettingToggle
                label="Speedreader"
                description="Automatically offer reader mode for article pages"
                value={settings.speedreaderEnabled}
                onChange={(v) => updateSetting('speedreaderEnabled', v)}
              />

              <SettingToggle
                label="Fingerprint Protection"
                description="Add noise to canvas, WebGL, and audio to prevent fingerprinting"
                value={settings.fingerprintProtection}
                onChange={(v) => updateSetting('fingerprintProtection', v)}
              />

              <SettingToggle
                label="Referrer Trimming"
                description="Strip referrer headers when navigating between sites"
                value={settings.referrerTrimming}
                onChange={(v) => updateSetting('referrerTrimming', v)}
              />

              <SettingToggle
                label="Clear Cookies on Exit"
                description="Delete all cookies when you close the browser"
                value={settings.clearCookiesOnExit}
                onChange={(v) => updateSetting('clearCookiesOnExit', v)}
              />
            </div>
          )}

          {activeTab === 'search' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-dip-text">Search Engine</h3>

              <SettingSelect
                label="Default Search Engine"
                description="Choose your preferred search engine"
                value={settings.searchEngine}
                options={[
                  { value: 'Google', label: 'Google' },
                  { value: 'Bing', label: 'Bing' },
                  { value: 'DuckDuckGo', label: 'DuckDuckGo' },
                  { value: 'Yahoo', label: 'Yahoo' },
                  { value: 'Brave', label: 'Brave' },
                ]}
                onChange={(v) => updateSetting('searchEngine', v)}
              />

              <div>
                <label className="block text-xs font-medium text-dip-text mb-1">Homepage</label>
                <input
                  type="text"
                  value={settings.homepage}
                  onChange={(e) => updateSetting('homepage', e.target.value)}
                  className="w-full h-9 px-3 bg-dip-surface-2 border border-dip-border rounded-lg text-xs text-dip-text focus:outline-none focus:ring-2 focus:ring-dip-accent/50"
                />
              </div>
            </div>
          )}

          {activeTab === 'downloads' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-dip-text">Downloads</h3>

              <div>
                <label className="block text-xs font-medium text-dip-text mb-1">Download Location</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.downloadPath}
                    readOnly
                    className="flex-1 h-9 px-3 bg-dip-surface-2 border border-dip-border rounded-lg text-xs text-dip-text"
                  />
                  <button
                    className="px-3 h-9 bg-dip-accent text-dip-bg text-xs font-medium rounded-lg hover:bg-dip-accent-hover transition-colors"
                    onClick={() => {
                      window.dipAPI.downloads.getDownloadPath().then((path) => {
                        if (path) updateSetting('downloadPath', path)
                      })
                    }}
                  >
                    Browse
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-dip-text">Performance</h3>

              <SettingToggle
                label="Sleeping Tabs"
                description="Suspend inactive tabs to save memory"
                value={settings.sleepingTabsEnabled}
                onChange={(v) => updateSetting('sleepingTabsEnabled', v)}
              />

              {settings.sleepingTabsEnabled && (
                <div>
                  <label className="block text-xs font-medium text-dip-text mb-1">
                    Sleep after {settings.sleepingTabsTimeout} seconds of inactivity
                  </label>
                  <input
                    type="range"
                    min="30"
                    max="1800"
                    step="30"
                    value={settings.sleepingTabsTimeout}
                    onChange={(e) => updateSetting('sleepingTabsTimeout', Number(e.target.value))}
                    className="w-full accent-dip-accent"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'about' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-dip-text">About DipBrowser</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-dip-accent flex items-center justify-center">
                  <span className="text-xl font-bold text-dip-bg">D</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dip-text">DipBrowser</p>
                  <p className="text-xs text-dip-text-muted">Version 1.0.0</p>
                </div>
              </div>
              <p className="text-xs text-dip-text-secondary">
                Fast. Secure. Yours.
              </p>
              <p className="text-xs text-dip-text-muted">
                A modern Chromium-powered browser focused on speed, privacy, customization, and AI-powered productivity.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SettingToggle({ label, description, value, onChange }: {
  label: string
  description: string
  value: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-xs font-medium text-dip-text">{label}</p>
        <p className="text-[10px] text-dip-text-muted mt-0.5">{description}</p>
      </div>
      <button
        className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-dip-accent' : 'bg-dip-surface-3'}`}
        onClick={() => onChange(!value)}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${value ? 'left-5.5 translate-x-0' : 'left-0.5'}`}
          style={{ left: value ? '22px' : '2px' }}
        />
      </button>
    </div>
  )
}

function SettingSelect({ label, description, value, options, onChange }: {
  label: string
  description: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="py-2">
      <div className="mb-1">
        <p className="text-xs font-medium text-dip-text">{label}</p>
        <p className="text-[10px] text-dip-text-muted mt-0.5">{description}</p>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-9 px-3 bg-dip-surface-2 border border-dip-border rounded-lg text-xs text-dip-text focus:outline-none focus:ring-2 focus:ring-dip-accent/50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
