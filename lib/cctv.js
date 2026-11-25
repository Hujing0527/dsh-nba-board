// 央视（CCTV-5 / CCTV-5+）当天节目单：用来判断「现在到底有没有在播 NBA」。
//
// 为什么需要它：之前只看板把 CCTV5 一律标成「免费」，等于暗示「点进去就有球看」。
// 但央视每天只播 2–4 场 NBA，其余时段是足球、CBA、录像。用户点进去发现没直播，
// 比不提供入口更糟。所以这里按节目单算出三种状态：
//   live    —— 正在播 NBA（给出节目名）
//   upcoming—— 今天晚些时候有 NBA（给出开始时间与节目名）
//   none    —— 今天这频道没有 NBA 直播
//
// 接口：api.cntv.cn 的 EPG（公开、无需签名），返回当天所有节目，含 startTime/endTime 秒级时间戳。

const EPG = 'https://api.cntv.cn/epg/getEpgInfoByChannelNew'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36'

// 频道 → 看板上的展示名。key 同时是 EPG 的 c 参数。
export const CCTV_CHANNELS = [
  { key: 'cctv5', label: 'CCTV-5' },
  { key: 'cctv5plus', label: 'CCTV-5+' },
]

// 节目名里出现这些词就算「在播 NBA」。央视的写法有多种：
//   「2026/2027赛季美国职业篮球联赛- 杯赛（独行侠-掘金）」
//   「NBA常规赛：湖人 vs 勇士」
// 注意别把「中国男子篮球职业联赛」（CBA）算进来，所以先排除 CBA 相关词。
const NBA_PATTERN = /美国职业篮球联赛|美国男子篮球职业联赛|\bNBA\b|美职篮/iu
const NOT_NBA_PATTERN = /中国男子篮球职业联赛|中职篮|\bCBA\b|国际篮联|三人篮球|全明星周末技巧/iu

function isNbaProgram(title) {
  const text = String(title ?? '')
  if (text.trim() === '') return false
  if (NOT_NBA_PATTERN.test(text)) return false
  return NBA_PATTERN.test(text)
}

/** 北京时间当天日期 → EPG 的 d 参数（YYYYMMDD）。 */
function stampOf(now) {
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`
}

function clockOf(seconds) {
  const date = new Date(Number(seconds) * 1000)
  const pad = (value) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

async function fetchChannel(key, day, now) {
  const url = `${EPG}?c=${encodeURIComponent(key)}&serviceId=tvcctv&d=${day}`
  const response = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'zh-CN,zh;q=0.9',
      referer: 'https://tv.cctv.com/',
    },
    signal: AbortSignal.timeout(12000),
  })
  if (!response.ok) throw new Error(`央视节目单返回 HTTP ${response.status}`)
  const payload = await response.json()
  const channel = payload?.data?.[key]
  if (channel === undefined || channel === null) throw new Error('央视节目单结构异常')
  const programs = Array.isArray(channel.list) ? channel.list : []
  const nowSeconds = Math.floor(now.getTime() / 1000)

  let live = null
  let next = null
  for (const program of programs) {
    const start = Number.parseInt(String(program?.startTime ?? ''), 10)
    const end = Number.parseInt(String(program?.endTime ?? ''), 10)
    if (!Number.isFinite(start) || !Number.isFinite(end)) continue
    if (!isNbaProgram(program?.title)) continue
    if (start <= nowSeconds && nowSeconds < end) {
      live = { title: String(program.title), start: clockOf(start), end: clockOf(end) }
      break
    }
    if (start > nowSeconds && next === null) {
      next = { title: String(program.title), start: clockOf(start), end: clockOf(end) }
    }
  }

  return {
    key,
    // 频道当前实际在播什么（不一定与 NBA 有关），用于「当前无直播」时说明。
    onAir: String(channel.isLive ?? '').trim(),
    state: live !== null ? 'live' : next !== null ? 'upcoming' : 'none',
    program: live ?? next,
  }
}

/* ------------------------------------------------------------------ cache -- */

let cached = null

/**
 * 两个频道的 NBA 直播状态。失败时整块返回 null（调用方当作「未知」处理），
 * 不让看板因为央视接口故障而报错。缓存 5 分钟：节目单变化很慢，且不需要跟比分同步。
 * @param {Date} [now] 便于测试注入时间。
 */
export async function fetchCctvStatus(now = new Date()) {
  const day = stampOf(now)
  if (cached !== null && cached.day === day && cached.expires > Date.now()) return cached.value
  try {
    const results = await Promise.all(
      CCTV_CHANNELS.map((channel) => fetchChannel(channel.key, day, now).catch(() => null)),
    )
    const channels = {}
    for (let index = 0; index < CCTV_CHANNELS.length; index += 1) {
      const config = CCTV_CHANNELS[index]
      const result = results[index]
      channels[config.key] = result === null
        ? { key: config.key, state: 'unknown', onAir: '', program: null }
        : result
    }
    const value = { day, fetchedAt: new Date().toISOString(), channels }
    cached = { day, expires: Date.now() + 5 * 60_000, value }
    return value
  } catch {
    return null
  }
}

export const __testing = { isNbaProgram, clockOf }
