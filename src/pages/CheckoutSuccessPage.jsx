import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getToken } from '../auth'
import { clearCart } from '../cart'
import '../styles/pages/orders.css'

export default function CheckoutSuccessPage() {
  const [params] = useSearchParams()
  const number = params.get('OrderId')

  // заказ оформлен — очищаем корзину
  useEffect(() => {
    clearCart()
  }, [])

  return (
    <div className="order-result">
      <h1 className="order-result__title">Спасибо за заказ!</h1>
      {number && (
        <p className="order-result__number">
          Номер заказа: <strong>{number}</strong>
        </p>
      )}
      <p className="order-result__text">
        Информация о заказе отправлена на вашу почту. Как только он будет отправлен, добавим трек-номер.
      </p>
      <div className="order-result__actions">
        {getToken() ? (
          <Link to="/profile" className="btn btn--dark">
            Мои заказы
          </Link>
        ) : (
          <Link to={number ? `/track?number=${encodeURIComponent(number)}` : '/track'} className="btn btn--dark">
            Отследить заказ
          </Link>
        )}
        <Link to="/" className="btn btn--outline">
          В каталог
        </Link>
      </div>
    </div>
  )
}
