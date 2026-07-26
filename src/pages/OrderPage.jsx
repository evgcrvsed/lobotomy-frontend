import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import '../styles/pages/checkout.css'
import '../styles/pages/order-page.css'

const DELIVERY_OPTIONS = [
  { id: 'cdek', label: 'СДЭК', price: 450 },
  { id: 'post', label: 'Почта России', price: 350 },
  { id: 'cis', label: 'Страны СНГ', price: 750 },
]

const DELIVERY_TEXTS = {
  cdek: { index: 'Индекс СДЭК', point: 'Адрес пункта СДЭК' },
  post: { index: 'Индекс Почты России', point: 'Адрес отделения Почты России' },
  cis: { index: 'Индекс', point: 'Адрес' },
}

const STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  cancelled: 'Отменён',
}

function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
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

  const texts = DELIVERY_TEXTS[order.delivery_method] ?? DELIVERY_TEXTS.cis
  const fields = [
    { label: 'ФИО', value: order.full_name },
    { label: 'Почта', value: order.email },
    { label: 'Страна', value: order.country },
    { label: 'Город', value: order.city },
    { label: texts.index, value: order.postal_code },
    { label: texts.point, value: order.pickup_point },
  ]

  function productHref(item) {
    const product = productsById[item.product_id]
    const colSlug = collections.find((c) => c.id === product?.collection_id)?.slug
    return product?.slug && colSlug ? `/${colSlug}/${product.slug}` : '#'
  }

  function itemImage(item) {
    const product = productsById[item.product_id]
    const img = product?.images.find((i) => i.role === 'main') ?? product?.images?.[0]
    return img ? imageUrl(img.filename) : null
  }

  function hoverImage(item) {
    const img = productsById[item.product_id]?.images.find((i) => i.role === 'hover')
    return img ? imageUrl(img.filename) : null
  }

  const itemsCount = order.items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <div className="checkout">
      <nav className="checkout__breadcrumbs">
        <Link to="/">Главная</Link>/Заказ {order.number}
        <span className={`order-page__status-badge order-page__status-badge--${order.status}`}>
          {STATUS_LABELS[order.status] ?? order.status}
        </span>
      </nav>

      <div className="checkout__grid">
        <section className="checkout__form">
          <h1 className="checkout__title">Личная информация</h1>

          {fields.map((f, i) => (
            <div className="checkout__field" key={i}>
              <span className="checkout__label">{f.label}</span>
              <input className="checkout__input" value={f.value || '—'} readOnly />
            </div>
          ))}

          <div className="checkout__field">
            <span className="checkout__label">Способ доставки</span>
            <div className="delivery-options">
              {DELIVERY_OPTIONS.map((opt) => (
                <label className="delivery-option" key={opt.id}>
                  <input
                    type="radio"
                    className="delivery-option__input"
                    checked={order.delivery_method === opt.id}
                    disabled
                    readOnly
                  />
                  <span className="delivery-option__box" />
                  {opt.label} {opt.price}р
                </label>
              ))}
            </div>
          </div>
        </section>

        <aside className="checkout__summary">
          <div className="checkout__items">
            {order.items.map((item, i) => (
              <div className="checkout-item" key={i}>
                <Link to={productHref(item)} className="checkout-item__img">
                  {itemImage(item) && <img src={itemImage(item)} alt={item.name} />}
                  {hoverImage(item) && (
                    <img src={hoverImage(item)} alt="" aria-hidden="true" className="checkout-item__img-hover" />
                  )}
                  <span className="checkout-item__qty">{item.qty}</span>
                </Link>
                <div className="checkout-item__info">
                  <span className="checkout-item__name">{item.name}</span>
                  {item.size && <span className="checkout-item__size">{item.size}</span>}
                </div>
                <div className="checkout-item__right">
                  <span className="checkout-item__price">
                    {(item.price * item.qty).toLocaleString('ru-RU')}Р
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout__totals">
            <div className="checkout__total-row">
              <span>
                Итог: {itemsCount} {plural(itemsCount, 'изделие', 'изделия', 'изделий')}
              </span>
              <span>{order.items_total.toLocaleString('ru-RU')}₽</span>
            </div>
            <div className="checkout__total-row">
              <span>Доставка:</span>
              <span>{order.delivery_price.toLocaleString('ru-RU')}₽</span>
            </div>
            <div className="checkout__total-row checkout__total-row--final">
              <span>Итог:</span>
              <span>{order.total.toLocaleString('ru-RU')}₽</span>
            </div>
          </div>

          <div className="order-tracking">
            <span className="order-tracking__label">Трек-номер</span>
            <span className={`order-tracking__value${order.tracking_number ? '' : ' order-tracking__value--empty'}`}>
              {order.tracking_number || 'Ещё не отправлено..'}
            </span>
          </div>
        </aside>
      </div>
    </div>
  )
}
