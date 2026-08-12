import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { TRAFFIC_SOURCES, plural } from '../constants'
import PeriodPicker from '../components/PeriodPicker'
import usePeriod from '../usePeriod'
import '../styles/components/modal.css' // поля дат берут оформление у .modal__input
import '../styles/pages/admin.css'
import '../styles/pages/admin-stats.css'
import '../styles/pages/admin-traffic.css'

// Кольцо строится на окружности длиной ровно 100 — тогда доля в процентах
// и есть длина дуги, и никакой тригонометрии не нужно
const RADIUS = 15.9155 // 100 / (2 * PI)
const RING_WIDTH = 6
// Зазор между секторами в тех же единицах (~2px при обычном размере кольца):
// без него соседние цвета сливаются в одно пятно
const SEGMENT_GAP = 0.4
// Совсем тонкий сектор всё равно должен быть виден — иначе площадка с одним
// заходом просто пропадает с диаграммы
const MIN_ARC = 0.35

export default function AdminTrafficPage() {
  const period = usePeriod()
  const { range, invalid } = period
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hovered, setHovered] = useState(null) // ключ источника под курсором

  useEffect(() => {
    if (invalid) {
      setError('Начало периода позже его конца')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    // stale защищает от гонки: ответ на прошлый период может прийти позже нового
    let stale = false
    api.getTrafficStats(range.from, range.to).then((data) => {
      if (stale) return
      if (!data) setError('Не удалось загрузить статистику')
      setStats(data)
      setLoading(false)
      setHovered(null)
    })
    return () => {
      stale = true
    }
  }, [range, invalid])

  const total = stats?.total ?? 0
  // Порядок секторов — как в TRAFFIC_SOURCES, а не по убыванию: цвета проверены
  // на различимость для соседей именно в нём, и при смене периода сектора
  // остаются на местах. Кто есть в ответе, но не в таблице (новый ключ с бэкенда,
  // а фронт ещё не обновили), не теряется — уходит в конец серым.
  const counts = Object.fromEntries((stats?.sources ?? []).map((s) => [s.source, s.visits]))
  const known = TRAFFIC_SOURCES.filter((s) => counts[s.key] > 0)
  const unknown = (stats?.sources ?? [])
    .filter((s) => s.visits > 0 && !TRAFFIC_SOURCES.some((k) => k.key === s.source))
    .map((s) => ({ key: s.source, label: s.source, color: '#b0b0b0' }))

  // Дуги считаем от накопленной доли: каждая начинается там, где кончилась прошлая
  let offset = 0
  const segments = [...known, ...unknown].map((source) => {
    const visits = counts[source.key] ?? 0
    const share = total ? (visits / total) * 100 : 0
    const segment = { ...source, visits, share, offset }
    offset += share
    return segment
  })

  const active = segments.find((s) => s.key === hovered) ?? null

  return (
    <div className="admin-page">
      <div className="admin-page__top">
        <h1 className="admin-page__title">Трафик</h1>
        <div className="admin-page__actions">
          <Link to="/admin/stats" className="btn btn--outline">
            Статы
          </Link>
          <Link to="/admin/orders" className="btn btn--outline">
            Заказы
          </Link>
          <Link to="/admin" className="btn btn--outline">
            К каталогу
          </Link>
        </div>
      </div>

      <PeriodPicker period={period} />

      <p className="stats-note">
        Площадку узнаём из адреса страницы, с которой к нам перешли, — его браузер
        подставляет сам. Считается один заход на вкладку, а не каждая открытая страница.
        <br />
        Мессенджеры и приложения этот адрес часто не передают: переход из личного сообщения
        в Telegram почти всегда выглядит как прямой заход. Поэтому «Прямые заходы» — это
        не только те, кто набрал адрес руками, и цифра по ним всегда завышена.
      </p>

      {error && <p className="admin-empty">{error}</p>}
      {!error && loading && <p className="admin-empty">Загрузка...</p>}

      {!error && !loading && stats && (
        <>
          {total === 0 ? (
            <p className="admin-empty">За этот промежуток заходов не было</p>
          ) : (
            <section className="traffic">
              <div className="traffic__donut">
                <svg viewBox="0 0 42 42" className="donut" role="img" aria-label="Источники трафика">
                  {segments.map((s) => (
                    <circle
                      key={s.key}
                      className={`donut__arc${hovered && hovered !== s.key ? ' donut__arc--dim' : ''}`}
                      cx="21"
                      cy="21"
                      r={RADIUS}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={RING_WIDTH}
                      // из дуги вычитаем зазор, а «остаток» на столько же длиннее —
                      // иначе сумма перестанет сходиться и сектора уползут
                      strokeDasharray={`${Math.max(s.share - SEGMENT_GAP, MIN_ARC)} ${100 - Math.max(s.share - SEGMENT_GAP, MIN_ARC)}`}
                      strokeDashoffset={-s.offset}
                      // без поворота дуги начинаются справа, на трёх часах
                      transform="rotate(-90 21 21)"
                      onMouseEnter={() => setHovered(s.key)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  ))}
                </svg>
                {/* середина кольца: либо итог, либо цифры сектора под курсором */}
                <div className="donut__center">
                  {active ? (
                    <>
                      <b className="donut__value">{Math.round(active.share)}%</b>
                      <span className="donut__caption">{active.label}</span>
                      <span className="donut__caption">
                        {active.visits} {plural(active.visits, 'заход', 'захода', 'заходов')}
                      </span>
                    </>
                  ) : (
                    <>
                      <b className="donut__value">{total}</b>
                      <span className="donut__caption">
                        {plural(total, 'заход', 'захода', 'заходов')} за период
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Таблица рядом с кольцом — по ней, а не по цвету, читаются точные
                  цифры; на неё же завязано наведение, чтобы не целиться в дугу */}
              <table className="traffic-legend">
                <tbody>
                  {segments.map((s) => (
                    <tr
                      key={s.key}
                      className={`traffic-legend__row${hovered === s.key ? ' traffic-legend__row--active' : ''}`}
                      onMouseEnter={() => setHovered(s.key)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      <td className="traffic-legend__chip-cell">
                        <span className="traffic-legend__chip" style={{ backgroundColor: s.color }} />
                      </td>
                      <th scope="row" className="traffic-legend__name">
                        {s.label}
                      </th>
                      <td className="traffic-legend__share">{s.share.toFixed(1)}%</td>
                      <td className="traffic-legend__visits">{s.visits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {stats.other_hosts.length > 0 && (
            <section className="traffic-hosts">
              <h2 className="admin-media__title">Что внутри «Другого»</h2>
              <p className="admin-media__hint">
                Площадки без своего сектора — по хосту страницы, с которой перешли.
              </p>
              <ul className="traffic-hosts__list">
                {stats.other_hosts.map((h) => (
                  <li className="traffic-hosts__item" key={h.host}>
                    <span className="traffic-hosts__host">{h.host}</span>
                    <span className="traffic-hosts__count">{h.visits}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
