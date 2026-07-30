import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api/client'
import '../styles/pages/orders.css'

export default function CheckoutFailPage() {
  const { number } = useParams()
  const [paying, setPaying] = useState(false)

  /** Заказ уже создан — повторяем оплату по нему, а не оформляем заново. */
  async function retry() {
    setPaying(true)
    try {
      const res = await api.resumePayment(number)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось вернуться к оплате: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      window.location.href = (await res.json()).payment_url
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="order-result">
      <h1 className="order-result__title">Оплата не прошла</h1>

      {number && (
        <p className="order-result__number">
          Номер заказа: <strong>{number}</strong>
        </p>
      )}
      <p className="order-result__text">
        Платёж не был завершён. Заказ сохранён — его можно оплатить в течение часа,
        потом он отменится и придётся оформить заново. Товары остались в корзине.
      </p>

      <div className="order-result__actions">
        {number ? (
          <button className="btn btn--dark" type="button" onClick={retry} disabled={paying}>
            {paying ? 'Переходим к оплате...' : 'Оплатить снова'}
          </button>
        ) : (
          <Link to="/checkout" className="btn btn--dark">
            Вернуться к оплате
          </Link>
        )}
        <Link to="/" className="btn btn--outline">
          В каталог
        </Link>
      </div>
    </div>
  )
}
