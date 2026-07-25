import '../styles/pages/orders.css'

const STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  cancelled: 'Отменён',
}

const DELIVERY_LABELS = {
  cdek: 'СДЭК',
  post: 'Почта России',
  cis: 'Страны СНГ',
}

export default function OrderView({ order }) {
  return (
    <div className="order-view">
      <div className="order-view__head">
        <span className="order-view__number">Заказ {order.number}</span>
        <span className={`order-view__status order-view__status--${order.status}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <ul className="order-view__items">
        {order.items.map((it, i) => (
          <li className="order-view__item" key={i}>
            <span>
              {it.name}
              {it.size ? `, ${it.size}` : ''} × {it.qty}
            </span>
            <span>{(it.price * it.qty).toLocaleString('ru-RU')}₽</span>
          </li>
        ))}
      </ul>

      <div className="order-view__totals">
        <div>
          <span>Доставка ({DELIVERY_LABELS[order.delivery_method] ?? order.delivery_method})</span>
          <span>{order.delivery_price.toLocaleString('ru-RU')}₽</span>
        </div>
        <div className="order-view__total">
          <span>Итого</span>
          <span>{order.total.toLocaleString('ru-RU')}₽</span>
        </div>
      </div>

      {order.tracking_number && (
        <p className="order-view__tracking">Трек-номер: <strong>{order.tracking_number}</strong></p>
      )}
    </div>
  )
}
