import { useEffect, useRef, useCallback } from 'react'
import { useTabStore } from '../../stores/tab-store'
import { useSettingsStore } from '../../stores/settings-store'
import api from '../../lib/ipc-client'

const FINGERPRINT_PROTECTION_SCRIPT = `
(function() {
  'use strict';
  let noise = Math.random;
  function getNoise() { return Math.floor(noise() * 2) - 1; }
  if (typeof CanvasRenderingContext2D !== 'undefined') {
    const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
    CanvasRenderingContext2D.prototype.getImageData = function(x, y, w, h) {
      const d = origGetImageData.call(this, x, y, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        d.data[i] = Math.min(255, Math.max(0, d.data[i] + getNoise()));
        d.data[i+1] = Math.min(255, Math.max(0, d.data[i+1] + getNoise()));
        d.data[i+2] = Math.min(255, Math.max(0, d.data[i+2] + getNoise()));
      }
      return d;
    };
  }
  if (typeof WebGLRenderingContext !== 'undefined') {
    const origGetParam = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(p) {
      if (p === 37445) return 'Intel Inc.';
      if (p === 37446) return 'Intel Iris OpenGL Engine';
      return origGetParam.call(this, p);
    };
  }
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4, configurable: true });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8, configurable: true });
})();
`

export default function TabContent() {
  const { tabs, activeTabId, currentWorkspaceId, updateTab } = useTabStore()
  const { settings } = useSettingsStore()
  const webviewRefs = useRef<Map<string, any>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  const workspaceTabs = tabs
    .filter((t) => t.workspaceId === currentWorkspaceId)
    .sort((a, b) => a.position - b.position)

  useEffect(() => {
    const unsubs = [
      api.webview.onBack((tabId) => {
        const webview = webviewRefs.current.get(tabId)
        if (webview && webview.canGoBack()) webview.goBack()
      }),
      api.webview.onForward((tabId) => {
        const webview = webviewRefs.current.get(tabId)
        if (webview && webview.canGoForward()) webview.goForward()
      }),
      api.webview.onReload((tabId) => {
        const webview = webviewRefs.current.get(tabId)
        if (webview) webview.reload()
      }),
      api.webview.onHardReload((tabId) => {
        const webview = webviewRefs.current.get(tabId)
        if (webview) webview.reloadIgnoringCache()
      }),
    ]

    return () => unsubs.forEach((u) => u())
  }, [])

  const setupWebviewEvents = useCallback((tabId: string, webview: any) => {
    webview.addEventListener('did-navigate', (e: any) => {
      const currentTab = useTabStore.getState().tabs.find((t) => t.id === tabId)
      if (!currentTab || currentTab.url !== e.url) {
        useTabStore.getState().updateTabLocal(tabId, { url: e.url, loading: true })
      }
      api.history.add({ title: webview.getTitle() || '', url: e.url, favicon: null })
    })
    webview.addEventListener('page-title-updated', (e: any) => {
      updateTab(tabId, { title: e.title })
    })
    webview.addEventListener('did-navigate-in-page', (e: any) => {
      updateTab(tabId, { url: e.url })
    })
    webview.addEventListener('did-start-loading', () => {
      updateTab(tabId, { loading: true })
    })
    webview.addEventListener('did-stop-loading', () => {
      updateTab(tabId, { loading: false })
    })
    webview.addEventListener('dom-ready', () => {
      const currentSettings = useSettingsStore.getState().settings
      if (currentSettings?.fingerprintProtection) {
        webview.executeJavaScript(FINGERPRINT_PROTECTION_SCRIPT).catch(() => {})
      }
    })
  }, [updateTab])

  const handleWebviewRef = useCallback((tabId: string, el: any) => {
    if (el) {
      webviewRefs.current.set(tabId, el)
      setupWebviewEvents(tabId, el)
    } else {
      webviewRefs.current.delete(tabId)
    }
  }, [setupWebviewEvents])

  return (
    <div ref={containerRef} className="absolute inset-0 bg-white">
      {workspaceTabs.map((tab) => {
        const isActive = tab.id === activeTabId
        const isNewTab = tab.url === 'dipbrowser://newtab'

        if (isNewTab) {
          return (
            <div key={tab.id} className={`webview-container ${isActive ? 'block' : 'hidden'}`}>
              <NewTabPage tabId={tab.id} />
            </div>
          )
        }

        return (
          <div key={tab.id} className={`webview-container ${isActive ? 'block' : 'hidden'}`}>
            <webview
              ref={(el) => handleWebviewRef(tab.id, el)}
              src={tab.url}
              partition={tab.partition}
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        )
      })}
    </div>
  )
}

function NewTabPage({ tabId }: { tabId: string }) {
  const shortcuts = [
    { name: 'Google', url: 'https://www.google.com', color: '#4285F4', letter: 'G' },
    { name: 'YouTube', url: 'https://www.youtube.com', color: '#FF0000', letter: 'Y' },
    { name: 'GitHub', url: 'https://github.com', color: '#6e40c9', letter: 'GH' },
    { name: 'Twitter', url: 'https://twitter.com', color: '#1DA1F2', letter: 'X' },
    { name: 'Notion', url: 'https://www.notion.so', color: '#fff', letter: 'N' },
    { name: 'Figma', url: 'https://www.figma.com', color: '#A259FF', letter: 'F' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com', color: '#0A66C2', letter: 'in' },
  ]

  const handleNavigate = async (url: string) => {
    const resolvedUrl = await window.dipAPI.navigation.navigate(tabId, url)
    useTabStore.getState().updateTabLocal(tabId, { url: resolvedUrl || url, loading: true })
  }

  return (
    <div className="h-full bg-dip-bg overflow-auto">
      <div className="max-w-2xl mx-auto pt-20 px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-dip-text mb-2">Good {getTimeOfDay()}, Dip!</h1>
          <p className="text-dip-text-secondary text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>

        <div className="relative mb-10">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dip-text-muted">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search the web privately..."
            className="w-full h-12 pl-12 pr-4 bg-dip-surface border border-dip-border rounded-full text-dip-text text-sm focus:outline-none focus:ring-2 focus:ring-dip-accent/50 focus:border-dip-accent placeholder-dip-text-muted"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = (e.target as HTMLInputElement).value.trim()
                if (value) handleNavigate(value)
              }
            }}
          />
        </div>

        <div className="flex justify-center gap-4 mb-12">
          {shortcuts.map((shortcut) => (
            <button key={shortcut.name} className="flex flex-col items-center gap-2 group" onClick={() => handleNavigate(shortcut.url)}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm transition-transform group-hover:scale-110" style={{ backgroundColor: shortcut.color }}>
                {shortcut.letter}
              </div>
              <span className="text-xs text-dip-text-secondary">{shortcut.name}</span>
            </button>
          ))}
          <button className="flex flex-col items-center gap-2 group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-dip-surface-2 border border-dip-border text-dip-text-muted transition-transform group-hover:scale-110 group-hover:bg-dip-surface-3">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="10" y1="4" x2="10" y2="16" />
                <line x1="4" y1="10" x2="16" y2="10" />
              </svg>
            </div>
            <span className="text-xs text-dip-text-secondary">Add</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function getTimeOfDay(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}
