import { BrowserWindow } from 'electron'
import { randomUUID } from 'crypto'
import { Tab } from '../../shared/types'
import { SessionManager } from './session-manager'
import { getDatabase } from '../database/sqlite'

export class TabManager {
  private tabs: Map<string, Tab> = new Map()
  private activeTabId: string | null = null
  private sessionManager: SessionManager
  private sleepingTimers: Map<string, NodeJS.Timeout> = new Map()
  private sleepingTabsTimeout: number = 300000

  constructor(sessionManager: SessionManager) {
    this.sessionManager = sessionManager
  }

  createTab(url: string = 'dipbrowser://newtab', workspaceId: string = 'personal'): Tab {
    const id = randomUUID()
    const partition = this.sessionManager.createTabPartition(id)
    const position = this.tabs.size

    const tab: Tab = {
      id,
      title: 'New Tab',
      url,
      favicon: null,
      loading: true,
      pinned: false,
      workspaceId,
      partition,
      lastActive: Date.now(),
      position,
    }

    this.tabs.set(id, tab)
    return tab
  }

  async closeTab(id: string, ephemeralStorage: boolean = true): Promise<Tab | null> {
    const tab = this.tabs.get(id)
    if (!tab) return null

    this.saveRecentlyClosed(tab)
    this.clearSleepTimer(id)
    this.tabs.delete(id)

    if (ephemeralStorage) {
      await this.sessionManager.clearEphemeralData(tab.partition)
    }
    this.sessionManager.destroySession(tab.partition)

    if (this.activeTabId === id) {
      this.activeTabId = null
    }

    return tab
  }

  getTab(id: string): Tab | undefined {
    return this.tabs.get(id)
  }

  getAllTabs(): Tab[] {
    return Array.from(this.tabs.values()).sort((a, b) => a.position - b.position)
  }

  getWorkspaceTabs(workspaceId: string): Tab[] {
    return this.getAllTabs().filter(t => t.workspaceId === workspaceId)
  }

  getActiveTab(): Tab | undefined {
    return this.activeTabId ? this.tabs.get(this.activeTabId) : undefined
  }

  setActiveTab(id: string): Tab | undefined {
    const tab = this.tabs.get(id)
    if (tab) {
      this.activeTabId = id
      tab.lastActive = Date.now()
      this.clearSleepTimer(id)
      this.resumeTab(id)
    }
    return tab
  }

  updateTab(id: string, updates: Partial<Tab>): Tab | undefined {
    const tab = this.tabs.get(id)
    if (tab) {
      Object.assign(tab, updates)
    }
    return tab
  }

  pinTab(id: string): void {
    const tab = this.tabs.get(id)
    if (tab) {
      tab.pinned = !tab.pinned
      this.reorderTabs()
    }
  }

  reorderTabs(): void {
    const pinned = this.getAllTabs().filter(t => t.pinned).sort((a, b) => a.position - b.position)
    const unpinned = this.getAllTabs().filter(t => !t.pinned).sort((a, b) => a.position - b.position)

    let pos = 0
    for (const tab of pinned) {
      tab.position = pos++
    }
    for (const tab of unpinned) {
      tab.position = pos++
    }
  }

  moveTab(id: string, newPosition: number): void {
    const tab = this.tabs.get(id)
    if (!tab) return

    const tabs = this.getAllTabs().filter(t => t.id !== id)
    tabs.splice(newPosition, 0, tab)

    tabs.forEach((t, i) => {
      t.position = i
    })
  }

  restoreRecentlyClosed(): Tab | null {
    const db = getDatabase()
    const entry = db.prepare('SELECT * FROM recently_closed ORDER BY closed_at DESC LIMIT 1').get() as { title: string; url: string; favicon: string | null } | undefined

    if (!entry) return null

    db.prepare('DELETE FROM recently_closed WHERE url = ? AND closed_at = (SELECT MIN(closed_at) FROM recently_closed WHERE url = ?)').run(entry.url, entry.url)

    return this.createTab(entry.url)
  }

  private saveRecentlyClosed(tab: Tab): void {
    const db = getDatabase()
    db.prepare('INSERT INTO recently_closed (title, url, favicon) VALUES (?, ?, ?)').run(tab.title, tab.url, tab.favicon)

    const count = (db.prepare('SELECT COUNT(*) as count FROM recently_closed').get() as { count: number }).count
    if (count > 100) {
      db.prepare('DELETE FROM recently_closed WHERE id IN (SELECT id FROM recently_closed ORDER BY closed_at ASC LIMIT ?)').run(count - 100)
    }
  }

  suspendTab(id: string): void {
    const tab = this.tabs.get(id)
    if (tab && !tab.pinned) {
      tab.loading = false
    }
  }

  resumeTab(id: string): void {
    const tab = this.tabs.get(id)
    if (tab) {
      tab.loading = true
    }
  }

  setSleepingTabsTimeout(timeout: number): void {
    this.sleepingTabsTimeout = timeout * 1000
  }

  startSleepTimer(id: string): void {
    this.clearSleepTimer(id)
    const tab = this.tabs.get(id)
    if (!tab || tab.pinned || tab.id === this.activeTabId) return

    const timer = setTimeout(() => {
      this.suspendTab(id)
      this.sleepingTimers.delete(id)
    }, this.sleepingTabsTimeout)

    this.sleepingTimers.set(id, timer)
  }

  private clearSleepTimer(id: string): void {
    const timer = this.sleepingTimers.get(id)
    if (timer) {
      clearTimeout(timer)
      this.sleepingTimers.delete(id)
    }
  }

  getTabCount(): number {
    return this.tabs.size
  }

  getMemoryUsage(): { total: number; suspended: number } {
    return {
      total: this.tabs.size,
      suspended: Array.from(this.tabs.values()).filter(t => !t.loading).length,
    }
  }
}
