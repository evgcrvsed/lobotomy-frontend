import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import { errorTextFrom } from '../api/errors'
import OrderView from '../components/OrderView'
import { deliveryLabels } from '../constants'
import { getGuestOrders } from '../guestOrders'
import '../styles/pages/orders.css'

export default function TrackPage() {
  const [params] = useSearchParams()
  const [number, setNumber] = useState(params.get('number') ?? '')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [methods, setMethods] = useState([])
  // номера, запомненные на этом устройстве при оформлении без входа
  const [recent] = useState(() => getGuestOrders())

  useEffect(() => {
    api.getDeliveryMethods().then(setMethods)
  }, [])

  async function lookup(e) {
    e?.preventDefault()
    if (!number.trim() || busy) return
    setBusy(true)
    setError(null)
    setOrder(null)
    try {
      const res = await api.trackOrder(number.trim())
      if (!res.ok) {
        setError(await errorTextFrom(res, 'Заказ не найден'))
        return
      }
      setOrder(await res.json())
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="track-page">
      <h1 className="track-page__title">Отслеживание заказа</h1>
      <p className="track-page__hint">Введите номер заказа — покажем состав и статус.</p>

      <form className="track-form" onSubmit={lookup}>
        <input
          className="track-form__input"
          type="text"
          placeholder="Номер заказа"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          autoFocus
        />
        <button className="btn btn--dark" type="submit" disabled={busy || !number.trim()}>
          {busy ? 'Ищем...' : 'Найти'}
        </button>
      </form>

      {recent.length > 0 && (
        <div className="track-recent">
          <span className="track-recent__label">Заказы с этого устройства</span>
          <div className="track-recent__list">
            {recent.map((n) => (
              <button
                key={n}
                type="button"
                className={`track-recent__item${n === number ? ' track-recent__item--active' : ''}`}
                onClick={() => setNumber(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="track-page__error">{error}</p>}
      {order && <OrderView order={order} deliveryLabels={deliveryLabels(methods)} />}

      <p className="track-page__login-hint">
        Оформляли с входом в аккаунт? <Link to="/profile">Заказы в профиле</Link>
      </p>
    </div>
  )
}
