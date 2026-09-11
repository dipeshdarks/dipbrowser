import { Session, session } from 'electron'

export class SessionManager {
  private sessions: Map<string, Session> = new Map()

  getSession(partition: string): Session {
    if (!this.sessions.has(partition)) {
      const sess = session.fromPartition(partition)
      this.sessions.set(partition, sess)
    }
    return this.sessions.get(partition)!
  }

  createTabPartition(tabId: string): string {
    return `persist:tab-${tabId}`
  }

  createIncognitoPartition(): string {
    return `incognito-${Date.now()}`
  }

  destroySession(partition: string): void {
    const sess = this.sessions.get(partition)
    if (sess) {
      sess.clearStorageData()
      sess.clearCache()
      this.sessions.delete(partition)
    }
  }

  async clearEphemeralData(partition: string): Promise<void> {
    const sess = this.sessions.get(partition) || session.fromPartition(partition)
    await sess.clearStorageData({
      storages: 'appcache,cookies,indexdb,localstorage,shadercache,cachestrorage,serviceworkers'
    })
    await sess.clearCache()
  }

  getSessionForPartition(partition: string): Session {
    return session.fromPartition(partition)
  }
}
