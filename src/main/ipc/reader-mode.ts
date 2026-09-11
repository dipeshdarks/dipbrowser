import { BrowserWindow, ipcMain } from 'electron'
import { IPC_CHANNELS } from '../../shared/constants'

const READER_MODE_CSS = `
  #reader-mode-container {
    font-family: Georgia, 'Times New Roman', serif;
    max-width: 720px;
    margin: 0 auto;
    padding: 40px 20px;
    line-height: 1.8;
    font-size: 18px;
    color: #1a1a1a;
    background: #ffffff;
    min-height: 100vh;
  }
  #reader-mode-container h1 {
    font-size: 2.5em;
    font-weight: 700;
    margin-bottom: 0.5em;
    line-height: 1.2;
    color: #000000;
  }
  #reader-mode-container .reader-byline {
    font-size: 0.9em;
    color: #666666;
    margin-bottom: 2em;
    font-style: italic;
  }
  #reader-mode-container p {
    margin-bottom: 1.2em;
  }
  #reader-mode-container img {
    max-width: 100%;
    height: auto;
    margin: 1.5em 0;
    border-radius: 4px;
  }
  #reader-mode-container blockquote {
    border-left: 3px solid #1ED5A9;
    margin: 1.5em 0;
    padding: 0.5em 1em;
    background: #f8f9fa;
    font-style: italic;
  }
  #reader-mode-container a {
    color: #1ED5A9;
    text-decoration: none;
    border-bottom: 1px solid #1ED5A9;
  }
  #reader-mode-container a:hover {
    border-bottom-color: #000000;
  }
  #reader-mode-container pre {
    background: #f4f4f4;
    padding: 1em;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9em;
  }
  #reader-mode-container code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-size: 0.9em;
  }
  #reader-mode-container pre code {
    background: none;
    padding: 0;
  }
  #reader-mode-container .reader-close {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #1ED5A9;
    color: #000000;
    border: none;
    border-radius: 8px;
    padding: 10px 20px;
    cursor: pointer;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 10000;
    transition: background 0.2s;
  }
  #reader-mode-container .reader-close:hover {
    background: #17b890;
  }
`

const READER_MODE_SCRIPT = `
  (function() {
    if (document.getElementById('reader-mode-container')) return 'already_active';

    function extractArticle() {
      const article = { title: '', content: '', byline: '', siteName: '' };

      const titleEl = document.querySelector('meta[property="og:title"]') ||
                      document.querySelector('title');
      article.title = titleEl ? (titleEl.getAttribute('content') || titleEl.textContent || '') : document.title;

      const bylineEl = document.querySelector('meta[name="author"]') ||
                       document.querySelector('[rel="author"]') ||
                       document.querySelector('.author');
      article.byline = bylineEl ? (bylineEl.getAttribute('content') || bylineEl.textContent || '') : '';

      const siteEl = document.querySelector('meta[property="og:site_name"]');
      article.siteName = siteEl ? siteEl.getAttribute('content') || '' : window.location.hostname;

      const contentEl = document.querySelector('article') ||
                        document.querySelector('[role="main"]') ||
                        document.querySelector('.post-content') ||
                        document.querySelector('.article-content') ||
                        document.querySelector('.entry-content') ||
                        document.querySelector('.content') ||
                        document.querySelector('main');

      if (contentEl) {
        article.content = contentEl.innerHTML;
      } else {
        const paragraphs = Array.from(document.querySelectorAll('p'));
        const mainContent = paragraphs
          .filter(p => p.textContent && p.textContent.length > 100)
          .map(p => '<p>' + p.innerHTML + '</p>')
          .join('\\n');
        article.content = mainContent || '<p>Unable to extract article content.</p>';
      }

      return article;
    }

    const article = extractArticle();
    const bylineHtml = article.byline ?
      '<div class="reader-byline">' + article.byline + (article.siteName ? ' &middot; ' + article.siteName : '') + '</div>' : '';

    document.body.innerHTML = '<div id="reader-mode-container">' +
      '<button class="reader-close" onclick="document.getElementById(\\'reader-mode-container\\').remove(); document.body.style.overflow = \\'\\';">Exit Reader</button>' +
      '<h1>' + article.title + '</h1>' +
      bylineHtml +
      article.content +
      '</div>';

    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';

    return JSON.stringify(article);
  })()
`

const READER_MODE_EXIT_SCRIPT = `
  (function() {
    const container = document.getElementById('reader-mode-container');
    if (container) {
      container.remove();
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      return true;
    }
    return false;
  })()
`

export function registerReaderModeIpc(window: BrowserWindow): void {
  ipcMain.handle('reader:check', async (_event, tabId: string) => {
    try {
      const webContents = window.webContents
      const result = await webContents.executeJavaScript(`
        (function() {
          const article = document.querySelector('article') ||
                          document.querySelector('[role="main"]') ||
                          document.querySelector('.post-content') ||
                          document.querySelector('.article-content');
          const paragraphs = document.querySelectorAll('p');
          let largeParagraphs = 0;
          paragraphs.forEach(p => {
            if (p.textContent && p.textContent.length > 100) largeParagraphs++;
          });
          return !!(article || largeParagraphs >= 3);
        })()
      `)
      return result
    } catch {
      return false
    }
  })

  ipcMain.handle('reader:activate', async (_event, tabId: string) => {
    try {
      const result = await window.webContents.executeJavaScript(READER_MODE_SCRIPT)
      return result !== 'already_active'
    } catch {
      return false
    }
  })

  ipcMain.handle('reader:deactivate', async (_event, tabId: string) => {
    try {
      await window.webContents.executeJavaScript(READER_MODE_EXIT_SCRIPT)
      return true
    } catch {
      return false
    }
  })

  ipcMain.handle('reader:get-css', () => {
    return READER_MODE_CSS
  })
}
