window.__ModuleLoader__.load({
  id: 'dsh-nba-board',
  factory(require) {
    const React = require('react')
    const el = React.createElement
    const { useState, useEffect, useMemo, useRef, useCallback } = React

    const PANEL_ID = 'nba-board'
    const NS = 'nbaBoard'

    // ---------------------------------------------------------------- i18n --
    const ZH = {
      panel: 'NBA 每日看板',
      title: 'NBA 每日看板',
      subtitle: '比分 · 数据 · 排名 · 热点',
      tabGames: '今日赛况',
      tabNews: '热点 TOP10',
      tabStandings: '分区排名',
      today: '今天',
      prevDay: '前一天',
      nextDay: '后一天',
      pickDate: '选择日期',
      refresh: '刷新',
      refreshed: '已更新',
      loading: '加载中…',
      error: '出错了',
      retry: '重试',
      emptyGames: '这一天没有比赛',
      emptyGamesHint: '试试前后切换日期，或回到今天。',
      emptyNews: '暂时取不到新闻',
      emptyNewsHint: '直播吧新闻源可能暂时不可用，稍后再试。',
      final: '已结束',
      live: '进行中',
      upcoming: '未开始',
      countSummary: '共 {total} 场 · 已结束 {final} · 进行中 {live} · 未开始 {upcoming}',
      boxscore: '技术统计',
      leaders: '球队领先',
      pts: '得分',
      reb: '篮板',
      ast: '助攻',
      venue: '球馆',
      attendance: '上座',
      officials: '裁判',
      quarter: '分节',
      q1: '第一节', q2: '第二节', q3: '第三节', q4: '第四节', ot: '加时',
      team: '球队',
      player: '球员',
      dnp: '未出场',
      back: '返回',
      close: '关闭',
      openLink: '打开原文',
      readMore: '阅读全文',
      premium: '付费内容',
      rank: '排名',
      teamCol: '球队',
      record: '胜-负',
      pct: '胜率',
      gb: '胜差',
      streak: '连续',
      l10: '近10场',
      ppg: '场均得分',
      oppg: '场均失分',
      diff: '净胜分',
      standingsSource: '东西部排名 · 数据来自腾讯体育 NBA',
      newsSource: '新闻来自直播吧 · 北京时间',
      dataSource: '数据来源：腾讯体育 NBA · 直播吧 NBA（简体中文）',
      autoRefresh: '进行中的比赛每 15 秒自动刷新',
      updatedAt: '更新于 {time}',
      watch: '看直播',
      watchTitle: '在哪个平台看这场球',
      watchHint: '比赛具体在哪家播出、是否免费，以平台页面为准。',
      watchDirect: '本场直达',
      watchIndirect: '可去这些平台找',
      watchSearch: '无直达 · 搜索页',
      watchChannel: '无直达 · 频道页',
      watchSchedule: '无直达 · 赛程页',
      watchOpen: '打开',
      watchTencent: '腾讯体育',
      watchTencentNote: '国内全场次，按本场比赛直达',
      watchMigu: '咪咕视频',
      watchMiguNote: '国内全场次，需在平台内自行搜索 NBA',
      watchCctv: '央视 CCTV5',
      watchCctvNote: '仅焦点场次，需在频道内找当天场次',
      watchNba: 'NBA 官方',
      watchNbaNote: '境外 / 英文，按日期在赛程页找本场（可接 League Pass）',
      watchClose: '关闭',
      notPlayed: '—',
      pickGame: '点击查看技术统计',
      scoringRun: '最大分差',
      winner: '胜',
      totalGames: '场次',
      liveShort: 'LIVE',
      detailTitle: '比赛详情',
      noStats: '这场比赛还没有技术统计',
      noStatsHint: '比赛开始后才会有球员数据。',
      upcomingHint: '这场比赛还没开始',
      tipoff: '开球时间',
      minutes: '时间',
    }

    const EN = {
      panel: 'NBA Daily Board',
      title: 'NBA Daily Board',
      subtitle: 'Scores · Stats · Standings · News',
      tabGames: 'Scores',
      tabNews: 'Top 10 News',
      tabStandings: 'Standings',
      today: 'Today',
      prevDay: 'Previous day',
      nextDay: 'Next day',
      pickDate: 'Pick a date',
      refresh: 'Refresh',
      refreshed: 'Updated',
      loading: 'Loading…',
      error: 'Something went wrong',
      retry: 'Retry',
      emptyGames: 'No games on this day',
      emptyGamesHint: 'Try another date, or jump back to today.',
      emptyNews: 'No news right now',
      emptyNewsHint: 'The Zhibo8 news feed may be unavailable; try again shortly.',
      final: 'Final',
      live: 'Live',
      upcoming: 'Scheduled',
      countSummary: '{total} games · {final} final · {live} live · {upcoming} scheduled',
      boxscore: 'Box score',
      leaders: 'Team leaders',
      pts: 'Points',
      reb: 'Rebounds',
      ast: 'Assists',
      venue: 'Venue',
      attendance: 'Attendance',
      officials: 'Officials',
      quarter: 'By quarter',
      q1: 'Q1', q2: 'Q2', q3: 'Q3', q4: 'Q4', ot: 'OT',
      team: 'Team',
      player: 'Player',
      dnp: 'DNP',
      back: 'Back',
      close: 'Close',
      openLink: 'Open article',
      readMore: 'Read more',
      premium: 'Premium',
      rank: 'Rank',
      teamCol: 'Team',
      record: 'W-L',
      pct: 'PCT',
      gb: 'GB',
      streak: 'STRK',
      l10: 'L10',
      ppg: 'PPG',
      oppg: 'OPP PPG',
      diff: 'DIFF',
      standingsSource: 'Eastern & Western conferences · data from Tencent Sports NBA',
      newsSource: 'News from Zhibo8 · times in Beijing time',
      dataSource: 'Data source: Tencent Sports NBA · Zhibo8 NBA (Simplified Chinese)',
      autoRefresh: 'Live games refresh every 15 seconds',
      updatedAt: 'Updated {time}',
      watch: 'Watch live',
      watchTitle: 'Where to watch this game',
      watchHint: 'Which platform carries this game, and whether it is free, is up to that platform.',
      watchDirect: 'This game',
      watchIndirect: 'Also available on',
      watchSearch: 'No direct link · search page',
      watchChannel: 'No direct link · channel page',
      watchSchedule: 'No direct link · schedule page',
      watchOpen: 'Open',
      watchTencent: 'Tencent Sports',
      watchTencentNote: 'All games in China, links straight to this game',
      watchMigu: 'Migu Video',
      watchMiguNote: 'All games in China, search for NBA inside the app',
      watchCctv: 'CCTV-5',
      watchCctvNote: 'Marquee games only, find today inside the channel',
      watchNba: 'NBA official',
      watchNbaNote: 'Outside China / English, find this game on the schedule page (League Pass)',
      watchClose: 'Close',
      notPlayed: '—',
      pickGame: 'Click for the box score',
      scoringRun: 'Biggest lead',
      winner: 'W',
      totalGames: 'Games',
      liveShort: 'LIVE',
      detailTitle: 'Game detail',
      noStats: 'No box score yet',
      noStatsHint: 'Player stats appear once the game tips off.',
      upcomingHint: 'This game has not started',
      tipoff: 'Tip-off',
      minutes: 'MIN',
    }

    const DICT = { zh: ZH, en: EN }
    let localeSvc = null

    function activeLang() {
      try {
        const snapshot = localeSvc?.getSnapshot?.()
        return /^zh/i.test(snapshot?.active || 'zh-CN') ? 'zh' : 'en'
      } catch { return 'zh' }
    }

    function translate(key, vars) {
      const lang = activeLang()
      const raw = DICT[lang]?.[key] ?? DICT.en[key] ?? key
      if (!vars) return raw
      return raw.replace(/\{(\w+)\}/g, (match, name) => (vars[name] === undefined ? match : String(vars[name])))
    }

    function useT() {
      const [, force] = useState(0)
      useEffect(() => {
        if (!localeSvc?.subscribe) return undefined
        return localeSvc.subscribe(() => force((value) => value + 1))
      }, [])
      return translate
    }

    // ----------------------------------------------------------------- rpc ---
    async function rpc(method, params = {}) {
      const response = await fetch('/nba-board/api/rpc', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ method, params }),
      })
      const payload = await response.json().catch(() => null)
      if (!payload) throw new Error(`HTTP ${response.status}`)
      if (!payload.ok) throw new Error(payload.error?.message || 'request failed')
      return payload.value
    }

    function reportClient(kind, message, detail) {
      try {
        fetch('/nba-board/api/rpc', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ method: 'client.event', params: { kind, message: String(message ?? ''), detail: String(detail ?? '') } }),
        }).catch(() => {})
      } catch { /* diagnostics are best effort */ }
    }

    class PanelBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { error: null }
      }

      static getDerivedStateFromError(error) {
        return { error }
      }

      componentDidCatch(error, info) {
        reportClient('panel-crash', error?.message || String(error), info?.componentStack || '')
      }

      render() {
        if (this.state.error) {
          return el('div', { className: 'nb-crash' },
            el('strong', null, translate('error')),
            el('p', null, String(this.state.error?.message || this.state.error)))
        }
        return this.props.children
      }
    }

    // ---------------------------------------------------------------- dates ---
    function pad(value) {
      return String(value).padStart(2, '0')
    }

    function localStamp(date) {
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    }

    function todayLocal() {
      return localStamp(new Date())
    }

    function shiftStamp(stamp, days) {
      const [year, month, day] = stamp.split('-').map(Number)
      const date = new Date(year, (month || 1) - 1, day || 1)
      date.setDate(date.getDate() + days)
      return localStamp(date)
    }

    function formatClock(iso) {
      if (!iso) return ''
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return ''
      return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
    }

    function relativeTime(iso) {
      if (!iso) return ''
      const then = new Date(iso).getTime()
      if (Number.isNaN(then)) return ''
      const zh = activeLang() === 'zh'
      const minutes = Math.round((Date.now() - then) / 60000)
      if (minutes < 1) return zh ? '刚刚' : 'just now'
      if (minutes < 60) return zh ? `${minutes} 分钟前` : `${minutes}m ago`
      const hours = Math.round(minutes / 60)
      if (hours < 24) return zh ? `${hours} 小时前` : `${hours}h ago`
      return formatClock(iso)
    }

    function weekdayLabel(stamp, lang) {
      const [year, month, day] = stamp.split('-').map(Number)
      const date = new Date(year, (month || 1) - 1, day || 1)
      try {
        return new Intl.DateTimeFormat(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric', weekday: 'short' }).format(date)
      } catch {
        return stamp
      }
    }

    // ---------------------------------------------------------------- hooks ---
    function useAsync(loader, deps) {
      const [state, setState] = useState({ loading: true, data: null, error: null })
      const [nonce, setNonce] = useState(0)
      const loaderRef = useRef(loader)
      loaderRef.current = loader
      useEffect(() => {
        let alive = true
        setState((prev) => ({ ...prev, loading: true, error: null }))
        loaderRef.current()
          .then((data) => { if (alive) setState({ loading: false, data, error: null }) })
          .catch((error) => { if (alive) setState({ loading: false, data: null, error: String(error?.message || error) }) })
        return () => { alive = false }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [...deps, nonce])
      // Stable identity so an interval built on it is not torn down every render.
      const reload = useCallback(() => setNonce((value) => value + 1), [])
      return [state, reload]
    }

    // ------------------------------------------------------------ primitives ---
    function Spinner({ size = 16 }) {
      return el('span', {
        className: 'nb-spinner',
        style: { width: size, height: size },
        'aria-hidden': 'true',
      })
    }

    function Btn({ children, onClick, variant, disabled, title }) {
      return el('button', {
        type: 'button',
        className: `nb-btn${variant === 'primary' ? ' nb-btn-primary' : ''}${variant === 'ghost' ? ' nb-btn-ghost' : ''}`,
        onClick,
        disabled: disabled === true,
        title,
      }, children)
    }

    function Chip({ children, tone, style }) {
      return el('span', { className: `nb-chip${tone ? ` nb-chip-${tone}` : ''}`, style }, children)
    }

    function Empty({ title, hint, action }) {
      return el('div', { className: 'nb-empty' },
        el('div', { className: 'nb-empty-mark', 'aria-hidden': 'true' }, el(LeagueMark, { size: 40 })),
        el('strong', null, title),
        hint ? el('p', null, hint) : null,
        action)
    }

    function TeamLogo({ team, size = 30 }) {
      const [failed, setFailed] = useState(false)
      useEffect(() => { setFailed(false) }, [team?.logo])
      if (!team?.logo || failed) {
        return el('span', {
          className: 'nb-logo nb-logo-fallback',
          style: { width: size, height: size, fontSize: Math.round(size * 0.34) },
          'aria-hidden': 'true',
        }, team?.abbr || '?')
      }
      return el('img', {
        className: 'nb-logo',
        src: team.logo,
        alt: team.abbr || team.name || '',
        width: size,
        height: size,
        loading: 'lazy',
        referrerPolicy: 'no-referrer',
        onError: () => setFailed(true),
      })
    }

    function Headshot({ src, name, size = 26 }) {
      const [failed, setFailed] = useState(false)
      useEffect(() => { setFailed(false) }, [src])
      if (!src || failed) {
        return el('span', {
          className: 'nb-avatar nb-avatar-fallback',
          style: { width: size, height: size, fontSize: Math.round(size * 0.4) },
          'aria-hidden': 'true',
        }, (name || '?').trim().charAt(0))
      }
      return el('img', {
        className: 'nb-avatar',
        src,
        alt: name || '',
        width: size,
        height: size,
        loading: 'lazy',
        referrerPolicy: 'no-referrer',
        onError: () => setFailed(true),
      })
    }

    function StateChip({ status, t }) {
      if (status.state === 'in') {
        return el('span', { className: 'nb-state nb-state-live' },
          el('span', { className: 'nb-live-dot', 'aria-hidden': 'true' }),
          status.short || t('live'))
      }
      if (status.state === 'post') return el('span', { className: 'nb-state nb-state-post' }, status.short || t('final'))
      return el('span', { className: 'nb-state nb-state-pre' }, status.short || t('upcoming'))
    }

    // ------------------------------------------------------------- game card ---
    function LineScore({ game, t }) {
      const periods = Math.max(game.home.linescores.length, game.away.linescores.length)
      if (periods === 0) return null
      const head = []
      for (let index = 0; index < periods; index += 1) {
        head.push(index < 4 ? t(`q${index + 1}`) : t('ot'))
      }
      const row = (side) => el('tr', { key: side.team.abbr, className: side.winner ? 'is-winner' : '' },
        el('td', { className: 'nb-ls-team' }, el(TeamLogo, { team: side.team, size: 18 }), el('span', null, side.team.abbr)),
        side.linescores.map((points, index) => el('td', { key: index }, points)),
        el('td', { className: 'nb-ls-total' }, side.score))
      return el('table', { className: 'nb-linescore' },
        el('thead', null, el('tr', null,
          el('th', { className: 'nb-ls-team' }, t('team')),
          head.map((label, index) => el('th', { key: index }, label)),
          el('th', null, t('pts')))),
        el('tbody', null, row(game.away), row(game.home)))
    }

    function LeaderRow({ leader, label }) {
      if (!leader || !leader.name) return null
      return el('div', { className: 'nb-leader' },
        el(Headshot, { src: leader.headshot, name: leader.name, size: 22 }),
        el('span', { className: 'nb-leader-text' },
          el('span', { className: 'nb-leader-name' }, leader.name),
          el('span', { className: 'nb-leader-value' }, `${leader.value} ${label}`)))
    }

    /**
     * 一队三行：得分王 / 篮板王 / 助攻王。
     * 只显示该队真正有的项目（未开赛或某项缺失时整行不渲染），不会留空占位。
     */
    function LeaderColumn({ side, t }) {
      const leaders = side.leaders ?? {}
      const rows = [
        [leaders.points, t('pts')],
        [leaders.rebounds, t('reb')],
        [leaders.assists, t('ast')],
      ].filter(([leader]) => leader && leader.name)
      if (rows.length === 0) return null
      return el('div', { className: 'nb-leader-col' },
        el('div', { className: 'nb-leader-head' }, side.team.abbr),
        rows.map(([leader, label], index) => el(LeaderRow, { key: index, leader, label })))
    }

    // ------------------------------------------------------------- watch ---
    // 直播入口：只有腾讯能按「这一场」直达（用 matchId 拼）。咪咕、央视、NBA 官方
    // 都没有可构造的按场次 URL，只能到搜索页/频道页/赛程页 —— 所以在卡片里用
    // 「本场直达 / 无直达」明确分区，不让人以为点进去就是本场。
    // 全部为合法授权平台：腾讯体育 / 咪咕视频 / 央视 CCTV5 / NBA 官方。
    function watchLinks(game, t) {
      const mid = encodeURIComponent(game.id || '')
      const day = String(game.date || '').slice(0, 10)
      return [
        {
          key: 'tencent',
          label: t('watchTencent'),
          note: t('watchTencentNote'),
          url: `https://kbs.sports.qq.com/kbsweb/game.htm?mid=${mid}`,
          direct: true,
        },
        {
          key: 'migu',
          label: t('watchMigu'),
          note: t('watchMiguNote'),
          url: 'https://www.miguvideo.com/p/search?keyword=NBA',
          direct: false,
          badge: t('watchSearch'),
        },
        {
          key: 'cctv',
          label: t('watchCctv'),
          note: t('watchCctvNote'),
          url: 'https://tv.cctv.com/live/cctv5/',
          direct: false,
          badge: t('watchChannel'),
        },
        {
          key: 'nba',
          label: t('watchNba'),
          note: t('watchNbaNote'),
          url: `https://www.nba.com/games?date=${day}`,
          direct: false,
          badge: t('watchSchedule'),
        },
      ]
    }

    /**
     * 「看直播」按钮 + 弹出的平台卡片（弹窗，不是跳到浏览器）。
     * 按钮点击不冒泡，避免同时触发卡片的技术统计弹层。
     */
    function WatchDialog({ game, onClose, t }) {
      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])

      const links = watchLinks(game, t)
      const direct = links.filter((link) => link.direct === true)
      const indirect = links.filter((link) => link.direct !== true)
      const row = (link) => el('a', {
        key: link.key,
        className: `nb-watch-row${link.direct ? ' is-direct' : ''}`,
        href: link.url,
        target: '_blank',
        rel: 'noopener noreferrer',
      },
        el('span', { className: 'nb-watch-row-main' },
          el('span', { className: 'nb-watch-row-label' }, link.label),
          el('span', { className: 'nb-watch-row-note' }, link.note)),
        el('span', {
          className: `nb-watch-badge${link.direct ? ' is-direct' : ''}`,
        }, link.direct ? t('watchDirect') : link.badge),
        el('span', { className: 'nb-watch-row-open', 'aria-hidden': 'true' }, '↗'))

      return el('div', {
        className: 'nb-overlay nb-watch-overlay',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': t('watchTitle'),
        onClick: (event) => { if (event.target === event.currentTarget) onClose() },
      },
        el('div', { className: 'nb-watch-card' },
          el('header', { className: 'nb-watch-card-head' },
            el('div', { className: 'nb-watch-card-titles' },
              el('h2', null, t('watchTitle')),
              el('p', null, `${game.away?.team?.abbr ?? ''} vs ${game.home?.team?.abbr ?? ''}${game.dateLabel ? ` · ${game.dateLabel}` : ''}`)),
            el('button', {
              type: 'button', className: 'nb-modal-close', onClick: onClose, 'aria-label': t('watchClose'),
            }, '✕')),
          el('div', { className: 'nb-watch-card-body' },
            direct.length > 0
              ? el('div', { className: 'nb-watch-group' },
                el('h3', { className: 'nb-watch-group-title' }, t('watchDirect')),
                direct.map(row))
              : null,
            indirect.length > 0
              ? el('div', { className: 'nb-watch-group' },
                el('h3', { className: 'nb-watch-group-title' }, t('watchIndirect')),
                indirect.map(row))
              : null,
            el('p', { className: 'nb-watch-hint' }, t('watchHint')))))
    }

    /** 卡片头部的「看直播」按钮；点击只打开弹窗，不跳浏览器。 */
    function WatchButton({ game, t }) {
      const [open, setOpen] = useState(false)
      return el('span', {
        className: 'nb-watch',
        onClick: (event) => event.stopPropagation(),
        onKeyDown: (event) => event.stopPropagation(),
      },
        el('button', {
          type: 'button',
          className: 'nb-watch-btn',
          'aria-haspopup': 'dialog',
          'aria-expanded': open,
          title: t('watchTitle'),
          onClick: () => setOpen(true),
        },
          el('span', { className: 'nb-watch-dot', 'aria-hidden': 'true' }),
          el('span', null, t('watch'))),
        open ? el(WatchDialog, { game, t, onClose: () => setOpen(false) }) : null)
    }

    function GameCard({ game, t, onOpen }) {
      const started = game.status.state !== 'pre'
      const awayWin = game.away.winner
      const homeWin = game.home.winner
      return el('article', {
        className: `nb-game${game.status.state === 'in' ? ' is-live' : ''}`,
        onClick: () => onOpen(game),
        role: 'button',
        tabIndex: 0,
        onKeyDown: (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onOpen(game) } },
      },
        el('header', { className: 'nb-game-head' },
          el(StateChip, { status: game.status, t }),
          el('span', { className: 'nb-game-meta' },
            // 腾讯给的时间是北京时间：已结束只显示日期，未开始显示「日期 开球时间」。
            game.dateLabel || formatClock(game.date),
            game.venue ? ` · ${game.venue}` : ''),
          el('span', { className: 'nb-game-spacer' }),
          el(WatchButton, { game, t }),
          el('span', { className: 'nb-game-openhint' }, t('pickGame'))),
        el('div', { className: 'nb-teams' },
          [game.away, game.home].map((side, index) => el('div', {
            key: `${side.team.id}-${index}`,
            className: `nb-team${side.winner ? ' is-winner' : ''}${started ? '' : ' is-pre'}`,
          },
            el(TeamLogo, { team: side.team, size: 30 }),
            el('div', { className: 'nb-team-text' },
              el('span', { className: 'nb-team-name' }, side.team.short || side.team.name),
              side.rank?.label ? el('span', {
                className: 'nb-team-rank',
                title: `${side.rank.conference ?? ''}第 ${side.rank.rank} 名`,
              }, side.rank.label) : null,
              el('span', { className: 'nb-team-record' }, side.record || t('notPlayed'))),
            el('span', { className: 'nb-score' }, started ? side.score : t('notPlayed'))))),
        started ? el(LineScore, { game, t }) : null,
        started
          ? el('div', { className: 'nb-leaders' },
            el(LeaderColumn, { side: game.away, t }),
            el(LeaderColumn, { side: game.home, t }))
          : null,
        game.note ? el('p', { className: 'nb-game-note' }, game.note) : null)
    }

    // ------------------------------------------------------------ games tab ---
    function GamesTab({ date, t, onOpenGame }) {
      const [state, reload] = useAsync(() => rpc('scoreboard', { date }), [date])
      const live = (state.data?.counts?.live ?? 0) > 0

      useEffect(() => {
        if (!live) return undefined
        // 与服务端 15 秒缓存链对齐：进行中的比分/节次尽量贴近实时。
        const timer = window.setInterval(reload, 15000)
        return () => window.clearInterval(timer)
      }, [live, reload])

      if (state.loading && !state.data) {
        return el('div', { className: 'nb-loading' }, el(Spinner, { size: 18 }), t('loading'))
      }
      if (state.error) {
        return el(Empty, {
          title: t('error'),
          hint: state.error,
          action: el(Btn, { onClick: reload, variant: 'primary' }, t('retry')),
        })
      }
      const data = state.data
      if (!data || data.games.length === 0) {
        return el(Empty, { title: t('emptyGames'), hint: t('emptyGamesHint') })
      }
      return el('div', { className: 'nb-stack' },
        el('div', { className: 'nb-summary' },
          el('span', { className: 'nb-summary-text' },
            t('countSummary', {
              total: data.counts.total,
              final: data.counts.final,
              live: data.counts.live,
              upcoming: data.counts.upcoming,
            })),
          live ? el('span', { className: 'nb-summary-live' }, t('autoRefresh')) : null,
          el('span', { className: 'nb-summary-time' }, t('updatedAt', { time: formatClock(data.fetchedAt) }))),
        el('div', { className: 'nb-games' },
          data.games.map((game) => el(GameCard, { key: game.id, game, t, onOpen: onOpenGame }))))
    }

    // ------------------------------------------------------------- news tab ---
    // 资讯来源（直播吧自己的编辑稿、Twitter、YouTube、微博、露天看台…）不是固定的枚举，
    // 按名字稳定地分配一个色调，同一来源每次刷新颜色一致。
    const NEWS_TONES = ['brand', 'post', 'idle', 'live', 'warn']
    const NEWS_TYPE_TONE = { 直播吧: 'brand' }
    function toneOfSource(type) {
      if (NEWS_TYPE_TONE[type]) return NEWS_TYPE_TONE[type]
      let sum = 0
      for (const char of String(type ?? '')) sum += char.codePointAt(0) ?? 0
      return NEWS_TONES[sum % NEWS_TONES.length]
    }

    function NewsTab({ t }) {
      const [state, reload] = useAsync(() => rpc('news', { limit: 10 }), [])
      if (state.loading && !state.data) {
        return el('div', { className: 'nb-loading' }, el(Spinner, { size: 18 }), t('loading'))
      }
      if (state.error) {
        return el(Empty, {
          title: t('error'),
          hint: state.error,
          action: el(Btn, { onClick: reload, variant: 'primary' }, t('retry')),
        })
      }
      const articles = state.data?.articles ?? []
      if (articles.length === 0) return el(Empty, { title: t('emptyNews'), hint: t('emptyNewsHint') })
      return el('div', { className: 'nb-stack' },
        el('ol', { className: 'nb-news' },
          articles.map((article, index) => el('li', { key: article.id || index, className: 'nb-news-item' },
            el('span', { className: 'nb-news-rank', 'aria-hidden': 'true' }, index + 1),
            article.image ? el('img', {
              className: 'nb-news-thumb',
              src: article.image,
              alt: '',
              loading: 'lazy',
              referrerPolicy: 'no-referrer',
              onError: (event) => { event.currentTarget.style.display = 'none' },
            }) : null,
            el('div', { className: 'nb-news-body' },
              el('div', { className: 'nb-news-meta' },
                article.type ? el(Chip, { tone: toneOfSource(article.type) }, article.type) : null,
                article.premium ? el(Chip, { tone: 'warn' }, t('premium')) : null,
                el('span', { className: 'nb-news-time' }, relativeTime(article.published, t))),
              article.link
                ? el('a', {
                  className: 'nb-news-headline',
                  href: article.link,
                  target: '_blank',
                  rel: 'noreferrer noopener',
                }, article.headline)
                : el('span', { className: 'nb-news-headline' }, article.headline),
              article.description ? el('p', { className: 'nb-news-desc' }, article.description.replace(/^—\s*/u, '')) : null)))),
        el('p', { className: 'nb-source' }, t('newsSource')))
    }

    // -------------------------------------------------------- standings tab ---
    // 腾讯排名接口只给 排名/胜负/胜率/胜差，没有连续战绩、近10场、场均得失分。
    // 这里按「这一列所有球队是否都有值」决定要不要显示，换数据源也不会露出空列。
    const STANDING_COLUMNS = [
      { key: 'streak', label: 'streak', className: 'nb-num' },
      { key: 'lastTen', label: 'l10', className: 'nb-num' },
      { key: 'ppg', label: 'ppg', className: 'nb-num nb-hide-sm' },
      { key: 'oppg', label: 'oppg', className: 'nb-num nb-hide-sm' },
    ]

    function StandingsTable({ conference, t }) {
      const rows = conference.rows ?? []
      const visible = STANDING_COLUMNS.filter((column) =>
        rows.some((row) => String(row[column.key] ?? '').trim() !== ''))
      const headCells = [
        el('th', { key: 'rank', className: 'nb-num' }, t('rank')),
        el('th', { key: 'team' }, t('teamCol')),
        el('th', { key: 'wl', className: 'nb-num' }, t('record')),
        el('th', { key: 'pct', className: 'nb-num' }, t('pct')),
        el('th', { key: 'gb', className: 'nb-num' }, t('gb')),
        ...visible.map((column) => el('th', { key: column.key, className: column.className }, t(column.label))),
      ]
      const body = rows.map((row) => {
        const cells = [
          el('td', { key: 'rank', className: 'nb-num nb-rank-cell' }, row.rank),
          el('td', { key: 'team' }, el('span', { className: 'nb-table-team' },
            el(TeamLogo, { team: row.team, size: 20 }),
            el('span', null, row.team.short || row.team.name))),
          el('td', { key: 'wl', className: 'nb-num' }, `${row.wins}-${row.losses}`),
          el('td', { key: 'pct', className: 'nb-num' }, row.pct),
          el('td', { key: 'gb', className: 'nb-num' }, row.gamesBehind || '-'),
          ...visible.map((column) => el('td', { key: column.key, className: column.className },
            String(row[column.key] ?? '').trim() || t('notPlayed'))),
        ]
        return el('tr', { key: row.team.id || row.rank }, cells)
      })
      return el('section', { className: 'nb-conf' },
        el('h3', { className: 'nb-conf-title' }, conference.name),
        el('div', { className: 'nb-table-wrap' },
          el('table', { className: 'nb-table' },
            el('thead', null, el('tr', null, headCells)),
            el('tbody', null, body))))
    }

    function StandingsTab({ t }) {
      const [state, reload] = useAsync(() => rpc('standings'), [])
      if (state.loading && !state.data) {
        return el('div', { className: 'nb-loading' }, el(Spinner, { size: 18 }), t('loading'))
      }
      if (state.error) {
        return el(Empty, {
          title: t('error'),
          hint: state.error,
          action: el(Btn, { onClick: reload, variant: 'primary' }, t('retry')),
        })
      }
      const conferences = state.data?.conferences ?? []
      if (conferences.length === 0) return el(Empty, { title: t('error') })
      return el('div', { className: 'nb-stack' },
        el('div', { className: 'nb-conf-grid' },
          conferences.map((conference) => el(StandingsTable, { key: conference.name, conference, t }))),
        el('p', { className: 'nb-source' }, t('standingsSource')))
    }

    // -------------------------------------------------------- detail overlay ---
    function PlayerTable({ box, t }) {
      if (!box) return null
      const labels = box.labels
      // 腾讯表头已是中文：「时间 得分 篮板 助攻 投篮 三分 罚球 抢断 盖帽 失误 犯规 +/-」
      const ptsIndex = labels.indexOf('得分')
      const sorted = [...box.athletes].sort((a, b) => {
        const av = Number.parseInt(a.stats[ptsIndex] ?? '0', 10) || 0
        const bv = Number.parseInt(b.stats[ptsIndex] ?? '0', 10) || 0
        return bv - av
      })
      return el('div', { className: 'nb-box-team' },
        el('div', { className: 'nb-box-head' },
          el(TeamLogo, { team: box.team, size: 24 }),
          el('strong', null, box.team.name),
          box.totals.length > 0 && ptsIndex >= 0
            ? el('span', { className: 'nb-box-total' }, `${t('pts')} ${box.totals[ptsIndex] ?? ''}`)
            : null),
        el('div', { className: 'nb-table-wrap' },
          el('table', { className: 'nb-table nb-table-compact' },
            el('thead', null, el('tr', null,
              el('th', null, t('player')),
              labels.map((label, index) => el('th', { key: index, className: 'nb-num' }, label)))),
            el('tbody', null, sorted.map((athlete, rowIndex) => el('tr', { key: `${athlete.id || athlete.name}#${rowIndex}` },
              el('td', null, el('span', { className: 'nb-table-player' },
                el(Headshot, { src: athlete.headshot, name: athlete.name, size: 20 }),
                el('span', { className: 'nb-player-name' }, athlete.name),
                athlete.position ? el('span', { className: 'nb-player-pos' }, athlete.position) : null)),
              athlete.stats.map((value, index) => el('td', { key: index, className: 'nb-num' }, value === '' ? t('notPlayed') : value))))))))
    }

    function DetailOverlay({ game, t, onClose }) {
      const [summary, setSummary] = useState({ loading: true, data: null, error: null })
      const isLive = game.status.state === 'in'

      useEffect(() => {
        let alive = true
        let first = true
        const load = () => {
          // 首屏显示 loading；后续轮询静默刷新，避免每 15 秒整个弹层闪一下。
          if (first) setSummary({ loading: true, data: null, error: null })
          return rpc('game', { eventId: game.id })
            .then((data) => { if (alive) setSummary({ loading: false, data, error: null }) })
            .catch((error) => { if (alive) setSummary({ loading: false, data: null, error: String(error?.message || error) }) })
            .finally(() => { first = false })
        }
        load()
        // 进行中的比赛：弹层里的比分/分节/球员数据也跟着实时刷新。
        const timer = isLive ? window.setInterval(load, 15000) : null
        return () => { alive = false; if (timer !== null) window.clearInterval(timer) }
      }, [game.id, isLive])

      useEffect(() => {
        const onKey = (event) => { if (event.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
      }, [onClose])

      const game0 = summary.data
      const home = game0?.home ?? game.home
      const away = game0?.away ?? game.away
      const boxes = game0?.boxes ?? []
      const started = game.status.state !== 'pre'
      // 比分列表页没有球馆信息，详情页才有（腾讯给的是中文球馆名）。
      const venue = game0?.venue || game.venue

      return el('div', {
        className: 'nb-overlay',
        role: 'dialog',
        'aria-modal': 'true',
        'aria-label': t('detailTitle'),
        onClick: (event) => { if (event.target === event.currentTarget) onClose() },
      },
        el('div', { className: 'nb-modal' },
          el('header', { className: 'nb-modal-head' },
            el('div', { className: 'nb-modal-teams' },
              el('span', { className: 'nb-modal-side' },
                el(TeamLogo, { team: away?.team, size: 26 }),
                el('strong', null, away?.team?.abbr || ''),
                game.away?.rank?.label ? el('span', { className: 'nb-team-rank' }, game.away.rank.label) : null),
              el('span', { className: 'nb-modal-score' }, started ? `${away?.score ?? 0} - ${home?.score ?? 0}` : 'vs'),
              el('span', { className: 'nb-modal-side' },
                el('strong', null, home?.team?.abbr || ''),
                game.home?.rank?.label ? el('span', { className: 'nb-team-rank' }, game.home.rank.label) : null,
                el(TeamLogo, { team: home?.team, size: 26 }))),
            el('div', { className: 'nb-modal-meta' },
              el(StateChip, { status: game.status, t }),
              game0?.tipoff ? el('span', null, `${t('tipoff')} ${game0.tipoff}`) : null,
              venue ? el('span', null, `${t('venue')} ${venue}`) : null,
              summary.data?.attendance ? el('span', null, `${t('attendance')} ${summary.data.attendance}`) : null,
              summary.data?.officials?.length ? el('span', null, `${t('officials')} ${summary.data.officials.join(' / ')}`) : null),
            el('button', { type: 'button', className: 'nb-modal-close', onClick: onClose, 'aria-label': t('close') }, '✕')),
          el('div', { className: 'nb-modal-body' },
            summary.loading ? el('div', { className: 'nb-loading' }, el(Spinner, { size: 16 }), t('loading')) : null,
            summary.error ? el('p', { className: 'nb-modal-error' }, summary.error) : null,
            !started ? el('p', { className: 'nb-modal-hint' }, t('upcomingHint'), ' · ', t('tipoff'), ' ', game.dateLabel || formatClock(game.date)) : null,
            started && summary.data && boxes.every((box) => box === null || box.athletes.length === 0)
              ? el('p', { className: 'nb-modal-hint' }, t('noStats'), ' · ', t('noStatsHint'))
              : null,
            started ? el(LineScore, { game: summary.data ? { ...game, home, away } : game, t }) : null,
            boxes.filter((box) => box !== null).map((box) => el(PlayerTable, { key: box.team.id, box, t })))))
    }

    // ------------------------------------------------------------------ shell ---
    const TABS = [
      { id: 'games', key: 'tabGames' },
      { id: 'news', key: 'tabNews' },
      { id: 'standings', key: 'tabStandings' },
    ]

    function App() {
      const t = useT()
      const [tab, setTab] = useState('games')
      const [date, setDate] = useState(() => todayLocal())
      const [detail, setDetail] = useState(null)
      const [tick, setTick] = useState(0)
      const [flash, setFlash] = useState('')

      const dateInput = useRef(null)
      const isToday = date === todayLocal()

      const go = useCallback((days) => {
        setDate((current) => shiftStamp(current, days))
      }, [])

      const jumpToday = useCallback(() => setDate(todayLocal()), [])

      const onRefresh = useCallback(() => {
        setTick((value) => value + 1)
        setFlash(t('refreshed'))
        window.setTimeout(() => setFlash(''), 1600)
      }, [t])

      const openPicker = useCallback(() => {
        const input = dateInput.current
        if (!input) return
        try {
          if (typeof input.showPicker === 'function') input.showPicker()
          else input.focus()
        } catch {
          input.focus()
        }
      }, [])

      const label = useMemo(() => weekdayLabel(date, activeLang()), [date])

      return el('div', { className: 'nb-root' },
        el('style', null, STYLE),
        el('header', { className: 'nb-head' },
          el('div', { className: 'nb-mark' }, el(LeagueMark, { size: 24 })),
          el('div', { className: 'nb-titles' },
            el('h1', null, t('title')),
            el('p', null, `${t('subtitle')} · ${label}`)),
          el('div', { className: 'nb-head-actions' },
            el('div', { className: 'nb-datenav' },
              el('button', {
                type: 'button', className: 'nb-datenav-btn', title: t('prevDay'), 'aria-label': t('prevDay'),
                onClick: () => go(-1),
              }, '‹'),
              el('button', {
                type: 'button', className: `nb-datenav-date${isToday ? ' is-today' : ''}`,
                onClick: openPicker,
                title: t('pickDate'),
              }, date, isToday ? el('span', { className: 'nb-datenav-badge' }, t('today')) : null),
              el('input', {
                ref: dateInput,
                type: 'date',
                className: 'nb-dateinput',
                value: date,
                'aria-label': t('pickDate'),
                onChange: (event) => { if (event.target.value) setDate(event.target.value) },
              }),
              el('button', {
                type: 'button', className: 'nb-datenav-btn', title: t('nextDay'), 'aria-label': t('nextDay'),
                onClick: () => go(1),
              }, '›')),
            isToday ? null : el(Btn, { variant: 'ghost', onClick: jumpToday }, t('today')),
            el(Btn, { variant: 'primary', onClick: onRefresh }, flash || t('refresh')))),
        el('nav', { className: 'nb-tabs', role: 'tablist' },
          TABS.map((item) => el('button', {
            key: item.id,
            type: 'button',
            role: 'tab',
            'aria-selected': tab === item.id,
            className: `nb-tab${tab === item.id ? ' is-on' : ''}`,
            onClick: () => setTab(item.id),
          }, t(item.key)))),
        el('div', { className: 'nb-body' },
          tab === 'games' ? el(GamesTab, { key: `games-${tick}`, date, t, onOpenGame: setDetail }) : null,
          tab === 'news' ? el(NewsTab, { key: `news-${tick}`, t }) : null,
          tab === 'standings' ? el(StandingsTab, { key: `standings-${tick}`, t }) : null),
        el('footer', { className: 'nb-foot' }, t('dataSource')),
        detail ? el(DetailOverlay, { key: detail.id, game: detail, t, onClose: () => setDetail(null) }) : null)
    }

    // ------------------------------------------------------------------ icon ---
    // 全站统一的「联盟标志」：腾讯 CDN 的 NBA 赛事 logo。
    // 加载失败时退回内联 SVG 篮球，确保侧边栏图标永远不会空着。
    const LEAGUE_LOGO = 'https://sports3.gtimg.com/competitionLogo/100000.png'

    function BallSvg({ size }) {
      return el('svg', {
        width: size, height: size, viewBox: '0 0 24 24', fill: 'none', 'aria-hidden': 'true',
        style: { display: 'block' },
      },
        el('circle', { cx: 12, cy: 12, r: 8.6, stroke: 'currentColor', strokeWidth: 1.6 }),
        el('path', { d: 'M3.6 12h16.8', stroke: 'currentColor', strokeWidth: 1.6 }),
        el('path', { d: 'M12 3.4c2.5 2.3 3.9 5.3 3.9 8.6S14.5 18.3 12 20.6c-2.5-2.3-3.9-5.3-3.9-8.6S9.5 5.7 12 3.4Z', stroke: 'currentColor', strokeWidth: 1.6 }))
    }

    function LeagueMark({ size = 20 }) {
      const [failed, setFailed] = useState(false)
      if (failed) return el('span', { style: { color: 'inherit' } }, el(BallSvg, { size }))
      return el('img', {
        className: 'nb-league',
        src: LEAGUE_LOGO,
        alt: 'NBA',
        width: size,
        height: size,
        loading: 'lazy',
        referrerPolicy: 'no-referrer',
        onError: () => setFailed(true),
      })
    }

    function PanelIcon({ size = 20, active }) {
      const color = active ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-label-secondary)'
      return el('span', { className: 'nb-panel-icon', style: { color, width: size, height: size } },
        el(LeagueMark, { size }),
        active ? el('i', { className: 'nb-panel-dot' }) : null)
    }

    // ----------------------------------------------------------------- style ---
    const STYLE = `
.nb-root{display:flex;flex-direction:column;height:100%;min-height:0;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.nb-head{display:flex;align-items:center;gap:12px;padding:14px 22px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex:none;flex-wrap:wrap}
.nb-mark{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary);flex:none}
.nb-titles{flex:1;min-width:150px}
.nb-titles h1{margin:0;font-size:15px;font-weight:600;letter-spacing:.2px}
.nb-titles p{margin:0;font-size:11.5px;color:var(--dsw-alias-label-secondary)}
.nb-head-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.nb-datenav{display:flex;align-items:center;gap:2px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;padding:2px;background:var(--dsw-alias-bg-base)}
.nb-datenav-btn{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:15px;line-height:1;padding:3px 8px;border-radius:6px;cursor:pointer}
.nb-datenav-btn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.nb-datenav-date{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-size:12.5px;font-variant-numeric:tabular-nums;padding:3px 8px;border-radius:6px;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.nb-datenav-date:hover{background:var(--dsw-alias-bg-layer-2)}
.nb-datenav-date.is-today{color:var(--dsw-alias-brand-primary);font-weight:600}
.nb-datenav-badge{font-size:9.5px;padding:0 5px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 16%,transparent);color:var(--dsw-alias-brand-primary);font-weight:600}
.nb-dateinput{position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;border:0;padding:0;margin:-1px;overflow:hidden}
.nb-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;padding:5px 11px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;line-height:1.6;white-space:nowrap;flex:none;font-family:inherit}
.nb-btn:hover:not([disabled]){background:var(--dsw-alias-bg-layer-2)}
.nb-btn[disabled]{opacity:.5;cursor:default}
.nb-btn-primary{background:var(--dsw-alias-brand-primary);border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-label-primary-foreground)}
.nb-btn-primary:hover:not([disabled]){filter:brightness(1.06);background:var(--dsw-alias-brand-primary)}
.nb-btn-ghost{border-color:transparent;color:var(--dsw-alias-label-secondary)}
.nb-btn-ghost:hover{color:var(--dsw-alias-label-primary)}
.nb-tabs{display:flex;gap:2px;padding:0 14px;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);flex:none;overflow-x:auto}
.nb-tab{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12.5px;padding:10px 12px;cursor:pointer;border-bottom:2px solid transparent;white-space:nowrap;font-family:inherit}
.nb-tab:hover{color:var(--dsw-alias-label-primary)}
.nb-tab.is-on{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
.nb-body{flex:1;min-height:0;overflow-y:auto;padding:16px 22px 28px}
.nb-stack{display:flex;flex-direction:column;gap:12px;max-width:1100px}
.nb-foot{flex:none;padding:6px 22px;border-top:1px solid var(--dsw-alias-border-l1);font-size:10.5px;color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}
.nb-loading{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-secondary);font-size:12px;padding:22px 2px}
.nb-spinner{display:inline-block;border:2px solid var(--dsw-alias-border-l2);border-top-color:var(--dsw-alias-brand-primary);border-radius:50%;animation:nb-spin .8s linear infinite;flex:none}
@keyframes nb-spin{to{transform:rotate(360deg)}}
.nb-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:48px 20px;text-align:center;color:var(--dsw-alias-label-secondary)}
.nb-empty strong{color:var(--dsw-alias-label-primary);font-size:13.5px}
.nb-empty p{margin:0;font-size:12px;max-width:420px}
.nb-empty-mark{display:flex;align-items:center;justify-content:center;width:56px;height:56px;opacity:.85}
.nb-summary{display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:11.5px;color:var(--dsw-alias-label-secondary);padding:9px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.nb-summary-text{color:var(--dsw-alias-label-primary);font-weight:500}
.nb-summary-live{color:var(--dsw-alias-state-success-primary)}
.nb-summary-time{margin-left:auto;font-variant-numeric:tabular-nums}
.nb-games{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:12px}
.nb-game{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);padding:11px 13px 12px;display:flex;flex-direction:column;gap:9px;cursor:pointer;transition:border-color .15s,box-shadow .15s,transform .15s;text-align:left}
.nb-game:hover{border-color:var(--dsw-alias-border-l3);box-shadow:0 6px 18px rgba(0,0,0,.10)}
.nb-game:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px}
.nb-game.is-live{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 45%,var(--dsw-alias-border-l1))}
.nb-game-head{display:flex;align-items:center;gap:8px;font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.nb-game-meta{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.nb-game-spacer{flex:1;min-width:4px}
.nb-game-openhint{opacity:0;transition:opacity .15s;white-space:nowrap}
.nb-game:hover .nb-game-openhint{opacity:1}
.nb-watch{flex:none;display:inline-flex}
.nb-watch-btn{appearance:none;display:inline-flex;align-items:center;gap:4px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font-size:10.5px;font-family:inherit;line-height:1.5;padding:1px 7px;border-radius:999px;cursor:pointer;white-space:nowrap;transition:color .15s,border-color .15s,background .15s}
.nb-watch-btn:hover{color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-2)}
.nb-watch-dot{width:5px;height:5px;border-radius:50%;background:var(--dsw-alias-state-error-primary);flex:none}
.nb-watch-overlay{z-index:70}
.nb-watch-card{width:min(440px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,.34);overflow:hidden;animation:nb-rise .16s ease-out}
.nb-watch-card-head{display:flex;align-items:flex-start;gap:10px;padding:14px 16px 11px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.nb-watch-card-titles{flex:1;min-width:0}
.nb-watch-card-titles h2{margin:0;font-size:14px;font-weight:600;line-height:1.45}
.nb-watch-card-titles p{margin:2px 0 0;font-size:11px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-watch-card-body{padding:10px 16px 14px;display:flex;flex-direction:column;gap:11px;overflow-y:auto}
.nb-watch-group{display:flex;flex-direction:column;gap:5px}
.nb-watch-group-title{margin:0;font-size:9.5px;font-weight:600;letter-spacing:.04em;color:var(--dsw-alias-label-secondary);text-transform:uppercase;opacity:.8}
.nb-watch-row{display:flex;align-items:center;gap:9px;padding:9px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;text-decoration:none;color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);transition:border-color .15s,background .15s}
.nb-watch-row:hover{border-color:var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-layer-2)}
.nb-watch-row.is-direct{border-color:color-mix(in srgb,var(--dsw-alias-state-success-primary) 42%,var(--dsw-alias-border-l1))}
.nb-watch-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}
.nb-watch-row-label{font-size:12.5px;font-weight:600;line-height:1.4}
.nb-watch-row-note{font-size:10px;line-height:1.35;color:var(--dsw-alias-label-secondary)}
.nb-watch-badge{flex:none;font-size:9px;font-weight:600;line-height:1.5;padding:1px 6px;border-radius:999px;background:color-mix(in srgb,var(--dsw-alias-label-secondary) 14%,transparent);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.nb-watch-badge.is-direct{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 18%,transparent);color:var(--dsw-alias-state-success-primary)}
.nb-watch-row-open{flex:none;font-size:11px;color:var(--dsw-alias-label-secondary);opacity:.7}
.nb-watch-hint{margin:0;font-size:9.5px;line-height:1.45;color:var(--dsw-alias-label-secondary);opacity:.85}
.nb-state{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:600;padding:1px 7px;border-radius:999px;white-space:nowrap;flex:none}
.nb-state-live{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 16%,transparent);color:var(--dsw-alias-state-success-primary)}
.nb-state-post{background:color-mix(in srgb,var(--dsw-alias-label-secondary) 12%,transparent);color:var(--dsw-alias-label-secondary)}
.nb-state-pre{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);color:var(--dsw-alias-brand-primary)}
.nb-live-dot{width:5px;height:5px;border-radius:50%;background:currentColor;animation:nb-pulse 1.4s ease-in-out infinite}
@keyframes nb-pulse{0%,100%{opacity:1}50%{opacity:.35}}
.nb-teams{display:flex;flex-direction:column;gap:5px}
.nb-team{display:flex;align-items:center;gap:9px}
.nb-team.is-winner .nb-team-name,.nb-team.is-winner .nb-score{font-weight:700}
.nb-team.is-pre .nb-score,.nb-team.is-pre .nb-team-name{color:var(--dsw-alias-label-secondary);font-weight:500}
.nb-logo{display:block;object-fit:contain;flex:none}
.nb-league{display:block;object-fit:contain;flex:none}
.nb-panel-icon{position:relative;display:inline-flex;align-items:center;justify-content:center}
.nb-panel-dot{position:absolute;right:-2px;bottom:-2px;width:6px;height:6px;border-radius:999px;background:var(--dsw-alias-state-success-primary);box-shadow:0 0 0 2px var(--dsw-alias-bg-layer-1,transparent)}
.nb-logo-fallback{display:inline-flex;align-items:center;justify-content:center;border-radius:6px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-weight:600;letter-spacing:.2px}
.nb-team-text{flex:1;min-width:0;display:flex;align-items:baseline;gap:7px}
.nb-team-name{font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-team-rank{font-size:9.5px;line-height:1.5;padding:0 4px;border-radius:4px;flex:none;font-variant-numeric:tabular-nums;font-weight:600;margin-left:-1px;background:color-mix(in srgb,var(--dsw-alias-label-secondary) 13%,transparent);color:var(--dsw-alias-label-secondary)}
.nb-team.is-winner .nb-team-rank{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-label-primary)}
.nb-team.is-pre .nb-team-rank{opacity:.75}
.nb-team-record{font-size:10.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;flex:none}
.nb-score{font-size:17px;font-variant-numeric:tabular-nums;min-width:38px;text-align:right;flex:none}
.nb-linescore{width:100%;border-collapse:collapse;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.nb-linescore th{font-weight:500;font-size:10px;padding:2px 0;text-align:right;opacity:.8}
.nb-linescore th.nb-ls-team{text-align:left}
.nb-linescore td{padding:2px 0;text-align:right}
.nb-linescore td.nb-ls-team{text-align:left;display:flex;align-items:center;gap:5px;color:var(--dsw-alias-label-primary)}
.nb-linescore td.nb-ls-total{color:var(--dsw-alias-label-primary);font-weight:600;padding-left:6px}
.nb-linescore tr.is-winner td{color:var(--dsw-alias-label-primary)}
.nb-leaders{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px;padding-top:7px;border-top:1px dashed var(--dsw-alias-border-l1)}
.nb-leaders:empty{display:none}
.nb-leader-col{display:flex;flex-direction:column;gap:4px;min-width:0}
.nb-leader-head{font-size:9.5px;font-weight:600;letter-spacing:.03em;color:var(--dsw-alias-label-secondary);opacity:.85}
.nb-leader{display:flex;align-items:center;gap:6px;min-width:0}
.nb-avatar{display:block;border-radius:50%;object-fit:cover;background:var(--dsw-alias-bg-layer-2);flex:none}
.nb-avatar-fallback{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-weight:600}
.nb-leader-text{display:flex;flex-direction:column;min-width:0;line-height:1.25}
.nb-leader-name{font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-leader-value{font-size:9.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.nb-game-note{margin:0;font-size:10.5px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nb-news{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}
.nb-news-item{display:flex;align-items:flex-start;gap:11px;padding:11px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);border-radius:8px;transition:background .15s}
.nb-news-item:hover{background:var(--dsw-alias-bg-layer-1)}
.nb-news-rank{flex:none;width:22px;height:22px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:color-mix(in srgb,var(--dsw-alias-brand-primary) 12%,transparent);color:var(--dsw-alias-brand-primary);font-variant-numeric:tabular-nums}
.nb-news-thumb{flex:none;width:74px;height:52px;border-radius:7px;object-fit:cover;background:var(--dsw-alias-bg-layer-2)}
.nb-news-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.nb-news-meta{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.nb-news-time{font-size:10.5px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.nb-news-headline{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary);text-decoration:none;line-height:1.4}
.nb-news-headline:hover{color:var(--dsw-alias-brand-primary);text-decoration:underline}
.nb-news-desc{margin:0;font-size:11.5px;color:var(--dsw-alias-label-secondary);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.nb-chip{display:inline-flex;align-items:center;font-size:9.5px;padding:1px 6px;border-radius:999px;font-weight:600;letter-spacing:.2px;white-space:nowrap}
.nb-chip-post{background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);color:var(--dsw-alias-state-success-primary)}
.nb-chip-live{background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.nb-chip-idle{background:color-mix(in srgb,var(--dsw-alias-label-secondary) 12%,transparent);color:var(--dsw-alias-label-secondary)}
.nb-chip-brand{background:color-mix(in srgb,var(--dsw-alias-brand-primary) 14%,transparent);color:var(--dsw-alias-brand-primary)}
.nb-chip-warn{background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 16%,transparent);color:var(--dsw-alias-state-warn-primary)}
.nb-source{margin:2px 0 0;font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.nb-conf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:14px}
.nb-conf{border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.nb-conf-title{margin:0;padding:10px 13px;font-size:12.5px;font-weight:600;border-bottom:1px solid var(--dsw-alias-border-l1)}
.nb-table-wrap{overflow-x:auto}
.nb-table{width:100%;border-collapse:collapse;font-size:11.5px;font-variant-numeric:tabular-nums}
.nb-table th{text-align:left;font-weight:500;font-size:10.5px;color:var(--dsw-alias-label-secondary);padding:6px 9px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap;background:var(--dsw-alias-bg-layer-1);position:sticky;top:0}
.nb-table td{padding:6px 9px;border-bottom:1px solid var(--dsw-alias-border-l1);white-space:nowrap}
.nb-table tbody tr:last-child td{border-bottom:0}
.nb-table tbody tr:hover{background:var(--dsw-alias-bg-layer-2)}
.nb-table .nb-num{text-align:right}
.nb-table th.nb-num{text-align:right}
.nb-rank-cell{color:var(--dsw-alias-label-secondary);font-weight:600}
.nb-table-team{display:inline-flex;align-items:center;gap:7px;min-width:0}
.nb-table-player{display:inline-flex;align-items:center;gap:7px;min-width:0}
.nb-player-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px}
.nb-player-pos{font-size:9.5px;color:var(--dsw-alias-label-secondary);flex:none}
.nb-table-compact td,.nb-table-compact th{padding:5px 7px}
.nb-box-team{border:1px solid var(--dsw-alias-border-l1);border-radius:11px;overflow:hidden;background:var(--dsw-alias-bg-layer-1);margin-top:12px}
.nb-box-head{display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:12.5px}
.nb-box-total{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.nb-overlay{position:fixed;inset:0;background:var(--dsw-alias-bg-mask-1);display:flex;align-items:center;justify-content:center;padding:24px;z-index:60;animation:nb-fade .14s ease-out}
@keyframes nb-fade{from{opacity:0}to{opacity:1}}
.nb-modal{width:min(940px,100%);max-height:100%;display:flex;flex-direction:column;background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l2);border-radius:14px;box-shadow:0 24px 64px rgba(0,0,0,.34);overflow:hidden;animation:nb-rise .16s ease-out}
@keyframes nb-rise{from{transform:translateY(8px);opacity:.6}to{transform:none;opacity:1}}
.nb-modal-head{display:flex;align-items:center;gap:14px;padding:12px 16px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;flex:none}
.nb-modal-teams{display:flex;align-items:center;gap:9px}
.nb-modal-side{display:inline-flex;align-items:center;gap:6px;font-size:13px}
.nb-modal-score{font-size:16px;font-weight:700;font-variant-numeric:tabular-nums;padding:0 4px}
.nb-modal-meta{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:10.5px;color:var(--dsw-alias-label-secondary);flex:1;min-width:0}
.nb-modal-close{appearance:none;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:13px;cursor:pointer;padding:4px 7px;border-radius:7px;flex:none}
.nb-modal-close:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.nb-modal-body{padding:12px 16px 16px;overflow-y:auto;min-height:0}
.nb-modal-error{margin:0 0 8px;color:var(--dsw-alias-state-error-primary);font-size:11.5px}
.nb-modal-hint{margin:0 0 8px;color:var(--dsw-alias-label-secondary);font-size:11.5px}
.nb-crash{padding:24px;display:flex;flex-direction:column;gap:6px;color:var(--dsw-alias-state-error-primary);font-size:12px}
.nb-crash p{margin:0;color:var(--dsw-alias-label-secondary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;white-space:pre-wrap;word-break:break-word}
@media (max-width:720px){
.nb-body{padding:12px 14px 22px}
.nb-head{padding:11px 14px}
.nb-games{grid-template-columns:1fr}
.nb-hide-sm{display:none}
.nb-news-thumb{width:56px;height:42px}
.nb-overlay{padding:0;align-items:flex-end}
.nb-modal{max-height:92%;border-radius:14px 14px 0 0}
.nb-watch-card{max-height:92%;border-radius:14px 14px 0 0}
}
`

    // ------------------------------------------------------------------ apply ---
    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        localeSvc = ctx.locale || null
        try {
          if (ctx.locale?.register) ctx.effect(() => ctx.locale.register(NS, DICT), 'nba-board: dictionaries')
        } catch (error) {
          reportClient('locale-register', error?.message || String(error), '')
        }

        const onError = (event) => {
          if (/ResizeObserver loop/i.test(event.message || '')) return
          reportClient('window-error', event.message || 'window error', `${event.filename || ''}:${event.lineno || ''} ${event.error?.stack || ''}`)
        }
        const onRejection = (event) => reportClient('unhandled-rejection', 'unhandledrejection', String(event.reason?.stack || event.reason || ''))
        window.addEventListener('error', onError)
        window.addEventListener('unhandledrejection', onRejection)
        ctx.effect(() => () => {
          window.removeEventListener('error', onError)
          window.removeEventListener('unhandledrejection', onRejection)
        })

        function Page() {
          return el(PanelBoundary, null, el(App))
        }

        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 55,
          label: () => translate('panel'),
        }, PanelIcon))

        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, Page))
      },
    }
  },
})
