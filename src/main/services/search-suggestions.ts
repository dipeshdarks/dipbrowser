import { net } from 'electron'

interface SearchSuggestion {
  text: string
  type: 'search' | 'url'
}

const SUGGESTION_ENDPOINTS: Record<string, string> = {
  Google: 'https://suggestqueries.google.com/complete/search?client=chrome&q=%s',
  Bing: 'https://api.bing.com/osjson.aspx?query=%s',
  DuckDuckGo: 'https://duckduckgo.com/ac/?q=%s&type=list',
  Yahoo: 'https://search.yahoo.com/sugg/gossip?output=Hp供给&command=%s',
  Brave: 'https://search.brave.com/api/suggest?q=%s',
}

export async function getSearchSuggestions(query: string, engine: string): Promise<string[]> {
  if (!query || query.length < 2) return []

  const endpoint = SUGGESTION_ENDPOINTS[engine] || SUGGESTION_ENDPOINTS['Google']
  const url = endpoint.replace('%s', encodeURIComponent(query))

  try {
    const suggestions = await fetchSuggestions(url, engine)
    return suggestions.slice(0, 8)
  } catch {
    return []
  }
}

function fetchSuggestions(url: string, engine: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    let body = ''

    request.on('response', (response) => {
      response.on('data', (chunk) => {
        body += chunk.toString()
      })
      response.on('end', () => {
        try {
          const parsed = JSON.parse(body)
          let suggestions: string[] = []

          if (engine === 'Google' && Array.isArray(parsed) && parsed.length > 1) {
            suggestions = parsed[1] || []
          } else if (engine === 'Bing' && Array.isArray(parsed) && parsed.length > 1) {
            suggestions = parsed[1] || []
          } else if (engine === 'DuckDuckGo' && Array.isArray(parsed)) {
            suggestions = parsed.map((item: any) => Array.isArray(item) ? item[0] : item).filter(Boolean)
          } else if (engine === 'Brave' && Array.isArray(parsed) && parsed.length > 1) {
            suggestions = parsed[1] || []
          } else if (Array.isArray(parsed)) {
            suggestions = parsed.map((item: any) => {
              if (typeof item === 'string') return item
              if (Array.isArray(item) && item.length > 0) return item[0]
              return null
            }).filter(Boolean)
          }

          resolve(suggestions)
        } catch {
          resolve([])
        }
      })
    })

    request.on('error', () => {
      resolve([])
    })

    request.end()
  })
}
