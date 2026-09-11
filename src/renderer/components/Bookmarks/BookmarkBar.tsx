import { useEffect } from 'react'
import { useBookmarkStore } from '../../stores/bookmark-store'
import { useTabStore } from '../../stores/tab-store'
import api from '../../lib/ipc-client'

export default function BookmarkBar() {
  const { bookmarks, loadBookmarks } = useBookmarkStore()
  const { activeTabId } = useTabStore()

  useEffect(() => {
    loadBookmarks()
  }, [loadBookmarks])

  const handleBookmarkClick = async (url: string) => {
    if (activeTabId) {
      const resolvedUrl = await api.navigation.navigate(activeTabId, url)
      useTabStore.getState().updateTabLocal(activeTabId, { url: resolvedUrl || url, loading: true })
    }
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex items-center h-8 px-4 bg-dip-bg border-b border-dip-border text-xs text-dip-text-muted">
        No bookmarks yet. Bookmark a page to see it here.
      </div>
    )
  }

  return (
    <div className="flex items-center h-8 px-2 gap-1 bg-dip-bg border-b border-dip-border overflow-x-auto scrollbar-thin">
      {bookmarks.map((bookmark) => (
        <button
          key={bookmark.id}
          className="flex items-center gap-2 px-3 h-6 rounded-md text-xs text-dip-text-secondary hover:bg-dip-surface-2 hover:text-dip-text transition-colors shrink-0"
          onClick={() => handleBookmarkClick(bookmark.url)}
          title={bookmark.url}
        >
          {bookmark.favicon ? (
            <img src={bookmark.favicon} alt="" className="w-3 h-3 rounded-sm" />
          ) : (
            <div className="w-3 h-3 rounded-sm bg-dip-surface-3 flex items-center justify-center text-[6px] text-dip-text-muted">
              {bookmark.title[0]}
            </div>
          )}
          <span className="truncate max-w-[120px]">{bookmark.title}</span>
        </button>
      ))}
    </div>
  )
}
