import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { errorTextFrom } from '../api/errors'
import { ORDER_STATUS_LABELS, deliveryLabels, formatDateTime, formatPrice } from '../constants'
import '../styles/pages/admin.css'
import '../styles/pages/admin-orders.css'

// Вручённых и отменённых здесь нет: с ними работа закончена, и в списке они
// только мешают. Достаются поиском — он идёт по всем заказам (см. ACTIVE_STATUSES
// в backend/services/order_service.py)
const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'paid', label: 'В работе' },
  { id: 'shipped', label: 'Отправленные' },
  { id: 'ready', label: 'Готовы к выдаче' },
  { id: 'pending', label: 'Ожидают оплаты' },
]

// Пауза перед запросом: иначе поиск уходит на сервер на каждую букву
const SEARCH_DELAY = 300

// Как часто спрашиваем, чем кончилась выгрузка. Её делает отдельный контейнер,
// и ответить он может только через базу — иначе кнопка не узнала бы результат
const EXPORT_POLL_DELAY = 2000
const EXPORT_OPEN_STATUSES = ['pending', 'running']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [methods, setMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [drafts, setDrafts] = useState({}) // номер заказа -> введённый трек
  const [savingNumber, setSavingNumber] = useState(null)
  const [savedNumber, setSavedNumber] = useState(null)
  const [syncingNumber, setSyncingNumber] = useState(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null) // null — поиск не идёт, показываем список
  const [searching, setSearching] = useState(false)
  const [exportJob, setExportJob] = useState(null) // последняя выгрузка в Google-таблицу
  const [starting, setStarting] = useState(false) // ждём ответа на нажатие кнопки

  useEffect(() => {
    Promise.all([api.getAllOrders(), api.getDeliveryMethods()]).then(([list, dm]) => {
      setOrders(list)
      setMethods(dm)
      setLoading(false)
    })
  }, [])

  // Состояние выгрузки живёт в базе, а не в этой вкладке: её могли запустить
  // с другого устройства, и кнопка должна показывать это же
  useEffect(() => {
    api.getSheetsExport().then(setExportJob)
  }, [])

  const exportRunning = EXPORT_OPEN_STATUSES.includes(exportJob?.status)

  useEffect(() => {
    if (!exportRunning) return
    let stale = false
    const timer = setTimeout(() => {
      api.getSheetsExport().then((job) => {
        if (!stale) setExportJob(job)
      })
    }, EXPORT_POLL_DELAY)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [exportRunning, exportJob])

  useEffect(() => {
    const text = query.trim()
    if (!text) {
      setResults(null)
      setSearching(false)
      return
    }
    setSearching(true)
    // stale защищает от гонки: ответ на прошлый запрос может прийти позже нового
    let stale = false
    const timer = setTimeout(() => {
      api.getAllOrders(text).then((list) => {
        if (stale) return
        setResults(list)
        setSearching(false)
      })
    }, SEARCH_DELAY)
    return () => {
      stale = true
      clearTimeout(timer)
    }
  }, [query])

  /** Заказ изменился — подменяем его и в списке, и в результатах поиска:
   *  сейчас на экране может быть любой из двух. */
  function replaceOrder(updated) {
    const patch = (list) => list.map((o) => (o.number === updated.number ? updated : o))
    setOrders(patch)
    setResults((list) => (list ? patch(list) : list))
  }

  async function saveTracking(order) {
    const value = (drafts[order.number] ?? '').trim()
    setSavingNumber(order.number)
    try {
      const res = await api.setOrderTracking(order.number, value)
      if (!res.ok) {
        alert('Не удалось сохранить: ' + (await errorTextFrom(res)))
        return
      }
      const updated = await res.json()
      replaceOrder(updated)
      setSavedNumber(order.number)
      setTimeout(() => setSavedNumber(null), 1800)
    } finally {
      setSavingNumber(null)
    }
  }

  /** Спросить у СДЭК статус этого заказа прямо сейчас. */
  async function syncCdek(order) {
    setSyncingNumber(order.number)
    try {
      const res = await api.syncOrderCdek(order.number)
      if (!res.ok) {
        alert('СДЭК не ответил: ' + (await errorTextFrom(res)))
        return
      }
      const updated = await res.json()
      replaceOrder(updated)
    } finally {
      setSyncingNumber(null)
    }
  }

  /** Поставить синхронизацию с таблицей в очередь. Дальше её подхватит sheets-worker. */
  async function exportToSheets() {
    setStarting(true)
    try {
      const res = await api.startSheetsExport()
      if (!res.ok) {
        alert('Не удалось запустить выгрузку: ' + (await errorTextFrom(res)))
        return
      }
      setExportJob(await res.json())
    } finally {
      setStarting(false)
    }
  }

  // при поиске показываем найденное (там бывают и вручённые, и отменённые),
  // иначе — заказы в работе; фильтр по статусу применяется к тому, что на экране
  const shown = results ?? orders
  const visible = filter === 'all' ? shown : shown.filter((o) => o.status === filter)

  return (
    <div className="admin-page">
      <div className="admin-page__top">
        <h1 className="admin-page__title">Заказы</h1>
        <div className="admin-page__actions">
          {/* Кнопка не ждёт саму выгрузку: она кладёт задачу в очередь, а ходит
              в Google отдельный контейнер — итог подтягивается опросом.
              Жать можно сколько угодно: заказ, который уже в таблице, не задвоится */}
          <button
            className="btn btn--outline"
            type="button"
            disabled={starting || exportRunning}
            onClick={exportToSheets}
          >
            {starting || exportRunning ? 'Синхронизируем....' : 'Эксп. в Google-таблицу'}
          </button>
          <Link to="/admin" className="btn btn--outline">
            К каталогу
          </Link>
        </div>
      </div>

      {exportRunning && (
        <p className="admin-export">
          Синхронизируюсь..........
          Отметки о пошиве в таблице не трогаются.
        </p>
      )}
      {exportJob && !exportRunning && (
        <p className={`admin-export${exportJob.status === 'error' ? ' admin-export--error' : ''}`}>
          Таблица {formatDateTime(exportJob.finished_at ?? exportJob.created_at)} — {exportJob.message}
        </p>
      )}

      <div className="admin-orders__search">
        <input
          className="admin-orders__search-input"
          type="search"
          placeholder="Поиск по номеру, ФИО, почте или телефону"
          aria-label="Поиск заказов"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button type="button" className="btn btn--outline" onClick={() => setQuery('')}>
            Сбросить
          </button>
        )}
      </div>

      <div className="admin-filters">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`admin-filter${filter === f.id ? ' admin-filter--active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <p className="admin-orders__note">
        {results
          ? 'Поиск идёт по всем заказам, включая вручённые и отменённые.'
          : 'Показаны заказы в работе. Вручённые и отменённые — через поиск.'}
      </p>

      {loading && <p className="admin-empty">Загрузка...</p>}
      {!loading && searching && <p className="admin-empty">Поиск...</p>}
      {!loading && !searching && visible.length === 0 && (
        <p className="admin-empty">{results ? 'Ничего не найдено' : 'Заказов нет'}</p>
      )}

      <div className="admin-orders">
        {visible.map((order) => {
          const address = [order.country, order.city, order.address, order.postal_code, order.pickup_point]
            .filter(Boolean)
            .join(', ')
          // черновика нет — показываем сохранённый трек; так работает и для
          // заказов, пришедших из поиска, а не только из первой загрузки
          const draft = drafts[order.number] ?? order.tracking_number ?? ''
          const unchanged = draft.trim() === (order.tracking_number ?? '')

          return (
            <article className="admin-order" key={order.number}>
              <header className="admin-order__head">
                <div className="admin-order__ids">
                  <Link to={`/order/${order.number}`} target="_blank" rel="noopener" className="admin-order__number">
                    {order.number}
                  </Link>
                  <span className="admin-order__date">{formatDateTime(order.created_at)}</span>
                </div>
                <div className="admin-order__head-right">
                  <Link to={`/admin/orders/${order.number}`} className="btn btn--outline">
                    Редактировать
                  </Link>
                  <span className={`admin-order__status admin-order__status--${order.status}`}>
                    {ORDER_STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>
              </header>

              <div className="admin-order__body">
                <div className="admin-order__col">
                  <span className="admin-order__label">Покупатель</span>
                  {order.full_name && <p className="admin-order__text">{order.full_name}</p>}
                  <p className="admin-order__text">{order.email}</p>
                </div>

                <div className="admin-order__col">
                  <span className="admin-order__label">
                    Доставка — {deliveryLabels(methods)[order.delivery_method] ?? order.delivery_method}
                  </span>
                  <p className="admin-order__text">{address || '—'}</p>
                </div>

                <div className="admin-order__col">
                  <span className="admin-order__label">Состав</span>
                  <ul className="admin-order__items">
                    {order.items.map((it, i) => (
                      <li key={i}>
                        {it.name}
                        {it.size ? `, ${it.size}` : ''} × {it.qty}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="admin-order__col admin-order__col--total">
                  <span className="admin-order__label">Сумма</span>
                  <p className="admin-order__total">{formatPrice(order.total)}</p>
                  <p className="admin-order__text admin-order__text--small">
                    товары {formatPrice(order.items_total)} + доставка {formatPrice(order.delivery_price)}
                  </p>
                </div>
              </div>

              <footer className="admin-order__tracking">
                <label className="admin-order__label" htmlFor={`track-${order.number}`}>
                  Трек-номер
                </label>
                <div className="admin-order__tracking-row">
                  <input
                    id={`track-${order.number}`}
                    className="modal__input"
                    type="text"
                    placeholder="Трек СДЭК / Почты России"
                    value={draft}
                    onChange={(e) => setDrafts({ ...drafts, [order.number]: e.target.value })}
                  />
                  <button
                    className="btn btn--dark"
                    type="button"
                    disabled={unchanged || savingNumber === order.number}
                    onClick={() => saveTracking(order)}
                  >
                    {savingNumber === order.number
                      ? 'Сохранение...'
                      : savedNumber === order.number
                        ? 'Сохранено ✓'
                        : 'Сохранить'}
                  </button>
                  {/* статус подтягивается сам раз в 20 минут, кнопка — чтобы не ждать */}
                  {order.delivery_method === 'cdek' && order.tracking_number && (
                    <button
                      className="btn btn--outline"
                      type="button"
                      disabled={syncingNumber === order.number}
                      onClick={() => syncCdek(order)}
                    >
                      {syncingNumber === order.number ? 'Спрашиваем...' : 'Статус СДЭК'}
                    </button>
                  )}
                </div>
                {order.cdek_status_name && (
                  <p className="admin-order__text admin-order__text--small admin-order__cdek">
                    СДЭК: {order.cdek_status_name}
                    {order.cdek_status_at && ` — ${formatDateTime(order.cdek_status_at)}`}
                  </p>
                )}
              </footer>
            </article>
          )
        })}
      </div>
    </div>
  )
}
