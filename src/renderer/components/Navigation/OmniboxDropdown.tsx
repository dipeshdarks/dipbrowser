import { useState, useEffect, useRef, useCallback } from 'react'

interface OmniboxResult {
  type: 'search' | 'history' | 'bookmark'
  title: string
  url: string
  favicon: string | null
}

interface OmniboxDropdownProps {
  query: string
  onSelect: (url: string) => void
  visible: boolean
}

export default function OmniboxDropdown({ query, onSelect, visible }: OmniboxDropdownProps) {
  const [results, setResults] = useState<OmniboxResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!visible || !query || query.length < 1) {
      setResults([])
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const suggestions = await window.dipAPI.omnibox.suggestions(query)
        setResults(suggestions)
        setSelectedIndex(0)
      } catch {
        setResults([])
      }
      setLoading(false)
    }

    const timer = setTimeout(fetchSuggestions, 100)
    return () => clearTimeout(timer)
  }, [query, visible])

  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        const url = results[selectedIndex].url.startsWith('search://')
          ? `search://${results[selectedIndex].title}`
          : results[selectedIndex].url
        onSelect(url)
      }
    }
  }, [visible, results, selectedIndex, onSelect])

  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, handleKeyDown])

  if (!visible || results.length === 0) return null

  const highlightMatch = (text: string, query: string) => {
    if (!query) return text
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) =>
      regex.test(part)
        ? <span key={i} className="font-bold text-dip-text">{part}</span>
        : <span key={i}>{part}</span>
    )
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'search':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B8D97" strokeWidth="1.5">
            <circle cx="6" cy="6" r="4" />
            <path d="M9 9L12 12" />
          </svg>
        )
      case 'bookmark':
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="#1ED5A9" stroke="#1ED5A9" strokeWidth="1.5">
            <path d="M3 2H11V13L7 10L3 13V2Z" />
          </svg>
        )
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#8B8D97" strokeWidth="1.5">
            <circle cx="7" cy="7" r="5" />
            <path d="M2 7H12M7 2C5 4 5 10 7 12M7 2C9 4 9 10 7 12" />
          </svg>
        )
    }
  }

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-1 bg-dip-surface border border-dip-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-[400px] overflow-y-auto"
    >
      {results.map((result, index) => {
        const isSelected = index === selectedIndex
        const displayUrl = result.url.startsWith('search://')
          ? result.url.replace('search://', '')
          : result.url

        return (
          <div
            key={`${result.type}-${result.url}-${index}`}
            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
              isSelected ? 'bg-dip-surface-3' : 'hover:bg-dip-surface-2'
            }`}
            onClick={() => {
              const url = result.url.startsWith('search://')
                ? `search://${result.title}`
                : result.url
              onSelect(url)
            }}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
              {result.favicon ? (
                <img
                  src={result.favicon}
                  alt=""
                  className="w-4 h-4 rounded"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = getTypeIcon(result.type) as unknown as string
                    }
                  }}
                />
              ) : (
                getTypeIcon(result.type)
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-dip-text truncate">
                {highlightMatch(result.title, query)}
              </p>
              <p className="text-[10px] text-dip-text-muted truncate">
                {result.type === 'search' ? 'Search' : displayUrl}
              </p>
            </div>

            {result.type === 'history' && (
              <span className="text-[10px] text-dip-text-muted px-1.5 py-0.5 bg-dip-surface-3 rounded">
                History
              </span>
            )}
            {result.type === 'bookmark' && (
              <span className="text-[10px] text-dip-accent px-1.5 py-0.5 bg-dip-accent/10 rounded">
                Bookmark
              </span>
            )}
          </div>
        )
      })}

      {results.length === 0 && !loading && (
        <div className="px-4 py-3 text-xs text-dip-text-muted text-center">
          No suggestions found
        </div>
      )}
    </div>
  )
}
