import { useEffect } from 'react'
import { useSettingsStore } from '../../stores/settings-store'
import { useUIStore } from '../../stores/ui-store'

export default function DownloadPanel() {
  const { downloads, loadDownloads, cancelDownload, openDownload, showDownload } = useSettingsStore()
  const { setActivePanel } = useUIStore()

  useEffect(() => {
    loadDownloads()
  }, [loadDownloads])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  return (
    <div className="w-80 h-full bg-dip-surface border-l border-dip-border flex flex-col shrink-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dip-border">
        <h2 className="text-sm font-semibold text-dip-text">Downloads</h2>
        <button
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-dip-surface-2 text-dip-text-muted transition-colors"
          onClick={() => setActivePanel('none')}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
            <path d="M1 0L0 1L4 5L0 9L1 10L5 6L9 10L10 9L6 5L10 1L9 0L5 4L1 0Z" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {downloads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-dip-text-muted">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-3 opacity-50">
              <path d="M16 6V22" />
              <path d="M10 18L16 24L22 18" />
              <path d="M6 28H26" />
            </svg>
            <p className="text-xs">No downloads yet</p>
          </div>
        ) : (
          downloads.map((download) => (
            <div
              key={download.id}
              className="bg-dip-surface-2 rounded-lg p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-dip-text truncate">{download.filename}</p>
                  <p className="text-[10px] text-dip-text-muted mt-0.5">
                    {formatBytes(download.receivedBytes)} / {formatBytes(download.totalBytes)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  {download.state === 'progressing' && (
                    <button
                      className="w-6 h-6 flex items-center justify-center rounded hover:bg-dip-surface-3 text-dip-text-muted transition-colors"
                      onClick={() => cancelDownload(download.id)}
                      title="Cancel"
                    >
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                        <path d="M1 0L0 1L4 5L0 9L1 10L5 6L9 10L10 9L6 5L10 1L9 0L5 4L1 0Z" />
                      </svg>
                    </button>
                  )}
                  {download.state === 'completed' && (
                    <>
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-dip-surface-3 text-dip-text-muted transition-colors"
                        onClick={() => openDownload(download.id)}
                        title="Open"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <path d="M2 8L8 2M8 2H4M8 2V6" />
                        </svg>
                      </button>
                      <button
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-dip-surface-3 text-dip-text-muted transition-colors"
                        onClick={() => showDownload(download.id)}
                        title="Show in folder"
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                          <rect x="1" y="2" width="8" height="7" rx="1" />
                          <path d="M1 4H9" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {download.state === 'progressing' && (
                <div className="w-full h-1 bg-dip-surface-3 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-dip-accent rounded-full transition-all duration-300"
                    style={{
                      width: `${download.totalBytes > 0 ? (download.receivedBytes / download.totalBytes) * 100 : 0}%`,
                    }}
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className={`text-[10px] ${
                  download.state === 'completed' ? 'text-dip-success' :
                  download.state === 'cancelled' ? 'text-dip-danger' :
                  'text-dip-text-muted'
                }`}>
                  {download.state === 'completed' ? 'Completed' :
                   download.state === 'cancelled' ? 'Cancelled' :
                   download.state === 'paused' ? 'Paused' : 'Downloading...'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
