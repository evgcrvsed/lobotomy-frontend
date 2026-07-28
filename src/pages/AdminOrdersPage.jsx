import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { DELIVERY_LABELS, ORDER_STATUS_LABELS, formatPrice } from '../constants'
import '../styles/pages/admin.css'
import '../styles/pages/admin-orders.css'

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'paid', label: 'Оплаченные' },
  { id: 'shipped', label: 'Отправленные' },
  { id: 'pending', label: 'Ожидают оплаты' },
  { id: 'cancelled', label: 'Отменённые' },
]

function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [drafts, setDrafts] = useState({}) // номер заказа -> введённый трек
  const [savingNumber, setSavingNumber] = useState(null)
  const [savedNumber, setSavedNumber] = useState(null)

  useEffect(() => {
    api.getAllOrders().then((list) => {
      setOrders(list)
      setDrafts(Object.fromEntries(list.map((o) => [o.number, o.tracking_number ?? ''])))
      setLoading(false)
    })
  }, [])

  async function saveTracking(order) {
    const value = (drafts[order.number] ?? '').trim()
    setSavingNumber(order.number)
    try {
      const res = await api.setOrderTracking(order.number, value)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось сохранить: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      const updated = await res.json()
      setOrders((list) => list.map((o) => (o.number === updated.number ? updated : o)))
      setSavedNumber(order.number)
      setTimeout(() => setSavedNumber(null), 1800)
    } finally {
      setSavingNumber(null)
    }
  }

  const visible = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="admin-page">
      <div className="admin-page__top">
        <h1 className="admin-page__title">Заказы</h1>
        <Link to="/admin" className="btn btn--outline">
          К каталогу
        </Link>
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

      {loading && <p className="admin-empty">Загрузка...</p>}
      {!loading && visible.length === 0 && <p className="admin-empty">Заказов нет</p>}

      <div className="admin-orders">
        {visible.map((order) => {
          const address = [order.country, order.city, order.address, order.postal_code, order.pickup_point]
            .filter(Boolean)
            .join(', ')
          const draft = drafts[order.number] ?? ''
          const unchanged = draft.trim() === (order.tracking_number ?? '')

          return (
            <article className="admin-order" key={order.number}>
              <header className="admin-order__head">
                <div className="admin-order__ids">
                  <Link to={`/order/${order.number}`} target="_blank" rel="noopener" className="admin-order__number">
                    {order.number}
                  </Link>
                  <span className="admin-order__date">{formatDate(order.created_at)}</span>
                </div>
                <span className={`admin-order__status admin-order__status--${order.status}`}>
                  {ORDER_STATUS_LABELS[order.status] ?? order.status}
                </span>
              </header>

              <div className="admin-order__body">
                <div className="admin-order__col">
                  <span className="admin-order__label">Покупатель</span>
                  {order.full_name && <p className="admin-order__text">{order.full_name}</p>}
                  <p className="admin-order__text">{order.email}</p>
                </div>

                <div className="admin-order__col">
                  <span className="admin-order__label">
                    Доставка — {DELIVERY_LABELS[order.delivery_method] ?? order.delivery_method}
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
                </div>
              </footer>
            </article>
          )
        })}
      </div>
    </div>
  )
}
