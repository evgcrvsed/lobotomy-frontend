import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../api/client'
import OrderView from '../components/OrderView'
import '../styles/pages/orders.css'

export default function TrackPage() {
  const [params] = useSearchParams()
  const [number, setNumber] = useState(params.get('number') ?? '')
  const [order, setOrder] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function lookup(e) {
    e?.preventDefault()
    if (!number.trim() || busy) return
    setBusy(true)
    setError(null)
    setOrder(null)
    try {
      const res = await api.trackOrder(number.trim())
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.detail ?? 'Заказ не найден')
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
      <p className="track-page__hint">Введите номер заказа из письма — покажем состав и статус.</p>

      <form className="track-form" onSubmit={lookup}>
        <input
          className="track-form__input"
          type="text"
          placeholder="Номер заказа из письма"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          autoFocus
        />
        <button className="btn btn--dark" type="submit" disabled={busy || !number.trim()}>
          {busy ? 'Ищем...' : 'Найти'}
        </button>
      </form>

      {error && <p className="track-page__error">{error}</p>}
      {order && <OrderView order={order} />}

      <p className="track-page__login-hint">
        Оформляли с входом в аккаунт? <Link to="/profile">Заказы в профиле</Link>
      </p>
    </div>
  )
}
