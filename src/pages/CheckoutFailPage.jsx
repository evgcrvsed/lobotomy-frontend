import { Link } from 'react-router-dom'
import '../styles/pages/orders.css'

export default function CheckoutFailPage() {
  return (
    <div className="order-result">
      <h1 className="order-result__title">Оплата не прошла</h1>
      <p className="order-result__text">
        Платёж не был завершён. Товары остались в корзине — можно попробовать ещё раз.
      </p>
      <div className="order-result__actions">
        <Link to="/checkout" className="btn btn--dark">
          Вернуться к оплате
        </Link>
        <Link to="/" className="btn btn--outline">
          В каталог
        </Link>
      </div>
    </div>
  )
}
