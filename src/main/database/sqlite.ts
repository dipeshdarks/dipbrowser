import Database from 'better-sqlite3'
import { join } from 'path'
import { app } from 'electron'
import { DB_VERSION } from '../../shared/constants'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized')
  }
  return db
}

export function initializeDatabase(): void {
  try {
    const dbPath = join(app.getPath('userData'), 'dipbrowser.db')
    db = new Database(dbPath)

    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')

    createTables()
    migrateData()
  } catch (err) {
    console.error('[DipBrowser] Database init failed:', err)
    throw err
  }
}

function createTables(): void {
  const database = getDatabase()

  database.exec(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      favicon TEXT,
      folder_id INTEGER,
      position INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (folder_id) REFERENCES bookmark_folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS bookmark_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      parent_id INTEGER,
      position INTEGER DEFAULT 0,
      FOREIGN KEY (parent_id) REFERENCES bookmark_folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      url TEXT NOT NULL,
      favicon TEXT,
      visit_count INTEGER DEFAULT 1,
      last_visited DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS downloads (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      filename TEXT NOT NULL,
      path TEXT NOT NULL,
      total_bytes INTEGER DEFAULT 0,
      received_bytes INTEGER DEFAULT 0,
      state TEXT DEFAULT 'progressing',
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      mime_type TEXT
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📁',
      color TEXT DEFAULT '#1ED5A9',
      position INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS permissions (
      url TEXT NOT NULL,
      permission TEXT NOT NULL,
      granted INTEGER DEFAULT 0,
      PRIMARY KEY (url, permission)
    );

    CREATE TABLE IF NOT EXISTS recently_closed (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      url TEXT NOT NULL,
      favicon TEXT,
      closed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS filter_lists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      content TEXT,
      lastUpdated DATETIME,
      enabled INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS site_shields (
      hostname TEXT PRIMARY KEY,
      adBlocker INTEGER DEFAULT 1,
      trackerBlocking INTEGER DEFAULT 1,
      httpsUpgrade INTEGER DEFAULT 1,
      queryFiltering INTEGER DEFAULT 1,
      gpcHeader INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_history_url ON history(url);
    CREATE INDEX IF NOT EXISTS idx_history_last_visited ON history(last_visited DESC);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_folder ON bookmarks(folder_id);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_position ON bookmarks(position);
  `)
}

function migrateData(): void {
  const database = getDatabase()
  const versionRow = database.prepare('SELECT value FROM settings WHERE key = ?').get('db_version') as { value: string } | undefined

  if (!versionRow) {
    database.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').run('db_version', String(DB_VERSION))

    const workspaceCount = (database.prepare('SELECT COUNT(*) as count FROM workspaces').get() as { count: number }).count
    if (workspaceCount === 0) {
      const insert = database.prepare('INSERT INTO workspaces (id, name, icon, color, position) VALUES (?, ?, ?, ?, ?)')
      insert.run('personal', 'Personal', '👤', '#1ED5A9', 0)
      insert.run('work', 'Work', '💼', '#3B82F6', 1)
      insert.run('development', 'Development', '⚙️', '#F59E0B', 2)
      insert.run('study', 'Study', '📚', '#A855F7', 3)
    }

    const defaultSettings: Record<string, string> = {
      homepage: 'dipbrowser://newtab',
      searchEngine: 'Google',
      searchEngineUrl: 'https://www.google.com/search?q=%s',
      showBookmarkBar: 'false',
      showSidebar: 'true',
      downloadPath: app.getPath('downloads'),
      httpsUpgrade: 'true',
      adBlocker: 'true',
      trackerBlocking: 'true',
      queryFiltering: 'true',
      gpcHeader: 'true',
      clearCookiesOnExit: 'false',
      sleepingTabsEnabled: 'true',
      sleepingTabsTimeout: '300',
      theme: 'dark',
      language: 'en',
      ephemeralStorage: 'true',
      deAmpEnabled: 'true',
      cosmeticFiltering: 'true',
      speedreaderEnabled: 'true',
      fingerprintProtection: 'true',
      referrerTrimming: 'true',
    }

    const insertSetting = database.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    for (const [key, value] of Object.entries(defaultSettings)) {
      insertSetting.run(key, value)
    }
  }
}
