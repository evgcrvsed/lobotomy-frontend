import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { getToken } from '../auth'
import { clearCart } from '../cart'
import SupportLink from '../components/SupportLink'
import { getGuestOrders, rememberGuestOrder } from '../guestOrders'
import '../styles/pages/orders.css'

export default function CheckoutSuccessPage() {
  const { number: fromPath } = useParams()
  const [params] = useSearchParams()
  const authorized = !!getToken()

  // Номер приходит в пути (его кладёт бэкенд в SuccessURL). OrderId в query —
  // запас на старые ссылки; последняя надежда — то, что запомнили при оформлении.
  const number = fromPath || params.get('OrderId') || (authorized ? null : getGuestOrders()[0]) || null

  // Корзину чистим один раз на заказ. На эту же страницу ведёт ссылка из письма,
  // и открыв её через неделю покупатель потерял бы уже собранную новую корзину.
  useEffect(() => {
    if (!number) {
      clearCart()
      return
    }
    const key = 'lobotomy_cart_cleared_for'
    if (localStorage.getItem(key) !== number) {
      clearCart()
      localStorage.setItem(key, number)
    }
    if (!authorized) rememberGuestOrder(number)
  }, [number, authorized])

  return (
    <div className="order-result">
      <h1 className="order-result__title">Спасибо за заказ!</h1>

      {number ? (
        <>
          <p className="order-result__number">
            Номер заказа: <strong>{number}</strong>
          </p>
          {!authorized && (
            <p className="order-result__text order-result__text--warn">
              Сохраните номер — по нему вы сможете открыть заказ и посмотреть трек-номер.
              Или войдите на сайт с той же почтой: заказ сам привяжется к аккаунту.
            </p>
          )}
        </>
      ) : (
        <p className="order-result__text">
          Оплата прошла. Номер заказа можно посмотреть в{' '}
          {authorized ? <Link to="/profile">профиле</Link> : <Link to="/track">отслеживании</Link>}.
        </p>
      )}

      <p className="order-result__text">Как только заказ будет отправлен, у него появится трек-номер.</p>

      <div className="order-result__actions">
        {number && (
          <Link to={`/order/${encodeURIComponent(number)}`} className="btn btn--dark">
            Открыть заказ
          </Link>
        )}
        {authorized ? (
          <Link to="/profile" className="btn btn--outline">
            Мои заказы
          </Link>
        ) : (
          <Link to={number ? `/track?number=${encodeURIComponent(number)}` : '/track'} className="btn btn--outline">
            Отследить заказ
          </Link>
        )}
        <Link to="/" className="btn btn--outline">
          В каталог
        </Link>
      </div>

      {/* если с заказом что-то не так, писать некуда — даём поддержку сразу здесь */}
      <div className="order-result__support">
        <SupportLink />
      </div>
    </div>
  )
}
