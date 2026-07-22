import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import { getToken } from '../auth'
import { changeCartSize, getCart, removeFromCart, setCartQty } from '../cart'
import '../styles/pages/checkout.css'

const DELIVERY_OPTIONS = [
  { id: 'cdek', label: 'СДЭК', price: 450 },
  { id: 'post', label: 'Почта России', price: 350 },
  { id: 'cis', label: 'Страны СНГ', price: 750 },
]

// Подписи двух последних полей меняются вместе со способом доставки
const DELIVERY_TEXTS = {
  cdek: { index: 'Индекс СДЭК', point: 'Адрес пункта СДЭК' },
  post: { index: 'Индекс Почты России', point: 'Адрес отделения Почты России' },
  cis: { index: 'Индекс', point: 'Адрес' },
}

function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export default function CheckoutPage() {
  const [items, setItems] = useState(() => getCart())
  const [productsById, setProductsById] = useState({})
  const [collections, setCollections] = useState([])
  const [delivery, setDelivery] = useState('cdek')
  const [chartSrc, setChartSrc] = useState(null)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    country: '',
    city: '',
    postal: '',
    pickupPoint: '',
  })

  const formFields = [
    { key: 'fullName', label: 'ФИО', placeholder: 'Иванов Иван Иванович', type: 'text' },
    { key: 'email', label: 'Почта', placeholder: 'lobotomymerchstore@gmail.com', type: 'email' },
    { key: 'country', label: 'Страна', placeholder: 'Россия', type: 'text' },
    { key: 'city', label: 'Город', placeholder: 'Москва', type: 'text' },
    { key: 'postal', label: DELIVERY_TEXTS[delivery].index, placeholder: '101000', type: 'text' },
    { key: 'pickupPoint', label: DELIVERY_TEXTS[delivery].point, placeholder: 'ул. Кутузова, 27', type: 'text' },
  ]

  // корзина может измениться (кнопка «убрать») — держим список свежим
  useEffect(() => {
    const sync = () => setItems(getCart())
    window.addEventListener('cart-changed', sync)
    return () => window.removeEventListener('cart-changed', sync)
  }, [])

  useEffect(() => {
    Promise.all([api.getProducts(), api.getCollections()]).then(([list, cols]) => {
      setProductsById(Object.fromEntries(list.map((p) => [p.id, p])))
      setCollections(cols)
    })
    // если авторизован — подставляем данные из профиля
    if (getToken()) {
      api.getMe().then((me) => {
        if (!me) return
        setForm((f) => ({
          ...f,
          email: me.email ?? '',
          city: me.city ?? '',
          fullName: me.full_name ?? '',
          postal: me.postal_code ?? '',
        }))
      })
    }
  }, [])

  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const itemsCount = items.reduce((sum, i) => sum + i.qty, 0)
  const deliveryPrice = DELIVERY_OPTIONS.find((d) => d.id === delivery)?.price ?? 0

  function productHref(item) {
    const product = productsById[item.productId]
    const colSlug = collections.find((c) => c.id === product?.collection_id)?.slug
    return colSlug && item.slug ? `/${colSlug}/${item.slug}` : '#'
  }

  function hoverImage(item) {
    const img = productsById[item.productId]?.images.find((i) => i.role === 'hover')
    return img ? imageUrl(img.filename) : null
  }

  function sizeChart(item) {
    const img = productsById[item.productId]?.images.find((i) => i.role === 'sizechart')
    return img ? imageUrl(img.filename) : null
  }

  return (
    <div className="checkout">
      <nav className="checkout__breadcrumbs">
        <Link to="/">Главная</Link>/Оформление заказа
      </nav>

      {items.length === 0 ? (
        <div className="checkout__empty">
          <p>Корзина пуста</p>
          <Link to="/" className="btn btn--dark">
            Каталог
          </Link>
        </div>
      ) : (
        <div className="checkout__grid">
          <section className="checkout__form">
            <h1 className="checkout__title">Личная информация</h1>

            {formFields.map(({ key, label, placeholder, type }) => (
              <div className="checkout__field" key={key}>
                <label className="checkout__label" htmlFor={`co-${key}`}>
                  {label}
                </label>
                <input
                  className="checkout__input"
                  id={`co-${key}`}
                  type={type}
                  placeholder={placeholder}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}

            <div className="checkout__field">
              <span className="checkout__label">Способ доставки</span>
              <div className="delivery-options">
                {DELIVERY_OPTIONS.map((opt) => (
                  <label className="delivery-option" key={opt.id}>
                    <input
                      type="radio"
                      name="delivery"
                      className="delivery-option__input"
                      checked={delivery === opt.id}
                      onChange={() => setDelivery(opt.id)}
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
              {items.map((item) => (
                <div className="checkout-item" key={`${item.productId}-${item.size}`}>
                  <Link to={productHref(item)} className="checkout-item__img">
                    {item.image && <img src={imageUrl(item.image)} alt={item.name} />}
                    {hoverImage(item) && (
                      <img src={hoverImage(item)} alt="" aria-hidden="true" className="checkout-item__img-hover" />
                    )}
                    <span className="checkout-item__qty">{item.qty}</span>
                  </Link>
                  <div className="checkout-item__info">
                    <span className="checkout-item__name">{item.name}</span>
                    <div className="checkout-item__controls">
                      <div className="checkout-item__row">
                        {(productsById[item.productId]?.sizes?.length ?? 0) > 0 ? (
                          <select
                            className="checkout-item__select"
                            value={item.size ?? ''}
                            aria-label="Размер"
                            onChange={(e) => changeCartSize(item.productId, item.size, e.target.value)}
                          >
                            {productsById[item.productId].sizes.map((s) => (
                              <option key={s.id} value={s.label}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          item.size && <span className="checkout-item__size">{item.size}</span>
                        )}
                        {sizeChart(item) && (
                          <button
                            type="button"
                            className="checkout-item__chart"
                            aria-label="Показать размерную сетку"
                            title="Размерная сетка"
                            onClick={() => setChartSrc(sizeChart(item))}
                          >
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path
                                d="M5 2L2 4L3.5 6.5L5 5.5V13H13V5.5L14.5 6.5L16 4L13 2H10.5C10.5 2.8 9.8 3.5 9 3.5C8.2 3.5 7.5 2.8 7.5 2H5Z"
                                stroke="#111111"
                                strokeWidth="1.3"
                                strokeLinejoin="round"
                              />
                              <path d="M16.5 9V15M16.5 9L15.3 10.2M16.5 9L17.7 10.2M16.5 15L15.3 13.8M16.5 15L17.7 13.8" stroke="#111111" strokeWidth="1.1" strokeLinecap="round" />
                            </svg>
                          </button>
                        )}
                      </div>
                      <div className="checkout-item__stepper">
                        <button
                          type="button"
                          aria-label="Меньше"
                          onClick={() => setCartQty(item.productId, item.size, item.qty - 1)}
                        >
                          −
                        </button>
                        <span>{item.qty}</span>
                        <button
                          type="button"
                          aria-label="Больше"
                          onClick={() => setCartQty(item.productId, item.size, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="checkout-item__right">
                    <span className="checkout-item__price">
                      {(item.price * item.qty).toLocaleString('ru-RU')}Р
                    </span>
                    <button
                      type="button"
                      className="checkout-item__remove"
                      onClick={() => removeFromCart(item.productId, item.size)}
                    >
                      убрать
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="checkout__totals">
              <div className="checkout__total-row">
                <span>
                  Итог: {itemsCount} {plural(itemsCount, 'изделие', 'изделия', 'изделий')}
                </span>
                <span>{itemsTotal.toLocaleString('ru-RU')}Р</span>
              </div>
              <div className="checkout__total-row">
                <span>Доставка:</span>
                <span>{deliveryPrice.toLocaleString('ru-RU')}Р</span>
              </div>
              <div className="checkout__total-row checkout__total-row--final">
                <span>Итог:</span>
                <span>{(itemsTotal + deliveryPrice).toLocaleString('ru-RU')}Р</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Полноэкранный просмотр размерной сетки */}
      {chartSrc && (
        <div className="sizechart-overlay" onClick={() => setChartSrc(null)}>
          <img src={chartSrc} alt="Размерная сетка" />
          <button type="button" className="sizechart-overlay__close" aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
