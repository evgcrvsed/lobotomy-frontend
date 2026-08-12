import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { formatPrice, plural } from '../constants'
import '../styles/components/modal.css' // поля дат берут оформление у .modal__input
import '../styles/pages/admin.css'
import '../styles/pages/admin-stats.css'

// Готовые промежутки. days — сколько дней захватываем, считая сегодняшний:
// «месяц» — это последние 30 дней, а не календарный август
const PRESETS = [
  { id: 'week', label: 'Неделя', days: 7 },
  { id: 'month', label: 'Месяц', days: 30 },
  { id: 'quarter', label: 'Квартал', days: 90 },
  { id: 'halfyear', label: 'Полгода', days: 182 },
  { id: 'year', label: 'Год', days: 365 },
]
const DEFAULT_PRESET = 'month'

// Сколько подписей влезает под диаграмму, не наезжая друг на друга
const MAX_AXIS_LABELS = 10
// Горизонтальные линии сетки (кроме нуля)
const GRID_LINES = 4

/** Дата в YYYY-MM-DD по местному времени — именно её ждёт бэкенд.
 *  toISOString() тут не годится: он переводит в UTC и вечером сдвигает день назад. */
function toInputDate(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

/** «2026-08-12» -> Date на местную полночь. new Date(строка) разобрал бы её как UTC,
 *  и в минусовых поясах подпись столбца уехала бы на день назад. */
function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function rangeForPreset(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return { from: toInputDate(from), to: toInputDate(to) }
}

/** Короткая сумма для шкалы: 150 тыс, 1.2 млн — целиком там не помещается */
function shortMoney(value) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)} млн`
  if (value >= 10_000) return `${Math.round(value / 1000)} тыс`
  return String(value)
}

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']

/** Подпись столбца. Для месяцев — «авг», для дней и недель — «12.08» */
function bucketLabel(iso, unit) {
  const date = parseDate(iso)
  if (unit === 'month') return MONTHS[date.getMonth()]
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`
}

/** Что именно посчитано в столбце: день, неделя с такого-то или месяц */
function bucketTitle(iso, unit) {
  const date = parseDate(iso)
  const day = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  if (unit === 'month') return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
  if (unit === 'week') return `неделя с ${day}`
  return day
}

const UNIT_NOTE = {
  day: 'по дням',
  week: 'по неделям — на длинном промежутке дневные столбцы не читаются',
  month: 'по месяцам — на длинном промежутке дневные столбцы не читаются',
}

export default function AdminStatsPage() {
  const [preset, setPreset] = useState(DEFAULT_PRESET)
  const [range, setRange] = useState(() =>
    rangeForPreset(PRESETS.find((p) => p.id === DEFAULT_PRESET).days)
  )
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [hovered, setHovered] = useState(null) // индекс столбца под курсором

  useEffect(() => {
    // конец раньше начала — бэкенд ответит 400, но и спрашивать незачем:
    // такие даты получаются прямо во время правки поля вручную
    if (range.from > range.to) {
      setError('Начало периода позже его конца')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    // stale защищает от гонки: ответ на прошлый период может прийти позже нового
    let stale = false
    api.getOrderStats(range.from, range.to).then((data) => {
      if (stale) return
      if (!data) setError('Не удалось загрузить статистику')
      setStats(data)
      setLoading(false)
      setHovered(null)
    })
    return () => {
      stale = true
    }
  }, [range])

  function applyPreset(p) {
    setPreset(p.id)
    setRange(rangeForPreset(p.days))
  }

  function editRange(field, value) {
    if (!value) return // очищенное поле дат — период остаётся прежним
    setPreset(null) // даты правили руками, готовый промежуток больше не выбран
    setRange((r) => ({ ...r, [field]: value }))
  }

  const points = stats?.points ?? []
  const maxRevenue = Math.max(0, ...points.map((p) => p.revenue))
  // шаг подписей по оси: показываем не все, иначе они наезжают друг на друга
  const labelStep = Math.ceil(points.length / MAX_AXIS_LABELS)
  // сетка от нуля до максимума; при пустом периоде рисовать её нечем
  const gridValues = maxRevenue
    ? Array.from({ length: GRID_LINES }, (_, i) => (maxRevenue / GRID_LINES) * (i + 1))
    : []
  const active = hovered !== null ? points[hovered] : null

  return (
    <div className="admin-page">
      <div className="admin-page__top">
        <h1 className="admin-page__title">Статы</h1>
        <div className="admin-page__actions">
          <Link to="/admin/orders" className="btn btn--outline">
            Заказы
          </Link>
          <Link to="/admin" className="btn btn--outline">
            К каталогу
          </Link>
        </div>
      </div>

      <div className="admin-filters">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={`admin-filter${preset === p.id ? ' admin-filter--active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="stats-range">
        <label className="stats-range__field">
          <span>С</span>
          <input
            type="date"
            className="modal__input"
            value={range.from}
            max={range.to}
            onChange={(e) => editRange('from', e.target.value)}
          />
        </label>
        <label className="stats-range__field">
          <span>По</span>
          <input
            type="date"
            className="modal__input"
            value={range.to}
            min={range.from}
            onChange={(e) => editRange('to', e.target.value)}
          />
        </label>
      </div>

      <p className="stats-note">
        Считается по дате оплаты: заказ попадает в тот день, когда пришли деньги. Неоплаченные
        и отменённые в отчёт не входят.
      </p>

      {error && <p className="admin-empty">{error}</p>}
      {!error && loading && <p className="admin-empty">Загрузка...</p>}

      {!error && !loading && stats && (
        <>
          <div className="stats-cards">
            <div className="stats-card stats-card--main">
              <span className="stats-card__label">Доход за период</span>
              <b className="stats-card__value">{formatPrice(stats.revenue)}</b>
              <span className="stats-card__hint">
                товары {formatPrice(stats.items_revenue)} + доставка{' '}
                {formatPrice(stats.delivery_revenue)}
              </span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">Оплаченных заказов</span>
              <b className="stats-card__value">{stats.orders}</b>
              <span className="stats-card__hint">
                {plural(stats.orders, 'заказ', 'заказа', 'заказов')} за выбранный промежуток
              </span>
            </div>
            <div className="stats-card">
              <span className="stats-card__label">Средний чек</span>
              <b className="stats-card__value">{formatPrice(stats.average_check)}</b>
              <span className="stats-card__hint">доход, делённый на число заказов</span>
            </div>
          </div>

          <section className="stats-chart">
            <header className="stats-chart__head">
              <h2 className="stats-chart__title">Заработок {UNIT_NOTE[stats.unit] ?? ''}</h2>
              {/* строка живёт всегда: без неё наведение дёргало бы диаграмму вниз */}
              <p className="stats-chart__readout">
                {active ? (
                  <>
                    <b>{bucketTitle(active.date, stats.unit)}</b> — {formatPrice(active.revenue)},{' '}
                    {active.orders} {plural(active.orders, 'заказ', 'заказа', 'заказов')}
                  </>
                ) : (
                  'Наведите на столбец, чтобы увидеть цифры'
                )}
              </p>
            </header>

            {stats.orders === 0 ? (
              <p className="admin-empty">За этот промежуток оплаченных заказов не было</p>
            ) : (
              <div className="stats-chart__body">
                <div className="stats-chart__plot">
                  {gridValues.map((value) => (
                    <div
                      className="stats-chart__grid-line"
                      key={value}
                      style={{ bottom: `${(value / maxRevenue) * 100}%` }}
                    >
                      <span className="stats-chart__grid-label">{shortMoney(Math.round(value))}</span>
                    </div>
                  ))}
                  <div className="stats-chart__bars">
                    {points.map((point, i) => (
                      <div
                        className={`stats-chart__col${hovered === i ? ' stats-chart__col--active' : ''}`}
                        key={point.date}
                        title={`${bucketTitle(point.date, stats.unit)}: ${formatPrice(point.revenue)}`}
                        onMouseEnter={() => setHovered(i)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <div
                          className="stats-chart__bar"
                          // 1% минимум: нулевой столбец иначе исчезает, и по диаграмме
                          // не видно, что этот день вообще был в периоде
                          style={{ height: `${Math.max((point.revenue / maxRevenue) * 100, 1)}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="stats-chart__axis">
                  {points.map((point, i) => (
                    // подпись под каждым столбцом, но текст — не у каждой:
                    // пустые держат разметку, чтобы подписи стояли ровно под своими столбцами
                    <span className="stats-chart__axis-label" key={point.date}>
                      {i % labelStep === 0 ? bucketLabel(point.date, stats.unit) : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
