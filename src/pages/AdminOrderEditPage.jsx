import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import { ORDER_STATUS_LABELS, deliveryTexts, formatPrice, plural } from '../constants'
import '../styles/pages/checkout.css'
import '../styles/pages/order-page.css'
import '../styles/pages/admin-orders.css'

export default function AdminOrderEditPage() {
  const { number } = useParams()
  const [order, setOrder] = useState(null)
  const [productsById, setProductsById] = useState({})
  const [methods, setMethods] = useState([])
  const [state, setState] = useState('loading') // loading | ok | notfound
  const [form, setForm] = useState(null)
  const [sizes, setSizes] = useState({}) // id позиции -> размер
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    Promise.all([api.getOrder(number), api.getProducts(), api.getDeliveryMethods()]).then(
      ([ord, prods, dm]) => {
        if (!ord) {
          setState('notfound')
          return
        }
        setOrder(ord)
        setProductsById(Object.fromEntries(prods.map((p) => [p.id, p])))
        setMethods(dm)
        setForm({
          email: ord.email ?? '',
          full_name: ord.full_name ?? '',
          phone: ord.phone ?? '',
          delivery_method: ord.delivery_method,
          country: ord.country ?? '',
          city: ord.city ?? '',
          address: ord.address ?? '',
          postal_code: ord.postal_code ?? '',
          pickup_point: ord.pickup_point ?? '',
        })
        setSizes(Object.fromEntries(ord.items.map((i) => [i.id, i.size ?? ''])))
        setState('ok')
      }
    )
  }, [number])

  if (state === 'loading') return <p className="order-page__status">Загрузка...</p>
  if (state === 'notfound') return <p className="order-page__status">Заказ не найден</p>

  const texts = deliveryTexts(methods, form.delivery_method)
  const fields = [
    { key: 'full_name', label: 'ФИО', placeholder: 'Иванов Иван Иванович' },
    { key: 'email', label: 'Почта', placeholder: 'mail@example.com', type: 'email' },
    { key: 'phone', label: 'Телефон', placeholder: '+7 900 000-00-00' },
    { key: 'country', label: 'Страна', placeholder: 'Россия' },
    { key: 'city', label: 'Город', placeholder: 'Москва' },
    { key: 'postal_code', label: texts.index, placeholder: '101000' },
    { key: 'pickup_point', label: texts.point, placeholder: 'ул. Кутузова, 27' },
  ]

  function itemImage(item) {
    const product = productsById[item.product_id]
    const img = product?.images.find((i) => i.role === 'main') ?? product?.images?.[0]
    return img ? imageUrl(img.filename) : null
  }

  function productSizes(item) {
    return productsById[item.product_id]?.sizes ?? []
  }

  async function save() {
    setSaving(true)
    try {
      const payload = {
        ...Object.fromEntries(
          Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() || null : v])
        ),
        email: form.email.trim(),
        delivery_method: form.delivery_method,
        items: order.items.map((i) => ({ id: i.id, size: sizes[i.id]?.trim() || null })),
      }
      const res = await api.adminUpdateOrder(number, payload)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось сохранить: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      const updated = await res.json()
      setOrder(updated)
      setSizes(Object.fromEntries(updated.items.map((i) => [i.id, i.size ?? ''])))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  const itemsCount = order.items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <div className="checkout">
      <nav className="checkout__breadcrumbs">
        <Link to="/admin/orders">Заказы</Link>/{order.number}
        <span className={`order-page__status-badge order-page__status-badge--${order.status}`}>
          {ORDER_STATUS_LABELS[order.status] ?? order.status}
        </span>
      </nav>

      <div className="checkout__grid">
        <section className="checkout__form">
          <h1 className="checkout__title">Данные покупателя</h1>

          {fields.map(({ key, label, placeholder, type }) => (
            <div className="checkout__field" key={key}>
              <label className="checkout__label" htmlFor={`ed-${key}`}>
                {label}
              </label>
              <input
                className="checkout__input"
                id={`ed-${key}`}
                type={type ?? 'text'}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}

          <div className="checkout__field">
            <span className="checkout__label">Способ доставки</span>
            <div className="delivery-options">
              {methods.map((opt) => (
                <label className="delivery-option" key={opt.code}>
                  <input
                    type="radio"
                    name="delivery"
                    className="delivery-option__input"
                    checked={form.delivery_method === opt.code}
                    onChange={() => setForm({ ...form, delivery_method: opt.code })}
                  />
                  <span className="delivery-option__box" />
                  {opt.label} {formatPrice(opt.price)}
                </label>
              ))}
            </div>
            <p className="admin-order__hint">
              Стоимость доставки в заказе остаётся прежней — {formatPrice(order.delivery_price)} (уже оплачена).
            </p>
          </div>
        </section>

        <aside className="checkout__summary">
          <div className="checkout__items">
            {order.items.map((item) => (
              <div className="checkout-item" key={item.id}>
                <div className="checkout-item__img">
                  {itemImage(item) && <img src={itemImage(item)} alt={item.name} />}
                  <span className="checkout-item__qty">{item.qty}</span>
                </div>
                <div className="checkout-item__info">
                  <span className="checkout-item__name">{item.name}</span>
                  <div className="checkout-item__controls">
                    {productSizes(item).length > 0 ? (
                      <select
                        className="checkout-item__select"
                        aria-label="Размер"
                        value={sizes[item.id] ?? ''}
                        onChange={(e) => setSizes({ ...sizes, [item.id]: e.target.value })}
                      >
                        <option value="">без размера</option>
                        {productSizes(item).map((s) => (
                          <option key={s.id} value={s.label}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="checkout-item__select"
                        aria-label="Размер"
                        value={sizes[item.id] ?? ''}
                        placeholder="размер"
                        onChange={(e) => setSizes({ ...sizes, [item.id]: e.target.value })}
                      />
                    )}
                  </div>
                </div>
                <div className="checkout-item__right">
                  <span className="checkout-item__price">{formatPrice(item.price * item.qty)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="checkout__totals">
            <div className="checkout__total-row">
              <span>
                Итог: {itemsCount} {plural(itemsCount, 'изделие', 'изделия', 'изделий')}
              </span>
              <span>{formatPrice(order.items_total)}</span>
            </div>
            <div className="checkout__total-row">
              <span>Доставка:</span>
              <span>{formatPrice(order.delivery_price)}</span>
            </div>
            <div className="checkout__total-row checkout__total-row--final">
              <span>Итог:</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          <button className="checkout__pay" type="button" onClick={save} disabled={saving}>
            {saving ? 'Сохранение...' : saved ? 'Сохранено ✓' : 'Сохранить изменения'}
          </button>

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
