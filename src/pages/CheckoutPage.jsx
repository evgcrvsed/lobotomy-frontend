import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import { errorTextFrom } from '../api/errors'
import { getToken } from '../auth'
import { MAX_QTY, changeCartSize, getCart, removeFromCart, setCartQty } from '../cart'
import { deliveryTexts, formatPrice, plural } from '../constants'
import { rememberGuestOrder } from '../guestOrders'
import '../styles/components/image-viewer.css'
import '../styles/pages/checkout.css'

export default function CheckoutPage() {
  const [items, setItems] = useState(() => getCart())
  const [productsById, setProductsById] = useState({})
  const [collections, setCollections] = useState([])
  const [delivery, setDelivery] = useState('')
  const [deliveryMethods, setDeliveryMethods] = useState([])
  // Справочники приезжают с сервера, и до их появления заказ отправлять нельзя:
  // delivery пуст, а бэкенд такой заказ отвергает валидацией. Пустой список
  // способов доставки — это не «состояние», а три разных случая, поэтому нужен
  // отдельный статус: loading | ready | failed
  const [refsStatus, setRefsStatus] = useState('loading')
  const [chartSrc, setChartSrc] = useState(null)
  const [paying, setPaying] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    city: '',
    postal: '',
    pickupPoint: '',
  })

  const texts = deliveryTexts(deliveryMethods, delivery)
  const formFields = [
    { key: 'fullName', label: 'ФИО', placeholder: 'Иванов Иван Иванович', type: 'text' },
    { key: 'email', label: 'Почта', placeholder: 'hieronymus@example.com', type: 'email', locked: authorized },
    { key: 'phone', label: 'Телефон', placeholder: '+7 900 000-00-00', type: 'tel' },
    { key: 'country', label: 'Страна', placeholder: 'Россия', type: 'text' },
    { key: 'city', label: 'Город', placeholder: 'Москва', type: 'text' },
    { key: 'postal', label: texts.index, placeholder: '101000', type: 'text' },
    { key: 'pickupPoint', label: texts.point, placeholder: 'ул. Кутузова, 27', type: 'text' },
  ]

  useEffect(() => {
    const sync = () => setItems(getCart())
    window.addEventListener('cart-changed', sync)
    return () => window.removeEventListener('cart-changed', sync)
  }, [])

  useEffect(() => {
    Promise.all([api.getProducts(), api.getCollections(), api.getDeliveryMethods()])
      .then(([list, cols, methods]) => {
        setProductsById(Object.fromEntries(list.map((p) => [p.id, p])))
        setCollections(cols)
        setDeliveryMethods(methods)
        setDelivery((cur) => cur || methods[0]?.code || '')
        // Пустой список означает сбой запроса, а не «доставки нет»: набор способов
        // заводится при старте бэкенда (_seed_delivery_methods) и пустым не бывает.
        // Клиент при не-ok молча отдаёт [], поэтому отличить можно только так.
        setRefsStatus(methods.length ? 'ready' : 'failed')
      })
      // сеть отвалилась совсем — тогда .then не выполнится вовсе и страница
      // осталась бы навсегда в состоянии «загружаем»
      .catch(() => setRefsStatus('failed'))
    if (getToken()) {
      api.getMe().then((me) => {
        if (!me) return
        setAuthorized(true)
        setForm((f) => ({
          ...f,
          email: me.email ?? '',
          fullName: me.full_name ?? '',
          phone: me.phone ?? '',
          country: me.country ?? '',
          city: me.city ?? '',
          postal: me.postal_code ?? '',
          pickupPoint: me.pickup_point ?? '',
        }))
      })
    }
  }, [])

  useEffect(() => {
    if (delivery === 'cdek') {
      setForm(f => ({ ...f, postal: '' }))
    }
  }, [delivery])

  const itemsTotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const itemsCount = items.reduce((sum, i) => sum + i.qty, 0)
  const deliveryPrice = deliveryMethods.find((d) => d.code === delivery)?.price ?? 0

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

  /** Проверка формы перед оплатой. Возвращает список замечаний. */
  function validate() {
    const problems = []
    const value = (key) => form[key].trim()

    // ФИО: ждём фамилию, имя и отчество — то есть минимум два пробела
    const fullName = value('fullName')
    if (!fullName) problems.push('ФИО')
    else if ((fullName.match(/\S+/g) ?? []).length < 3) {
      problems.push('ФИО — полностью: фамилия, имя и отчество')
    }

    const email = value('email')
    if (!email) problems.push('Почта')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) problems.push('Почта — проверьте адрес')

    if (!value('phone')) problems.push('Телефон')
    if (!value('country')) problems.push('Страна')
    if (!value('city')) problems.push('Город')

    // для СДЭК индекс не нужен — там доставка до пункта выдачи
    if (delivery !== 'cdek' && !value('postal')) problems.push(texts.index)

    if (!value('pickupPoint')) problems.push(texts.point)

    // Способ доставки человек не вводит руками, он приезжает справочником с сервера —
    // и раньше в проверке его не было вовсе. На медленной сети форму успевали
    // отправить до загрузки справочника, и заказ падал на валидации бэкенда
    if (!delivery) problems.push('Способ доставки')

    return problems
  }

  /** Подпись кнопки оплаты: она же объясняет, почему кнопка недоступна. */
  function payLabel() {
    if (paying) return 'Переходим к оплате...'
    if (refsStatus === 'loading') return 'Загружаем...'
    if (refsStatus === 'failed') return 'Данные не загрузились'
    return `Оплатить ${formatPrice(itemsTotal + deliveryPrice)}`
  }

  async function pay() {
    if (refsStatus !== 'ready') {
      alert(
        refsStatus === 'loading'
          ? 'Ещё загружаем способы доставки — секунду.'
          : 'Не удалось загрузить способы доставки. Обновите страницу и попробуйте снова.'
      )
      return
    }

    const problems = validate()
    if (problems.length) {
      alert('Проверьте, пожалуйста:\n\n• ' + problems.join('\n• '))
      return
    }
    setPaying(true)
    try {
      const payload = {
        email: form.email.trim(),
        full_name: form.fullName.trim() || null,
        phone: form.phone.trim() || null,
        delivery_method: delivery,
        country: form.country.trim() || null,
        city: form.city.trim() || null,
        postal_code: form.postal.trim() || null,
        pickup_point: form.pickupPoint.trim() || null,
        items: items.map((i) => ({ product_id: i.productId, size: i.size, qty: i.qty })),
      }
      const res = await api.createOrder(payload)
      if (!res.ok) {
        alert('Не удалось оформить заказ: ' + (await errorTextFrom(res)))
        return
      }
      const { number, payment_url } = await res.json()
      // запоминаем до перехода на оплату: если гость не вернётся с чека,
      // номер всё равно останется у него на устройстве
      if (!authorized) rememberGuestOrder(number)
      window.location.href = payment_url // уходим на страницу оплаты Т-Банка
    } catch {
      // запрос не дошёл вовсе: без этого fetch падал молча и человек
      // видел только, как кнопка перестала нажиматься
      alert('Не удалось связаться с сервером. Проверьте соединение и попробуйте ещё раз.')
    } finally {
      setPaying(false)
    }
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

            {formFields.map(({ key, label, placeholder, type, locked }) => (
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
                  disabled={key === 'postal' && delivery === 'cdek'}
                  readOnly={locked}
                  title={locked ? 'Почта подтверждена при входе и не меняется' : undefined}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}

            <div className="checkout__field">
              <span className="checkout__label">Способ доставки</span>
              <div className="delivery-options">
                {refsStatus === 'loading' && (
                  <span className="delivery-options__note">Загружаем способы доставки…</span>
                )}
                {refsStatus === 'failed' && (
                  <span className="delivery-options__note delivery-options__note--error">
                    Не удалось загрузить способы доставки. Обновите страницу.
                  </span>
                )}
                {deliveryMethods.map((opt) => (
                  <label className="delivery-option" key={opt.code}>
                    <input
                      type="radio"
                      name="delivery"
                      className="delivery-option__input"
                      checked={delivery === opt.code}
                      onChange={() => setDelivery(opt.code)}
                    />
                    <span className="delivery-option__box" />
                    {opt.label} {formatPrice(opt.price)}
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
                          disabled={item.qty >= MAX_QTY}
                          title={item.qty >= MAX_QTY ? `Не больше ${MAX_QTY} шт. одной позиции` : undefined}
                          onClick={() => setCartQty(item.productId, item.size, item.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="checkout-item__right">
                    <span className="checkout-item__price">
                      {formatPrice(item.price * item.qty)}
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
                <span>{formatPrice(itemsTotal)}</span>
              </div>
              <div className="checkout__total-row">
                <span>Доставка:</span>
                <span>{formatPrice(deliveryPrice)}</span>
              </div>
              <div className="checkout__total-row checkout__total-row--final">
                <span>Итог:</span>
                <span>{formatPrice(itemsTotal + deliveryPrice)}</span>
              </div>
            </div>

            <button
              className="checkout__pay"
              type="button"
              onClick={pay}
              disabled={paying || refsStatus !== 'ready'}
            >
              {payLabel()}
            </button>
          </aside>
        </div>
      )}

      {/* Полноэкранный просмотр размерной сетки */}
      {chartSrc && (
        <div className="image-viewer" onClick={() => setChartSrc(null)}>
          <img src={chartSrc} alt="Размерная сетка" />
          <button type="button" className="image-viewer__close" aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
