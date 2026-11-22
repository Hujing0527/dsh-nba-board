// NBA 每日看板 — Host half.
// Owns the Chinese data layer (one HTTP route for the Web UI) and one agent tool.
// The route and the tool call the same methods, so the panel and the agent can
// never disagree about what today's slate says.
// 数据源：腾讯体育 NBA（比分/技术统计/排名/队徽/球馆）+ 直播吧 NBA 滚动新闻，全部为简体中文。
import { fetchScoreboard, fetchSummary, fetchStandings, todayStamp, shiftDate, cache } from './lib/tencent.js'
// 腾讯没有可用的 NBA 新闻接口（详情见 docs/DETAIL.md），新闻继续取直播吧简体中文页面。
import { fetchNews } from './lib/zhibo8.js'

export const inject = ['tools', 'webServer']

const ACTIONS = ['scoreboard', 'game', 'news', 'standings', 'brief']

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

/** Fold a day's slate into the few numbers a headline sentence needs (agent tool view). */
function summarizeGames(scoreboard) {
  const games = scoreboard.games
  const played = games.filter((game) => game.status.state !== 'pre')
  const leaders = played
    .map((game) => ({
      id: game.id,
      label: `${game.away.team.abbr} ${game.away.score} - ${game.home.score} ${game.home.team.abbr}`,
      margin: game.margin,
    }))
    .sort((a, b) => b.margin - a.margin)[0]
  return {
    date: scoreboard.date,
    fetchedAt: scoreboard.fetchedAt,
    counts: scoreboard.counts,
    games: games.map((game) => ({
      id: game.id,
      matchup: `${game.away.team.abbr} @ ${game.home.team.abbr}`,
      teams: `${game.away.team.short} @ ${game.home.team.short}`,
      score: game.status.state === 'pre' ? '未开始' : `${game.away.score}-${game.home.score}`,
      state: game.status.state,
      status: game.status.short,
      tipoff: game.date,
      venue: game.venue,
      record: `${game.away.record} / ${game.home.record}`,
      // 未开赛的场次腾讯不给「得分王/篮板王/助攻王」，这里留空对象而不是 null。
      leaders: Object.fromEntries(
        Object.entries(game.home.leaders ?? {})
          .filter(([, row]) => row !== null && row !== undefined)
          .map(([key, row]) => [key, `${row.name} ${row.value}`]),
      ),
    })),
    biggestBlowout: leaders ?? null,
  }
}

function briefOf({ scoreboard, news, standings }) {
  const lines = []
  lines.push(`NBA ${scoreboard.date}：${scoreboard.counts.total} 场（已结束 ${scoreboard.counts.final} / 进行中 ${scoreboard.counts.live} / 未开始 ${scoreboard.counts.upcoming}）`)
  for (const game of scoreboard.games.slice(0, 12)) {
    // 未开赛：写开球时间比写「未开始（未开始）」有用；已开赛：写比分与胜负状态。
    const head = `${game.away.team.abbr} @ ${game.home.team.abbr}`
    if (game.status.state === 'pre') {
      const tip = game.status.clock ? `${game.status.clock} 开赛` : (game.status.short || '未开始')
      lines.push(`- ${head}：${tip}${game.venue ? ` · ${game.venue}` : ''}`)
      continue
    }
    const status = game.status.short || game.status.detail || '—'
    lines.push(`- ${head}：${game.away.score}-${game.home.score}（${status}）${game.venue ? ` · ${game.venue}` : ''}`)
  }
  if (news !== null && news.articles.length > 0) {
    lines.push('', '热点新闻 TOP10：')
    news.articles.forEach((article, index) => {
      lines.push(`${index + 1}. [${article.type}] ${article.headline}`)
    })
  }
  if (standings !== null) {
    lines.push('')
    for (const conference of standings.conferences) {
      const top = conference.rows.slice(0, 8).map((row) => `${row.rank}.${row.team.abbr} ${row.wins}-${row.losses}`).join('  ')
      lines.push(`${conference.name}：${top}`)
    }
  }
  return lines.join('\n')
}

export function apply(ctx) {
  const call = async (method, params = {}) => {
    switch (method) {
      case 'scoreboard': {
        // The panel needs the whole slate (per-team linescores, leaders, records),
        // so the route returns the normalised board untouched. The agent tool folds
        // it through `summarizeGames` below, where a smaller payload reads better.
        return fetchScoreboard(params.date)
      }
      case 'game': {
        const summary = await fetchSummary(params.eventId ?? params.id)
        return summary
      }
      case 'news': {
        return fetchNews(clampInt(params.limit, 10, 1, 50))
      }
      case 'standings': {
        return fetchStandings()
      }
      case 'brief': {
        const [scoreboard, news, standings] = await Promise.all([
          fetchScoreboard(params.date),
          fetchNews(10).catch(() => null),
          fetchStandings().catch(() => null),
        ])
        return {
          text: briefOf({ scoreboard, news, standings }),
          date: scoreboard.date,
          counts: scoreboard.counts,
        }
      }
      case 'refresh': {
        cache.clear()
        return { ok: true, rev: 'tencent-1' }
      }
      case 'client.event': {
        const text = `[${String(params.kind ?? 'event')}] ${String(params.message ?? '')}${params.detail ? ` — ${String(params.detail).slice(0, 800)}` : ''}`
        ctx.logger?.warn?.(`nba-board ${text}`)
        return { ok: true }
      }
      default:
        throw new Error(`未知方法：${String(method)}`)
    }
  }

  // ---- Web UI transport ---------------------------------------------------
  // Hot reload: bundle re-apply creates a NEW instance while the old one may still
  // own the route (dsh keeps the previous host entry alive across set_bundle).
  // One process-global slot holds the live handler, so a re-registering instance
  // swaps behaviour instead of throwing `duplicate exact route`.
  const ROUTE_PATH = '/nba-board/api/rpc'
  const ROUTE_SLOT = Symbol.for('dsh-nba-board.route')
  const slot = globalThis[ROUTE_SLOT] ?? (globalThis[ROUTE_SLOT] = { handler: null, owner: null, dispose: null })
  const route = {
    kind: 'exact',
    path: ROUTE_PATH,
    handler(req, res) {
      const live = slot.handler
      if (live === null) {
        res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify({ ok: false, error: { message: '看板正在重启，请稍后重试' } }))
        return undefined
      }
      return live(req, res)
    },
    async serve(req, res) {
      const send = (statusCode, payload) => {
        const body = JSON.stringify(payload)
        res.writeHead(statusCode, {
          'content-type': 'application/json; charset=utf-8',
          'cache-control': 'no-store',
          'content-length': Buffer.byteLength(body),
        })
        res.end(body)
      }
      if (req.method !== 'POST') return send(405, { ok: false, error: { message: '仅支持 POST' } })
      const origin = req.headers.origin
      let allowedOrigin = null
      try { allowedOrigin = ctx.webServer.getOrigin() } catch { allowedOrigin = null }
      if (origin && allowedOrigin !== null && origin !== allowedOrigin && origin !== allowedOrigin.replace('127.0.0.1', 'localhost')) {
        return send(403, { ok: false, error: { message: '来源不被允许' } })
      }
      const chunks = []
      let size = 0
      try {
        for await (const chunk of req) {
          size += chunk.length
          if (size > 256 * 1024) return send(413, { ok: false, error: { message: '请求体过大' } })
          chunks.push(chunk)
        }
      } catch {
        return send(400, { ok: false, error: { message: '读取请求体失败' } })
      }
      let payload
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
      } catch {
        return send(400, { ok: false, error: { message: 'JSON 解析失败' } })
      }
      try {
        const value = await call(String(payload.method || ''), payload.params || {})
        return send(200, { ok: true, value })
      } catch (error) {
        return send(200, { ok: false, error: { message: String(error?.message || error) } })
      }
    },
  }
  /**
   * Take the route path away from a stale instance.
   *
   * A hot reload loads a new module copy but the previous copy's cordis entry can
   * stay alive (unmounting it is asynchronous), so `register` may throw
   * `duplicate exact route`. The old entry would then keep answering with the
   * OLD module's code — the page would silently show pre-reload behaviour.
   * `WebServer.exact` / `.prefixes` are public `Map` fields holding the live
   * route objects, so dropping the stale entry and registering again puts this
   * instance's handler in charge.
   */
  const takeOverRoute = () => {
    const tables = [ctx.webServer?.exact, ctx.webServer?.prefixes]
    let dropped = 0
    for (const table of tables) {
      if (table instanceof Map && table.has(ROUTE_PATH)) {
        table.delete(ROUTE_PATH)
        dropped += 1
      }
    }
    return dropped > 0
  }
  ctx.effect(() => {
    const token = {}
    slot.handler = route.serve.bind(route)
    slot.owner = token
    if (slot.dispose === null) {
      try {
        slot.dispose = ctx.webServer.register(route)
      } catch (error) {
        // Drop the stale entry (if the service exposes its tables) and retry once.
        if (takeOverRoute()) {
          try {
            slot.dispose = ctx.webServer.register(route)
            ctx.logger?.warn?.('nba-board 已接管旧实例遗留的路由（热重载）')
            return () => {
              if (slot.owner !== token) return
              slot.owner = null
              slot.handler = null
              const dispose = slot.dispose
              slot.dispose = null
              if (dispose !== null) dispose()
            }
          } catch { /* fall through to slot forwarding */ }
        }
        // Could not reclaim the path: forward through the process-global slot so
        // the schema the page talks to still resolves to this instance's logic.
        slot.dispose = null
        ctx.logger?.warn?.(`nba-board 路由已被旧实例占用，本实例改为接管分发：${String(error?.message || error)}`)
      }
    }
    return () => {
      // Only the newest instance unmounts the route; an older one unloading after
      // a newer one applied must leave it in place.
      if (slot.owner !== token) return
      slot.owner = null
      slot.handler = null
      const dispose = slot.dispose
      slot.dispose = null
      if (dispose !== null) dispose()
    }
  })

  // ---- Agent tool ---------------------------------------------------------
  const tool = {
    name: 'nba_board',
    description: [
      'NBA 每日看板：查某一天的比赛结果与数据、单场技术统计、东西部排名、热点新闻 TOP10。',
      '比赛数据、技术统计与排名来自腾讯体育 NBA，新闻来自直播吧 NBA，均为简体中文。',
      'action 取值：',
      'scoreboard=某天全部比赛的比分/状态/比分走势/领先者（date 可选 YYYY-MM-DD，缺省今天）；',
      'game=单场详细技术统计（eventId 必填，取自 scoreboard 返回的 games[].id，即腾讯 matchId，形如 100000:10022600043）；',
      'news=热点新闻 TOP10（limit 可选 1-50）；',
      'standings=东西部排名；',
      'brief=一天的简报文本（比分 + 新闻 TOP10 + 分区前八），适合直接念给用户。',
    ].join(''),
    parameters: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ACTIONS, description: '要执行的操作' },
        date: { type: 'string', description: '日期 YYYY-MM-DD（或 YYYYMMDD），缺省为今天' },
        eventId: { type: 'string', description: '比赛 ID（scoreboard 返回值里的 games[].id）' },
        limit: { type: 'number', description: '新闻条数，默认 10，范围 1-50' },
      },
      required: ['action'],
      additionalProperties: false,
    },
    output: {
      schema: { type: 'object', additionalProperties: true },
      render(_args, value) {
        // `brief` already produced prose; everything else is structured data the
        // model needs intact, so it is rendered as JSON rather than summarised.
        const text = typeof value === 'string'
          ? value
          : typeof value?.text === 'string'
            ? value.text
            : JSON.stringify(value, null, 2)
        const body = text.length > 6000 ? `${text.slice(0, 6000)}\n…（已截断）` : text
        return [{ type: 'text', text: body }]
      },
    },
    timeoutMs: 60000,
    async execute(args) {
      const params = {}
      if (args.date) params.date = args.date
      if (args.eventId) params.eventId = args.eventId
      if (args.limit !== undefined) params.limit = args.limit
      const value = await call(args.action, params)
      // The panel wants every number on the board; a model reads a compact slate
      // better, so the tool trims `scoreboard` to the fields a recap needs.
      const shaped = args.action === 'scoreboard' ? summarizeGames(value) : value
      return JSON.parse(JSON.stringify(shaped === undefined ? null : shaped))
    },
  }
  ctx.effect(() => ctx.tools.register(tool))

  // A helper for other plugins / the agent: today's slate without the tool.
  return { call, todayStamp, shiftDate }
}
