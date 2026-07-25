import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import '../styles/pages/order-page.css'

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

export default function OrderPage() {
  const { number } = useParams()
  const [order, setOrder] = useState(null)
  const [productsById, setProductsById] = useState({})
  const [collections, setCollections] = useState([])
  const [state, setState] = useState('loading') // loading | ok | notfound

  useEffect(() => {
    Promise.all([api.getOrder(number), api.getProducts(), api.getCollections()]).then(([ord, prods, cols]) => {
      if (!ord) {
        setState('notfound')
        return
      }
      setOrder(ord)
      setProductsById(Object.fromEntries(prods.map((p) => [p.id, p])))
      setCollections(cols)
      setState('ok')
    })
  }, [number])

  if (state === 'loading') return <p className="order-page__status">Загрузка...</p>
  if (state === 'notfound') return <p className="order-page__status">Заказ не найден</p>

  function itemHref(item) {
    const product = productsById[item.product_id]
    const colSlug = collections.find((c) => c.id === product?.collection_id)?.slug
    return product?.slug && colSlug ? `/${colSlug}/${product.slug}` : null
  }

  function itemImage(item) {
    const product = productsById[item.product_id]
    const img = product?.images.find((i) => i.role === 'main') ?? product?.images?.[0]
    return img ? imageUrl(img.filename) : null
  }

  const address = [order.country, order.city, order.address, order.postal_code, order.pickup_point]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="order-page">
      <div className="order-page__head">
        <div>
          <span className="order-page__label">Заказ</span>
          <h1 className="order-page__number">{order.number}</h1>
        </div>
        <span className={`order-page__status-badge order-view__status--${order.status}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </div>

      <p className="order-page__tracking">
        {order.tracking_number ? (
          <>Трек-номер: <strong>{order.tracking_number}</strong></>
        ) : (
          <span className="order-page__tracking--empty">Ещё не отправлено..</span>
        )}
      </p>

      <div className="order-cards">
        {order.items.map((item, i) => {
          const href = itemHref(item)
          const img = itemImage(item)
          const media = (
            <div className="order-card__media">
              {img ? <img src={img} alt={item.name} /> : <div className="order-card__ph" />}
            </div>
          )
          return (
            <div className="order-card" key={i}>
              {href ? (
                <Link to={href} className="order-card__link">
                  {media}
                </Link>
              ) : (
                media
              )}
              <div className="order-card__info">
                <span className="order-card__name">{item.name}</span>
                {item.size && <span className="order-card__size">Размер: {item.size}</span>}
                <span className="order-card__qty">
                  {item.qty} шт × {item.price.toLocaleString('ru-RU')}₽
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="order-page__details">
        <div className="order-page__block">
          <h2 className="order-page__block-title">Доставка</h2>
          <p className="order-page__text">{DELIVERY_LABELS[order.delivery_method] ?? order.delivery_method}</p>
          {address && <p className="order-page__text">{address}</p>}
          {order.full_name && <p className="order-page__text">{order.full_name}</p>}
          <p className="order-page__text">{order.email}</p>
        </div>

        <div className="order-page__block order-page__block--totals">
          <div className="order-page__total-row">
            <span>Товары</span>
            <span>{order.items_total.toLocaleString('ru-RU')}₽</span>
          </div>
          <div className="order-page__total-row">
            <span>Доставка</span>
            <span>{order.delivery_price.toLocaleString('ru-RU')}₽</span>
          </div>
          <div className="order-page__total-row order-page__total-row--final">
            <span>Итого</span>
            <span>{order.total.toLocaleString('ru-RU')}₽</span>
          </div>
        </div>
      </div>

      <Link to="/" className="order-page__back">
        ← В каталог
      </Link>
    </div>
  )
}
