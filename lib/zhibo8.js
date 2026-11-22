// 简体中文新闻层：直播吧 NBA 滚动新闻。
// 腾讯体育没有可用的 NBA 新闻接口（其 feeds/list 返回的是全站社区热帖，不是 NBA 资讯），
// 所以「热点 TOP10」这一块单独走直播吧的页面，抓 HTML 后解析出标题列表。
//
// 直播吧的滚动新闻页把同一天的多条新闻放在一个 <ul class="articleList"> 里，
// 而每页按天分组；因此在 dataList 范围内逐条匹配 <li> 才是正确的取法
// （按 <ul> 边界匹配会每天只取到第一条）。

const ZHIBO8_NBA = 'https://news.zhibo8.cc/nba/more.htm'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

// 直播吧的时间是北京时间。
const CN_OFFSET = '+08:00'

const FALLBACK_SOURCE = '直播吧'

export class NewsError extends Error {
  constructor(message, { status, url } = {}) {
    super(message)
    this.name = 'NewsError'
    this.status = status
    this.url = url
  }
}

class TtlCache {
  constructor() {
    this.entries = new Map()
  }

  get(key) {
    const hit = this.entries.get(key)
    if (hit === undefined) return undefined
    if (hit.expires <= Date.now()) {
      this.entries.delete(key)
      return undefined
    }
    return hit.value
  }

  set(key, value, ttlMs) {
    this.entries.set(key, { value, expires: Date.now() + ttlMs })
    if (this.entries.size > 60) {
      const oldest = this.entries.keys().next()
      if (oldest.done === false) this.entries.delete(oldest.value)
    }
    return value
  }

  clear() {
    this.entries.clear()
  }
}

export const cache = new TtlCache()

const inflight = new Map()

function once(key, run) {
  const running = inflight.get(key)
  if (running !== undefined) return running
  const promise = run().finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

async function getHtml(url, { timeoutMs = 20000, cacheKey, ttlMs } = {}) {
  if (cacheKey !== undefined) {
    const hit = cache.get(cacheKey)
    if (hit !== undefined) return hit
  }
  const work = async () => {
    let response
    try {
      response = await fetch(url, {
        headers: {
          'user-agent': USER_AGENT,
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'zh-CN,zh;q=0.9',
        },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        throw new NewsError(`请求直播吧超时（${Math.round(timeoutMs / 1000)} 秒未响应）`, { url })
      }
      throw new NewsError(`无法连接直播吧：${error?.message || error}`, { url })
    }
    if (!response.ok) {
      throw new NewsError(`直播吧返回 HTTP ${response.status}`, { status: response.status, url })
    }
    const html = await response.text()
    if (html.length < 200) {
      throw new NewsError('直播吧返回的内容异常（页面过短）', { status: response.status, url })
    }
    return html
  }
  const html = await once(url, work)
  if (cacheKey !== undefined) cache.set(cacheKey, html, ttlMs ?? 3 * 60_000)
  return html
}

const ENTITIES = { '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" }

function textOf(html) {
  return String(html)
    .replace(/<[^>]+>/gu, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39);/gu, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/gu, ' ')
    .trim()
}

function firstMatch(re, text) {
  const hit = re.exec(String(text))
  return hit === null ? null : hit[1]
}

/**
 * 直播吧 NBA 滚动新闻列表，按发布时间倒序取前 limit 条。
 * 返回 { articles, fetchedAt, sources }，articles[].type 是来源标签（直播吧 / 微博 / BBR …）。
 */
export async function fetchNews(limit = 10) {
  const size = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 10))
  const key = `news:${size}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  const html = await getHtml(ZHIBO8_NBA, { cacheKey: 'news:html', ttlMs: 3 * 60_000 })
  const listStart = html.indexOf('<div class="dataList">')
  const listHtml = listStart < 0 ? html : html.slice(listStart)

  const articles = []
  const itemRe = /<li[^>]*>([\s\S]*?)<\/li>/gu
  let match = itemRe.exec(listHtml)
  while (match !== null && articles.length < size) {
    const chunk = match[1]
    match = itemRe.exec(listHtml)
    const href = firstMatch(/<span class="articleTitle">\s*<a[^>]*href="([^"]+)"/u, chunk)
    const headlineHtml = firstMatch(/<span class="articleTitle">\s*<a[^>]*>([\s\S]*?)<\/a>/u, chunk)
    if (href === null || headlineHtml === null) continue
    const headline = textOf(headlineHtml)
    if (headline === '') continue
    const source = (firstMatch(/<span class="source">([^<]*)<\/span>/u, chunk) ?? '').trim()
    const postTime = (firstMatch(/<span class="postTime">([^<]*)<\/span>/u, chunk) ?? '').trim()
    const labels = firstMatch(/data-label="([^"]*)"/u, chunk) ?? ''
    const tags = labels.split(',').map((tag) => tag.trim()).filter((tag) => tag !== '')
    const link = href.startsWith('//') ? `https:${href}` : href
    articles.push({
      id: link,
      type: source || FALLBACK_SOURCE,
      headline,
      description: '',
      published: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u.test(postTime)
        ? `${postTime.replace(' ', 'T')}${CN_OFFSET}`
        : '',
      image: null,
      link,
      premium: false,
      categories: tags.filter((tag) => tag !== '篮球' && tag !== 'NBA').slice(0, 4),
      source,
    })
  }

  const value = {
    articles,
    fetchedAt: new Date().toISOString(),
    sources: ['直播吧 NBA 滚动新闻'],
  }
  return cache.set(key, value, 3 * 60_000)
}
