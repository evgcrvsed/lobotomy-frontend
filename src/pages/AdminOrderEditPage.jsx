import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import { ORDER_STATUS_LABELS, deliveryTexts, formatDateTime, formatPrice, plural } from '../constants'
import '../styles/pages/admin.css'
import '../styles/pages/checkout.css'
import '../styles/pages/order-page.css'
import '../styles/pages/admin-orders.css'

export default function AdminOrderEditPage() {
  const { number } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [products, setProducts] = useState([])
  const [productsById, setProductsById] = useState({})
  const [methods, setMethods] = useState([])
  const [state, setState] = useState('loading') // loading | ok | notfound
  const [form, setForm] = useState(null)
  const [sizes, setSizes] = useState({}) // id позиции -> размер
  const [newItems, setNewItems] = useState([]) // дозаказ: позиции, которых ещё нет в заказе
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  // журнал оплаты: undefined — ещё грузим, null — запрос не прошёл, объект — данные
  const [payments, setPayments] = useState(undefined)

  useEffect(() => {
    api.getOrderPayments(number).then(setPayments)
  }, [number])

  useEffect(() => {
    Promise.all([api.getOrder(number), api.getProducts(), api.getDeliveryMethods()]).then(
      ([{ order: ord }, prods, dm]) => {
        if (!ord) {
          setState('notfound')
          return
        }
        setOrder(ord)
        setProducts(prods)
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

  // ---- дозаказ ----
  function addRow() {
    const product = products[0]
    if (!product) return
    setNewItems([
      ...newItems,
      { key: Date.now() + Math.random(), product_id: product.id, size: '', qty: 1, price: String(product.price) },
    ])
  }

  function patchRow(key, patch) {
    setNewItems(newItems.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  }

  function pickProduct(key, productId) {
    const product = productsById[productId]
    // товар сменился — размер от прежнего больше не подходит, цену берём новую
    patchRow(key, { product_id: productId, size: '', price: String(product?.price ?? 0) })
  }

  function rowSum(row) {
    return (Number(row.price) || 0) * (Number(row.qty) || 0)
  }

  const addedTotal = newItems.reduce((sum, r) => sum + rowSum(r), 0)

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
        new_items: newItems.map((r) => ({
          product_id: r.product_id,
          size: r.size.trim() || null,
          qty: Math.max(1, Number(r.qty) || 1),
          price: Math.max(0, Number(r.price) || 0),
        })),
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
      setNewItems([]) // дозаказ уехал в заказ — черновик больше не нужен
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }

  async function markPaidManually() {
    const note = prompt(
      'Чем подтверждается оплата? Например: перевод на карту 07.08. Можно оставить пустым.',
      ''
    )
    if (note === null) return // передумали

    setMarkingPaid(true)
    try {
      const res = await api.markOrderPaid(order.number, note.trim() || null)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось отметить: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      setOrder(await res.json())
      setPayments(await api.getOrderPayments(number)) // в журнале появилась запись
    } finally {
      setMarkingPaid(false)
    }
  }

  async function removeOrder() {
    // об оплаченном заказе предупреждаем отдельно: вместе с ним уходит журнал,
    // и подтвердить платёж, если покупатель придёт с претензией, будет нечем
    const paidWarning = ['paid', 'shipped', 'ready', 'delivered'].includes(order.status)
      ? '\n\nЗаказ оплачен: журнал оплаты удалится вместе с ним, подтвердить платёж будет нечем.'
      : ''
    if (!confirm(`Удалить заказ ${order.number} без возможности восстановить?${paidWarning}`)) return

    setDeleting(true)
    try {
      const res = await api.deleteOrder(order.number)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось удалить: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      navigate('/admin/orders')
    } finally {
      setDeleting(false)
    }
  }

  // в итогах сразу показываем, каким заказ станет после сохранения дозаказа
  const itemsCount =
    order.items.reduce((sum, i) => sum + i.qty, 0) +
    newItems.reduce((sum, r) => sum + (Number(r.qty) || 0), 0)
  const itemsTotal = order.items_total + addedTotal

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

            {newItems.map((row) => {
              const product = productsById[row.product_id]
              const sizeOptions = product?.sizes ?? []
              return (
                <div className="checkout-item checkout-item--new" key={row.key}>
                  <div className="checkout-item__info">
                    <select
                      className="checkout-item__select"
                      aria-label="Товар"
                      value={row.product_id}
                      onChange={(e) => pickProduct(row.key, Number(e.target.value))}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <div className="checkout-item__controls">
                      {sizeOptions.length > 0 ? (
                        <select
                          className="checkout-item__select"
                          aria-label="Размер"
                          value={row.size}
                          onChange={(e) => patchRow(row.key, { size: e.target.value })}
                        >
                          <option value="">без размера</option>
                          {sizeOptions.map((s) => (
                            <option key={s.id} value={s.label}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          className="checkout-item__select"
                          aria-label="Размер"
                          value={row.size}
                          placeholder="размер"
                          onChange={(e) => patchRow(row.key, { size: e.target.value })}
                        />
                      )}
                      <input
                        className="checkout-item__select checkout-item__select--num"
                        aria-label="Количество"
                        type="number"
                        min="1"
                        max="100"
                        value={row.qty}
                        onChange={(e) => patchRow(row.key, { qty: e.target.value })}
                      />
                      <input
                        className="checkout-item__select checkout-item__select--num"
                        aria-label="Цена, ₽"
                        type="number"
                        min="0"
                        value={row.price}
                        onChange={(e) => patchRow(row.key, { price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="checkout-item__right">
                    <span className="checkout-item__price">{formatPrice(rowSum(row))}</span>
                    <button
                      className="checkout-item__remove"
                      type="button"
                      aria-label="Убрать позицию"
                      onClick={() => setNewItems(newItems.filter((r) => r.key !== row.key))}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <button className="btn btn--outline admin-order__add-item" type="button" onClick={addRow} disabled={!products.length}>
            + Добавить товар
          </button>
          {addedTotal > 0 && (
            <p className="admin-order__hint">
              Доплата {formatPrice(addedTotal)} — счёт заказа уже оплачен, деньги за дозаказ нужно
              получить отдельно.
            </p>
          )}

          <div className="checkout__totals">
            <div className="checkout__total-row">
              <span>
                Итог: {itemsCount} {plural(itemsCount, 'изделие', 'изделия', 'изделий')}
              </span>
              <span>{formatPrice(itemsTotal)}</span>
            </div>
            <div className="checkout__total-row">
              <span>Доставка:</span>
              <span>{formatPrice(order.delivery_price)}</span>
            </div>
            <div className="checkout__total-row checkout__total-row--final">
              <span>Итог:</span>
              <span>{formatPrice(itemsTotal + order.delivery_price)}</span>
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

      <PaymentLog
        payments={payments}
        // отметить вручную можно только то, что банк ещё не подтвердил;
        // отменённый — это протухший неоплаченный, деньги могли прийти и после
        canMarkPaid={['pending', 'cancelled'].includes(order.status)}
        marking={markingPaid}
        onMarkPaid={markPaidManually}
      />

      {/* в самом низу, под журналом: чтобы дотянуться, надо пролистать всю карточку */}
      <section className="admin-order__danger">
        <h2 className="payment-log__title">Удаление</h2>
        <p className="admin-order__hint">
          Заказ исчезнет и из админки, и из профиля покупателя — вместе с позициями и журналом
          оплаты. Восстановить нечем.
        </p>
        <button
          className="btn btn--outline admin-btn--danger"
          type="button"
          onClick={removeOrder}
          disabled={deleting}
        >
          {deleting ? 'Удаление...' : 'Удалить заказ'}
        </button>
      </section>
    </div>
  )
}

const ATTEMPT_LABELS = {
  new: 'ждёт оплату',
  confirmed: 'оплачена',
  failed: 'банк отклонил',
  manual: 'отмечена вручную',
}

const kopecks = (value) => (value === null || value === undefined ? '—' : formatPrice(value / 100))

/** Журнал оплаты: с чем мы ходили в Т-Банк и что он присылал в ответ.
 *  Нужен, когда покупатель говорит «деньги списались» — по PaymentId и номеру
 *  заказа платёж ищется в личном кабинете банка. */
function PaymentLog({ payments, canMarkPaid, marking, onMarkPaid }) {
  if (payments === undefined || payments === null) {
    return (
      <section className="payment-log">
        <h2 className="payment-log__title">Оплата</h2>
        <p className="admin-order__hint">
          {payments === undefined
            ? 'Загрузка журнала...'
            : 'Журнал оплаты не загрузился — обновите страницу или войдите заново.'}
        </p>
      </section>
    )
  }

  const { attempts, notifications } = payments

  return (
    <section className="payment-log">
      <h2 className="payment-log__title">Оплата</h2>
      <p className="admin-order__hint">
        В личном кабинете Т-Банка платёж ищется по PaymentId, а номер заказа {payments.number} —
        это OrderId. Он один на все попытки, PaymentId у каждой свой.
      </p>

      <div className="payment-log__summary">
        <div className="payment-log__fact">
          <span>Статус заказа</span>
          <b>{ORDER_STATUS_LABELS[payments.status] ?? payments.status}</b>
        </div>
        <div className="payment-log__fact">
          <span>Сумма заказа</span>
          <b>{formatPrice(payments.total)}</b>
        </div>
        <div className="payment-log__fact">
          <span>Отмечен оплаченным</span>
          <b>{payments.paid_at ? formatDateTime(payments.paid_at) : '—'}</b>
        </div>
        <div className="payment-log__fact">
          <span>Последний PaymentId</span>
          <b>{payments.tinkoff_payment_id || '—'}</b>
        </div>
      </div>

      {canMarkPaid && (
        <div className="payment-log__manual">
          <button className="btn btn--outline" type="button" onClick={onMarkPaid} disabled={marking}>
            {marking ? 'Отмечаем...' : 'Отметить оплаченным вручную'}
          </button>
          <p className="admin-order__hint">
            Если деньги пришли переводом на карту. Заказ перейдёт в «В работе», а в журнале
            появится запись — банк такую оплату не подтверждал, и сверить её можно только
            по вашему комментарию.
          </p>
        </div>
      )}

      <h3 className="payment-log__subtitle">Попытки оплаты ({attempts.length})</h3>
      {attempts.length === 0 ? (
        <p className="admin-order__hint">Попыток не записано — заказ создан до появления журнала.</p>
      ) : (
        <div className="payment-table__wrap">
          <table className="payment-table">
            <thead>
              <tr>
                <th>Когда</th>
                <th>PaymentId</th>
                <th>Сумма</th>
                <th>Что с ней</th>
                <th>Примечание</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((a) => (
                <tr
                  key={a.id}
                  className={
                    ['confirmed', 'manual'].includes(a.status) ? 'payment-table__row--ok' : undefined
                  }
                >
                  <td>{formatDateTime(a.created_at)}</td>
                  <td className="payment-table__id">{a.payment_id || '—'}</td>
                  <td>{formatPrice(a.amount)}</td>
                  <td>
                    {ATTEMPT_LABELS[a.status] ?? a.status}
                    {a.confirmed_at && ` — ${formatDateTime(a.confirmed_at)}`}
                  </td>
                  <td>{a.note || a.error || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="payment-log__subtitle">Уведомления банка ({notifications.length})</h3>
      {notifications.length === 0 ? (
        <p className="admin-order__hint">
          По этому заказу банк ничего не присылал. Если покупатель уверяет, что платил —
          значит уведомление до нас не дошло, ищите платёж в кабинете по номеру заказа.
        </p>
      ) : (
        <div className="payment-notes">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`payment-note${n.accepted ? ' payment-note--ok' : ''}${
                n.signature_ok ? '' : ' payment-note--bad'
              }`}
            >
              <div className="payment-note__head">
                <b>{n.status ?? 'без статуса'}</b>
                <span>{kopecks(n.amount_kopecks)}</span>
                <span className="payment-table__id">{n.payment_id || 'без PaymentId'}</span>
                <span>{formatDateTime(n.created_at)}</span>
              </div>
              <div className="payment-note__flags">
                <span>{n.signature_ok ? 'подпись верна' : '⚠ подпись не сошлась'}</span>
                <span>{n.accepted ? 'засчитано как оплата' : 'оплатой не засчитано'}</span>
                {n.ip && <span>IP {n.ip}</span>}
              </div>
              {n.note && <p className="payment-note__reason">{n.note}</p>}
              <details className="payment-note__raw">
                <summary>Что прислал банк</summary>
                <pre>{JSON.stringify(n.payload, null, 2)}</pre>
              </details>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
