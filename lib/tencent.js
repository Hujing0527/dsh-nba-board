// 简体中文数据层：腾讯体育（比分 / 技术统计 / 排名 / 队徽 / 球馆）。
// 腾讯的公开 JSON 接口无需签名，但字段名与结构偏「客户端风格」，这里统一归一化成
// 看板需要的形状，Client 端只认归一化后的字段。

import { fetchCctvStatus } from './cctv.js'

const SCOREBOARD = 'https://app.sports.qq.com/m/match/list'
const MATCH_STAT = 'https://matchweb.sports.qq.com/kbs/matchStat'
const MATCH_DETAIL = 'https://matchweb.sports.qq.com/kbs/matchDetail'
const RANK = 'https://matchweb.sports.qq.com/team/rank'
const TEAMS = 'https://matchweb.sports.qq.com/match/api/v2/team/groups'

// 100000 是腾讯的 NBA 赛事 ID；比分列表里同一份数据还会混进「篮球直播节目」
// （mid 以 100002: 开头），必须过滤掉。
const NBA_COMPETITION = '100000'
const NBA_MID_PREFIX = `${NBA_COMPETITION}:`

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

// 腾讯返回的时间都是北京时间，看板也按北京时间分日。
const CN_OFFSET = '+08:00'

export class BoardError extends Error {
  constructor(message, { status, url } = {}) {
    super(message)
    this.name = 'BoardError'
    this.status = status
    this.url = url
  }
}

/* ------------------------------------------------------------------ cache -- */

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
    if (this.entries.size > 200) {
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

/* ------------------------------------------------------------------ fetch -- */

// 面板和 agent 工具经常在同一拍问同一天，去重能省掉一半请求。
const inflight = new Map()

function once(key, run) {
  const running = inflight.get(key)
  if (running !== undefined) return running
  const promise = run().finally(() => inflight.delete(key))
  inflight.set(key, promise)
  return promise
}

async function getJson(url, { timeoutMs = 15000, cacheKey, ttlMs } = {}) {
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
          accept: 'application/json, text/plain, */*',
          'accept-language': 'zh-CN,zh;q=0.9',
          referer: 'https://sports.qq.com/',
        },
        signal: AbortSignal.timeout(timeoutMs),
      })
    } catch (error) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        throw new BoardError(`请求腾讯体育超时（${Math.round(timeoutMs / 1000)} 秒未响应）`, { url })
      }
      throw new BoardError(`无法连接腾讯体育：${error?.message || error}`, { url })
    }
    if (!response.ok) {
      throw new BoardError(`腾讯体育返回 HTTP ${response.status}`, { status: response.status, url })
    }
    let payload
    try {
      payload = await response.json()
    } catch {
      throw new BoardError('腾讯体育返回的内容不是合法 JSON（可能被网络中间层改写）', { status: response.status, url })
    }
    // 腾讯用 code 表达业务错误：0 成功，其余（12 = 参数/接口不对）都当失败。
    if (payload?.code !== 0) {
      throw new BoardError(`腾讯体育返回错误：${payload?.msg || `code ${payload?.code}`}`, { status: response.status, url })
    }
    return payload.data
  }
  const promise = once(url, work)
  const data = await promise
  if (cacheKey !== undefined) cache.set(cacheKey, data, ttlMs ?? 60_000)
  return data
}

/* ----------------------------------------------------------------- helpers -- */

function pad2(value) {
  return String(value).padStart(2, '0')
}

/** 'YYYYMMDD'（UI / 工具用的紧凑戳）来自任意允许的输入。 */
export function normalizeDate(input) {
  const raw = String(input ?? '').trim()
  const hit = /^(\d{4})-?(\d{1,2})-?(\d{1,2})$/u.exec(raw)
  const now = new Date()
  if (hit === null) {
    return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`
  }
  return `${hit[1]}${pad2(hit[2])}${pad2(hit[3])}`
}

export function todayStamp(now = new Date()) {
  return `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`
}

export function dashDate(stamp) {
  const value = normalizeDate(stamp)
  return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`
}

export function shiftDate(stamp, days) {
  const value = normalizeDate(stamp)
  const date = new Date(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)))
  date.setDate(date.getDate() + (Number.parseInt(String(days), 10) || 0))
  return todayStamp(date)
}

/** '2026-11-22 02:00:00'（北京时间）→ ISO 带时区偏移。 */
function isoOf(day, clock) {
  const text = String(clock ?? '').trim()
  const hit = /^(\d{1,2}):(\d{2})/u.exec(text)
  const time = hit === null ? '00:00' : `${pad2(hit[1])}:${hit[2]}`
  return `${day}T${time}:00${CN_OFFSET}`
}

/** '2026-11-22 02:00:00' → { day: '2026-11-22', clock: '02:00' } */
function splitStamp(value) {
  const hit = /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})/u.exec(String(value ?? '').trim())
  if (hit === null) return { day: '', clock: '' }
  return { day: hit[1], clock: hit[2].padStart(5, '0') }
}

export { splitStamp }

function shortTime(iso) {
  const hit = /T(\d{2}:\d{2})/u.exec(String(iso ?? ''))
  return hit === null ? '' : hit[1]
}

function numberOrNull(value) {
  const parsed = Number.parseInt(String(value ?? '').replace(/[^\d-]/gu, ''), 10)
  return Number.isFinite(parsed) ? parsed : null
}

/** 小并发跑一批异步任务：15 场同时开火会被上游限流，6 路够快也不冒犯。 */
async function mapLimit(items, limit, run) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await run(items[index], index)
    }
  })
  await Promise.all(workers)
  return results
}

/* --------------------------------------------------------------- team map -- */

/** 30 支球队：id → { id, abbr, short, name, logo, colors }。队徽来自腾讯 CDN。 */
export async function fetchTeamMap() {
  const key = 'tencent:teams'
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const data = await getJson(`${TEAMS}?competitionId=${NBA_COMPETITION}`, { cacheKey: 'tencent:teams:raw', ttlMs: 12 * 60 * 60_000 })
  const map = new Map()
  for (const group of data?.groups ?? []) {
    for (const team of group.teams ?? []) {
      const name = String(team.cnName ?? '').trim()
      if (name === '') continue
      map.set(String(team.id), {
        id: String(team.id),
        abbr: name,
        short: name,
        name,
        logo: String(team.logo ?? ''),
        conference: group.name ?? '',
        colors: team.color ?? null,
      })
    }
  }
  return cache.set(key, map, 6 * 60 * 60_000)
}

function teamOf(map, id, name, logo) {
  const known = map.get(String(id ?? ''))
  const label = String(name ?? '').trim() || known?.short || '未知'
  return {
    id: String(id ?? label),
    abbr: known?.abbr || label,
    short: known?.short || label,
    name: known?.name || label,
    logo: String(logo ?? '') || known?.logo || '',
  }
}

/* -------------------------------------------------------------- standings -- */

function pctOf(wins, losses) {
  const total = wins + losses
  if (total === 0) return ''
  return `${((wins / total) * 100).toFixed(1)}%`
}

function standingRow(row, index, teamMap) {
  const wins = numberOrNull(row.wins) ?? 0
  const losses = numberOrNull(row.losses) ?? 0
  return {
    rank: numberOrNull(row.serial) ?? index + 1,
    team: teamOf(teamMap, row.teamId, row.name, row.teamLogo || row.badge),
    wins,
    losses,
    // 腾讯只给整数胜率（"82"），按胜负数重算一位小数更好看。
    pct: pctOf(wins, losses),
    gamesBehind: String(row['games-back'] ?? row.divGameBehind ?? ''),
    // 腾讯排名接口没有这些列；留空让 Client 自动隐藏对应表头。
    streak: '',
    lastTen: '',
    home: '',
    road: '',
    division: '',
    conferenceRecord: '',
    ppg: '',
    oppg: '',
    diff: '',
  }
}

function rankOf(data, teamMap) {
  const byTeam = new Map()
  const conferences = []
  for (const [key, name, abbr] of [['east', '东部', '东'], ['west', '西部', '西']]) {
    const rows = Array.isArray(data?.[key]) ? data[key] : []
    if (rows.length === 0) continue
    const mapped = rows.map((row, index) => standingRow(row, index, teamMap))
    conferences.push({ name, rows: mapped })
    for (const row of mapped) {
      // 卡片上要一眼看出「东3 / 西5」这种分区排名，这里把名次与分区都记下来。
      byTeam.set(row.team.id, {
        rank: row.rank,
        conference: name,
        short: abbr,
        label: `${abbr}${row.rank}`,
        record: `${row.wins}胜${row.losses}负`,
      })
    }
  }
  return { conferences, byTeam }
}

export async function fetchStandings() {
  const key = 'tencent:standings'
  const hit = cache.get(key)
  if (hit !== undefined) return hit
  const [data, teamMap] = await Promise.all([
    getJson(`${RANK}?competitionId=${NBA_COMPETITION}`, { cacheKey: 'tencent:rank:raw', ttlMs: 10 * 60_000 }),
    fetchTeamMap(),
  ])
  const { conferences } = rankOf(data, teamMap)
  const value = {
    conferences,
    fetchedAt: new Date().toISOString(),
    sources: ['腾讯体育 NBA 排名'],
  }
  return cache.set(key, value, 15 * 60_000)
}

/* ------------------------------------------------------------- scoreboard -- */

// 腾讯的 liveType 不能单独判定状态：3 同时用于「未开始」和「进行中」，
// 4 才是「已结束」。真正区分未开始/进行中要看 quarter 字段，它会出现：
//   未开始 / 比赛待定 / 空                     → 未开始
//   第N节 / 加时 / 中场休息 / 节间 / 暂停 / 进行中 → 进行中（可能带 quarterTime 剩余时间）
// 注意「进行中」是腾讯在刚跳球、比分还是 0-0 时给的原文值；中场休息/节间休息同理。
// 只要不是明确的「未开始」类取值，就应当按进行中处理并显示实时分数。
const NOT_STARTED_QUARTER = /^(未开始|比赛待定|)$/u

function statusOf(info) {
  const liveType = String(info.liveType ?? '')
  const quarter = String(info.quarter ?? '').trim()
  const clock = String(info.quarterTime ?? '').trim()

  if (liveType === '4' || /^(已结束|完场|结束)$/u.test(quarter)) {
    return { state: 'post', completed: true, detail: '已结束', short: '已结束', clock: '', period: 0 }
  }
  // 未开赛：quarter 明确写着「未开始/比赛待定」或干脆为空。
  if (NOT_STARTED_QUARTER.test(quarter)) {
    return { state: 'pre', completed: false, detail: quarter || '未开始', short: quarter || '未开始', clock: clock || '', period: 0 }
  }
  // 其余取值（第N节 / 加时 / 中场休息 / 进行中 / …）一律视为进行中，显示实时分数。
  const period = /第\s*(\d+)\s*节/u.exec(quarter)
  return {
    state: 'in',
    completed: false,
    detail: quarter || '进行中',
    short: `${quarter || '进行中'}${clock !== '' ? ` ${clock}` : ''}`.trim(),
    clock,
    period: period === null ? 0 : Number.parseInt(period[1], 10),
  }
}

/** periodGoals.rows[0]=客队、rows[1]=主队，每行首元素是占位符、末尾是总分。 */
function linesFrom(stat) {
  const rows = stat?.periodGoals?.rows
  if (!Array.isArray(rows) || rows.length < 2) return null
  const cut = (row) => {
    const cells = (row ?? []).map((cell) => numberOrNull(cell))
    // 第一格是 '-'（有的赛季是球队名），去掉；最后一格是总分，单独返回。
    const body = cells.slice(1)
    const total = body.length > 0 ? body[body.length - 1] : null
    return { periods: body.slice(0, -1).filter((cell) => cell !== null), total }
  }
  return { away: cut(rows[0]), home: cut(rows[1]) }
}

/** maxPlayers 的「得分/助攻/篮板」三条 → 看板卡片的领先者。 */
function leadersFrom(stat) {
  const empty = { points: null, rebounds: null, assists: null }
  const away = { ...empty }
  const home = { ...empty }
  const kinds = [
    ['得分', 'points'],
    ['篮板', 'rebounds'],
    ['助攻', 'assists'],
  ]
  for (const item of stat?.maxPlayers ?? []) {
    const kind = kinds.find(([label]) => String(item.text ?? '').includes(label))
    if (kind === undefined) continue
    const [, key] = kind
    const left = item.leftPlayer
    const right = item.rightPlayer
    if (left?.name) away[key] = { name: left.name, value: String(item.leftVal ?? ''), headshot: left.icon || null }
    if (right?.name) home[key] = { name: right.name, value: String(item.rightVal ?? ''), headshot: right.icon || null }
  }
  return { away, home }
}

function isNbaGame(info) {
  if (String(info?.mid ?? '').startsWith(NBA_MID_PREFIX) !== true) return false
  // 杯赛淘汰赛没出结果时腾讯会塞「待定 vs 待定」的占位场次。
  if (String(info.leftName ?? '').trim() === '待定' || String(info.rightName ?? '').trim() === '待定') return false
  return String(info.leftName ?? '').trim() !== '' && String(info.rightName ?? '').trim() !== ''
}

function gameOf(item, { day, teamMap, recordOf, rankOfTeam }) {
  const info = item?.matchInfo
  if (!isNbaGame(info)) return null
  const { day: tipDay, clock } = splitStamp(info.startTime)
  const status = statusOf(info)
  const awayTeam = teamOf(teamMap, info.leftId, info.leftName, info.leftBadge)
  const homeTeam = teamOf(teamMap, info.rightId, info.rightName, info.rightBadge)
  const awayScore = status.state === 'pre' ? null : numberOrNull(info.leftGoal)
  const homeScore = status.state === 'pre' ? null : numberOrNull(info.rightGoal)
  const played = status.state !== 'pre' && awayScore !== null && homeScore !== null
  const rankOf = rankOfTeam ?? (() => null)
  return {
    id: String(info.mid ?? ''),
    // 腾讯是否要会员才能看：null=未知（还没查到 detail），true/false 由 isPay 决定。
    // 注意腾讯的 isFree 字段恒为 '0'，不能用来判断免费，只有 isPay 有效（'0'=免费）。
    paywalled: null,
    name: `${awayTeam.short} @ ${homeTeam.short}`,
    shortName: `${awayTeam.short}-${homeTeam.short}`,
    date: isoOf(tipDay || day, clock),
    dateLabel: status.state === 'pre' ? `${(tipDay || day).slice(5)} ${clock}` : (tipDay || day).slice(5),
    status,
    venue: '',
    attendance: null,
    broadcast: '',
    note: String(info.matchDesc ?? ''),
    away: {
      team: awayTeam,
      score: awayScore,
      winner: played && awayScore > homeScore,
      record: recordOf(awayTeam.id),
      rank: rankOf(awayTeam.id),
      linescores: [],
      leaders: { points: null, rebounds: null, assists: null },
      homeAway: 'away',
    },
    home: {
      team: homeTeam,
      score: homeScore,
      winner: played && homeScore > awayScore,
      record: recordOf(homeTeam.id),
      rank: rankOf(homeTeam.id),
      linescores: [],
      leaders: { points: null, rebounds: null, assists: null },
      homeAway: 'home',
    },
    margin: played ? Math.abs(awayScore - homeScore) : 0,
  }
}

function countsOf(games) {
  return {
    total: games.length,
    final: games.filter((game) => game.status.state === 'post').length,
    live: games.filter((game) => game.status.state === 'in').length,
    upcoming: games.filter((game) => game.status.state === 'pre').length,
  }
}

export async function fetchScoreboard(dateInput) {
  const day = dashDate(normalizeDate(dateInput))
  const key = `tencent:scoreboard:${day}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  const [data, teamMap, standings, cctv] = await Promise.all([
    getJson(`${SCOREBOARD}?columnId=${NBA_COMPETITION}&date=${day}&dateNum=1&flag=2`, {
      cacheKey: `tencent:list:${day}`,
      // 原始比分列表缓存要短于客户端 30 秒轮询，否则进行中的比分会被旧缓存冻住。
      // 非直播日由外层 fetchScoreboard 的 10 分钟缓存挡住，这里几乎不会被重复调用。
      ttlMs: 15_000,
    }),
    fetchTeamMap(),
    fetchStandings().catch(() => ({ conferences: [] })),
    // 央视当天节目单：判断 CCTV5 / CCTV5+ 现在到底有没有在播 NBA。
    // 失败不影响看板（返回 null，客户端按「未知」展示）。
    fetchCctvStatus().catch(() => null),
  ])

  const records = new Map()
  const ranks = new Map()
  for (const conference of standings.conferences ?? []) {
    for (const row of conference.rows ?? []) {
      if (!row.team?.id) continue
      const id = String(row.team.id)
      records.set(id, `${row.wins}胜${row.losses}负`)
      // 卡片上显示「东3 / 西5」：分区简称 + 分区内名次。分区名来自排名接口的 east/west 分组。
      const abbr = conference.name === '东部' ? '东' : conference.name === '西部' ? '西' : String(conference.name ?? '')
      ranks.set(id, {
        rank: row.rank,
        conference: conference.name ?? '',
        short: abbr,
        label: abbr === '' ? '' : `${abbr}${row.rank}`,
      })
    }
  }
  const recordOf = (id) => records.get(String(id)) ?? ''
  const rankOfTeam = (id) => ranks.get(String(id)) ?? null

  // 关键坑：没有比赛的日子腾讯不返回空列表，而是把「下一个有比赛的日子」塞进来。
  // 只有键里真的出现请求的那一天，才承认这份数据属于这一天。
  const exact = data?.matches?.[day]
  const games = exact === undefined
    ? []
    : (exact.list ?? [])
      .map((item) => gameOf(item, { day, teamMap, recordOf, rankOfTeam }))
      .filter((game) => game !== null)

  // 已结束/进行中的比赛再取一次技术统计，才有分节比分与领先者（一场一个请求，6 路并发）。
  // 进行中的比赛技术统计也在变（得分王/篮板王实时更新），缓存必须短于外层比分缓存。
  const withStats = games.filter((game) => game.status.state !== 'pre')
  const stats = await mapLimit(withStats, 6, (game) =>
    getJson(`${MATCH_STAT}?mid=${encodeURIComponent(game.id)}`, {
      cacheKey: `tencent:stat:${game.id}`,
      ttlMs: game.status.state === 'post' ? 6 * 60 * 60_000 : 15_000,
    }).catch(() => null),
  )
  withStats.forEach((game, index) => {
    const stat = stats[index]
    if (stat === null || stat === undefined) return
    const lines = linesFrom(stat)
    if (lines !== null) {
      game.away.linescores = lines.away.periods
      game.home.linescores = lines.home.periods
      if (game.away.score === null && lines.away.total !== null) game.away.score = lines.away.total
      if (game.home.score === null && lines.home.total !== null) game.home.score = lines.home.total
      const played = game.away.score !== null && game.home.score !== null
      game.away.winner = played && game.away.score > game.home.score
      game.home.winner = played && game.home.score > game.away.score
      game.margin = played ? Math.abs(game.away.score - game.home.score) : 0
    }
    const leaders = leadersFrom(stat)
    game.away.leaders = leaders.away
    game.home.leaders = leaders.home
  })

  // 腾讯把「这场要不要会员」放在 matchDetail.isPay 里（'0'=免费，'1'=需会员），
  // 比分列表和技术统计都没有这个字段，所以按天补一次。单场约 3KB、0.2 秒，
  // 与其他逐场请求同样走 6 路并发；结果按天缓存，不随 15 秒轮询重复抓。
  await mapLimit(games, 6, async (game) => {
    const detail = await getJson(`${MATCH_DETAIL}?mid=${encodeURIComponent(game.id)}`, {
      cacheKey: `tencent:detail:${game.id}`,
      ttlMs: 10 * 60_000,
    }).catch(() => null)
    const isPay = String(detail?.isPay ?? '').trim()
    // 只有明确拿到 '0' 才算免费；缺字段/接口失败时保持 null（未知），
    // 宁可不标，也不要把付费场次误标成免费。
    if (isPay === '0') game.paywalled = false
    else if (isPay === '1') game.paywalled = true
  })

  const value = {
    date: day,
    stamp: day.replace(/-/gu, ''),
    games,
    counts: countsOf(games),
    fetchedAt: new Date().toISOString(),
    // 央视两个频道当天的 NBA 直播状态；null 表示没查到。
    cctv,
    sources: ['腾讯体育 NBA', '央视 CCTV 节目单'],
  }
  const ttl = value.counts.live > 0 ? 20_000 : value.counts.upcoming > 0 ? 60_000 : 10 * 60_000
  return cache.set(key, value, ttl)
}

/* ----------------------------------------------------------------- detail -- */

const DEFAULT_LABELS = ['时间', '得分', '篮板', '助攻', '投篮', '三分', '罚球', '抢断', '盖帽', '失误', '犯规', '+/-']

/** teamStats 的 12 项中文 → 与球员表列对应的队伍汇总行。 */
function totalsFor(teamStats, side) {
  const byText = new Map((teamStats ?? []).map((row) => [String(row.text ?? ''), row]))
  const pick = (label) => {
    const stat = byText.get(label)
    if (stat === undefined) return ''
    // 命中率类的字段把「命中数/出手数」放在 leftExt/rightExt 里，比分放在 leftVal/rightVal。
    return String((side === 'left' ? stat.leftExt : stat.rightExt) ?? (side === 'left' ? stat.leftVal : stat.rightVal) ?? '')
  }
  return DEFAULT_LABELS.map((label) => {
    switch (label) {
      case '投篮': return pick('投篮命中率')
      case '三分': return pick('三分命中率')
      case '罚球': return pick('罚球命中率')
      case '+/-':
      case '时间': return ''
      default: return pick(label)
    }
  })
}

function boxOf(stat, side, team) {
  const raw = stat?.playerStats?.[side]
  if (!Array.isArray(raw) || raw.length === 0) return null
  const header = raw.find((row) => Array.isArray(row?.head))
  const labels = header === undefined ? DEFAULT_LABELS : header.head.slice(1).map((label) => String(label))
  const athletes = []
  for (const row of raw) {
    if (Array.isArray(row?.head) || !Array.isArray(row?.row)) continue
    const cells = row.row.map((cell) => String(cell ?? ''))
    const name = (cells[1] ?? '').trim()
    if (name === '') continue
    // 表尾有「统计」「命中率」两行队伍汇总，它们不是球员 —— 队伍汇总单独由 teamStats 提供。
    if (/^(统计|合计|总计|命中率|球队统计)$/u.test(name)) continue
    athletes.push({
      // 中文译名可能重名（同队两个「杰伦-布朗」是真的），带上序号保证 React key 唯一。
      id: `${team?.id ?? ''}:${row.playerId ?? name}:${athletes.length}`,
      name,
      jersey: cells[0] ?? '',
      position: String(row.pos ?? ''),
      headshot: String(row.pic ?? '') || null,
      // head 把号码和球员名合成一列，row 却拆成两格 —— 所以 row 要去掉前两格，
      // 剩下的 12 项才和 head.slice(1) 的 12 列一一对应。
      stats: cells.slice(2),
      starter: String(row.onCrt ?? '') === '1',
    })
  }
  return { team, labels, totals: totalsFor(stat?.teamStats, side), athletes }
}

export async function fetchSummary(eventId) {
  const id = String(eventId ?? '').trim()
  if (!/^\d{5,7}:\d{8,12}$/u.test(id)) {
    throw new BoardError('matchId 必须是「100000:xxxxxxxx」形式（取自比分列表的比赛 ID）')
  }
  const key = `tencent:summary:${id}`
  const hit = cache.get(key)
  if (hit !== undefined) return hit

  const [stat, detail, teamMap] = await Promise.all([
    getJson(`${MATCH_STAT}?mid=${encodeURIComponent(id)}`, { timeoutMs: 20000 }),
    getJson(`${MATCH_DETAIL}?mid=${encodeURIComponent(id)}`, { timeoutMs: 20000 }).catch(() => null),
    fetchTeamMap(),
  ])

  const info = stat?.teamInfo ?? detail?.matchInfo ?? {}
  const meta = detail?.matchInfo ?? {}
  // matchStat.teamInfo 没有 quarter/quarterTime，但 quarterDesc 把两者合并了（「第2节 03:36」）。
  // matchDetail 才是最细的来源；详情接口挂了时用 quarterDesc 兜底，避免直播场次被误判成未开始。
  const quarterDesc = String(info.quarterDesc ?? '').trim()
  const descQuarter = /^(第\s*\d+\s*节|加时[^ ]*|节间[^ ]*|中场[^ ]*|进行中|未开始|比赛待定|已结束)/u.exec(quarterDesc)?.[0] ?? ''
  const descClock = /(\d{1,2}:\d{2})/u.exec(quarterDesc)?.[1] ?? ''
  const status = statusOf({
    ...info,
    liveType: info.liveType ?? meta.liveType,
    quarter: info.quarter ?? meta.quarter ?? descQuarter,
    quarterTime: info.quarterTime ?? meta.quarterTime ?? descClock,
  })
  const { day, clock } = splitStamp(info.startTime ?? meta.startTime)
  const awayTeam = teamOf(teamMap, info.leftId ?? meta.leftId, info.leftName ?? meta.leftName, info.leftBadge ?? meta.leftBadge)
  const homeTeam = teamOf(teamMap, info.rightId ?? meta.rightId, info.rightName ?? meta.rightName, info.rightBadge ?? meta.rightBadge)

  const lines = linesFrom(stat)
  const awayScore = numberOrNull(info.leftGoal ?? meta.leftGoal)
  const homeScore = numberOrNull(info.rightGoal ?? meta.rightGoal)
  const started = status.state !== 'pre'
  const played = started && awayScore !== null && homeScore !== null

  const value = {
    id,
    status,
    date: isoOf(day, clock),
    tipoff: day === '' ? '' : `${day} ${clock}`.trim(),
    // 比分接口里没有球馆，只有单场详情里有（腾讯给的是中文球馆名）。
    venue: String(meta.venue ?? '').trim(),
    attendance: null,
    officials: [],
    note: String(meta.matchDesc ?? info.matchDesc ?? ''),
    home: {
      team: homeTeam,
      score: homeScore,
      winner: played && homeScore > awayScore,
      record: '',
      linescores: lines?.home.periods ?? [],
      leaders: { points: null, rebounds: null, assists: null },
      homeAway: 'home',
    },
    away: {
      team: awayTeam,
      score: awayScore,
      winner: played && awayScore > homeScore,
      record: '',
      linescores: lines?.away.periods ?? [],
      leaders: { points: null, rebounds: null, assists: null },
      homeAway: 'away',
    },
    teamStats: (stat?.teamStats ?? []).map((row) => ({
      label: String(row.text ?? ''),
      away: String(row.leftExt ?? row.leftVal ?? ''),
      home: String(row.rightExt ?? row.rightVal ?? ''),
    })),
    boxes: [boxOf(stat, 'left', awayTeam), boxOf(stat, 'right', homeTeam)],
    fetchedAt: new Date().toISOString(),
    sources: ['腾讯体育 NBA 技术统计'],
  }
  const ttl = status.completed ? 3 * 60 * 60_000 : 30_000
  return cache.set(key, value, ttl)
}

export { shortTime }
