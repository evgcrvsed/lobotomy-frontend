import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { ORDER_STATUS_LABELS, formatDateTime, formatPrice } from '../constants'
import '../styles/pages/orders.css'

export default function OrderView({ order, linkTo, deliveryLabels = {} }) {
  const [paying, setPaying] = useState(false)

  async function pay() {
    setPaying(true)
    try {
      const res = await api.resumePayment(order.number)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось перейти к оплате: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      window.location.href = (await res.json()).payment_url
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="order-view">
      <div className="order-view__head">
        {linkTo ? (
          <Link to={linkTo} target="_blank" rel="noopener" className="order-view__number order-view__number--link">
            Заказ {order.number}
          </Link>
        ) : (
          <span className="order-view__number">Заказ {order.number}</span>
        )}
        <span className={`order-view__status order-view__status--${order.status}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <ul className="order-view__items">
        {order.items.map((it, i) => (
          <li className="order-view__item" key={i}>
            <span>
              {it.name}
              {it.size ? `, ${it.size}` : ''} × {it.qty}
            </span>
            <span>{formatPrice(it.price * it.qty)}</span>
          </li>
        ))}
      </ul>

      <div className="order-view__totals">
        <div>
          <span>Доставка ({deliveryLabels[order.delivery_method] ?? order.delivery_method})</span>
          <span>{formatPrice(order.delivery_price)}</span>
        </div>
        <div className="order-view__total">
          <span>Итого</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </div>

      {order.tracking_number && (
        <p className="order-view__tracking">Трек-номер: <strong>{order.tracking_number}</strong></p>
      )}
      {order.cdek_status_name && (
        <p className="order-view__cdek">
          СДЭК: {order.cdek_status_name}
          {order.cdek_status_at && ` — ${formatDateTime(order.cdek_status_at)}`}
        </p>
      )}

      {order.status === 'pending' && (
        <button className="order-view__pay" type="button" onClick={pay} disabled={paying}>
          {paying ? 'Переходим к оплате...' : 'Оплатить'}
        </button>
      )}
    </div>
  )
}
