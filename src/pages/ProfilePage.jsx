import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import { clearToken, getToken } from '../auth'
import Modal from '../components/Modal'
import OrderView from '../components/OrderView'
import ProductCard from '../components/ProductCard'
import { deliveryLabels, formatPrice } from '../constants'
import '../styles/components/modal.css'
import '../styles/components/product-card.css'
import '../styles/pages/profile.css'

// Пока настройка не загрузилась (или бэкенд молчит) — то же, что на бэкенде
const DEFAULT_GREETING = '? ? ?'

// Порядок как на оформлении заказа — данные там и тут одни и те же
const FIELDS = [
  { key: 'full_name', label: 'ФИО', placeholder: 'Иванов Иван Иванович', type: 'text', autoComplete: 'name' },
  { key: 'email', label: 'Почта', placeholder: 'hello@example.com', type: 'email', autoComplete: 'email', readOnly: true },
  { key: 'phone', label: 'Телефон', placeholder: '+7 900 000-00-00', type: 'tel', autoComplete: 'tel' },
  { key: 'country', label: 'Страна', placeholder: 'Россия', type: 'text', autoComplete: 'country-name' },
  { key: 'city', label: 'Город', placeholder: 'Москва', type: 'text', autoComplete: 'address-level2' },
  { key: 'address', label: 'Адрес', placeholder: 'ул. Пушкина, д. 1, кв. 2', type: 'text', autoComplete: 'street-address' },
  { key: 'postal_code', label: 'Индекс', placeholder: '101000', type: 'text', autoComplete: 'postal-code', inputMode: 'numeric' },
  { key: 'pickup_point', label: 'Пункт выдачи', placeholder: 'ул. Кутузова, 27', type: 'text' },
]

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [orders, setOrders] = useState([])
  const [recommended, setRecommended] = useState([])
  const [collections, setCollections] = useState([])
  const [methods, setMethods] = useState([])
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  // приветствие задаётся в админке; до загрузки — значение по умолчанию
  const [greeting, setGreeting] = useState(DEFAULT_GREETING)

  // 2 случайных существующих товара в блок «Вам также может понравиться»
  useEffect(() => {
    Promise.all([
      api.getProducts(),
      api.getCollections(),
      api.getDeliveryMethods(),
      api.getSettings(),
    ]).then(([list, cols, dm, settings]) => {
      setCollections(cols)
      setMethods(dm)
      setRecommended([...list].sort(() => Math.random() - 0.5).slice(0, 2))
      if (settings.profile_greeting) setGreeting(settings.profile_greeting)
    })
  }, [])

  function recommendedProps(product) {
    const main = product.images.find((i) => i.role === 'main') ?? product.images[0]
    const hover = product.images.find((i) => i.role === 'hover')
    const colSlug = collections.find((c) => c.id === product.collection_id)?.slug
    return {
      href: colSlug && product.slug ? `/${colSlug}/${product.slug}` : '#',
      image: main ? imageUrl(main.filename) : null,
      hoverImage: hover ? imageUrl(hover.filename) : null,
      name: product.name,
      color: product.material ?? '',
      price: formatPrice(product.price),
    }
  }

  // при заходе на страницу проверяем сохранённый токен
  useEffect(() => {
    if (!getToken()) {
      setChecking(false)
      return
    }
    api.getMe().then((me) => {
      if (!me) {
        clearToken() // токен протух — забываем его
        setChecking(false)
        return
      }
      setUser(me)
      setChecking(false)
      api.getMyOrders().then(setOrders)
    })
  }, [])

  function logout() {
    clearToken()
    setUser(null)
    setOrders([])
  }

  function openModal() {
    setForm(Object.fromEntries(FIELDS.map(({ key }) => [key, user[key] ?? ''])))
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // email не отправляем: его нельзя менять — он подтверждён входом
    const payload = Object.fromEntries(
      FIELDS.filter(({ readOnly }) => !readOnly).map(({ key }) => [key, form[key]?.trim() || null])
    )
    const res = await api.updateMe(payload)
    if (!res.ok) {
      alert('Не удалось сохранить')
      return
    }
    setUser(await res.json())
    setModalOpen(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <>
      <section className="hello">
        <h1 className="hello__title">{greeting}</h1>
      </section>

      <section className="profile">
        <div className="profile__container">
          <aside className="profile__sidebar">
            <nav className="sidebar-nav">
              <p className="sidebar-nav__title">Профиль</p>
              <ul className="sidebar-nav__list">
                <li>
                  <a href="#" className="sidebar-nav__link sidebar-nav__link--active">
                    История заказов
                  </a>
                </li>
                {user && (
                  <li>
                    <button type="button" className="sidebar-nav__link sidebar-nav__logout" onClick={logout}>
                      Выйти из аккаунта
                    </button>
                  </li>
                )}
              </ul>
            </nav>
          </aside>

          <div className="profile__cards">
            <div className="profile-card">
              <h2 className="profile-card__title section-title">Последний заказ</h2>
              {orders.length > 0 ? (
                <>
                  <OrderView order={orders[0]} linkTo={`/order/${orders[0].number}`} deliveryLabels={deliveryLabels(methods)} />
                  <a
                    className="support-link"
                    href="https://t.me/lobotomy_support"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="support-link__icon" aria-hidden="true">?</span>
                    Тех. поддержка
                  </a>
                </>
              ) : (
                <>
                  <p className="profile-card__empty">Вы ещё ничего не заказывали</p>
                  <div className="profile-card__actions">
                    <Link to="/" className="btn btn--dark">
                      Каталог
                    </Link>
                  </div>
                </>
              )}
            </div>

            <div className="profile-card">
              <h2 className="profile-card__title section-title">Личная информация</h2>
              {checking && <p className="profile-card__empty">Загрузка...</p>}

              {!checking && user && (
                <>
                  <ul className="profile-info__list">
                    {FIELDS.map(({ key, label }) => {
                      const value = user[key]?.trim?.()
                      return (
                        <li className={`profile-info__item${value ? '' : ' profile-info__item--empty'}`} key={key}>
                          {value ? `${label}: ${value}` : label}
                        </li>
                      )
                    })}
                  </ul>
                  <div className="profile-card__actions">
                    <button className="btn btn--dark" onClick={openModal} disabled={saved}>
                      {saved ? 'Сохранено ✓' : 'Изменить'}
                    </button>
                  </div>
                </>
              )}

              {!checking && !user && (
                <div className="profile-card__login">
                  <p className="profile-card__empty">
                    Войдите, чтобы сохранить данные доставки и оформлять заказы
                  </p>
                  <Link to="/login" className="btn btn--dark">
                    Войти
                  </Link>
                </div>
              )}
            </div>

            <div className="profile-card profile-card--wide">
              <h2 className="profile-card__title section-title">История заказов</h2>
              {orders.length > 0 ? (
                orders.map((o) => (
                  <OrderView key={o.number} order={o} linkTo={`/order/${o.number}`} deliveryLabels={deliveryLabels(methods)} />
                ))
              ) : (
                <>
                  <p className="profile-card__empty">Вы ещё ничего не заказывали</p>
                  <div className="profile-card__actions">
                    <Link to="/" className="btn btn--dark">
                      Каталог
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Modal open={modalOpen} titleId="modalTitle" title="Личная информация" onClose={() => setModalOpen(false)}>
        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          {FIELDS.map(({ key, label, placeholder, type, autoComplete, inputMode, readOnly }) => (
            <div className="modal__field" key={key}>
              <label className="modal__label" htmlFor={`field-${key}`}>
                {label}
              </label>
              <input
                className="modal__input"
                type={type}
                id={`field-${key}`}
                name={key}
                placeholder={placeholder}
                autoComplete={autoComplete}
                inputMode={inputMode}
                readOnly={readOnly}
                title={readOnly ? 'Почта подтверждена при входе и не меняется' : undefined}
                value={form[key] || ''}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </div>
          ))}
          <div className="modal__actions">
            <button type="submit" className="btn btn--dark">
              Сохранить
            </button>
            <button type="button" className="btn btn--outline" onClick={() => setModalOpen(false)}>
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      <section className="recommendations">
        <div className="recommendations__container">
          <h2 className="recommendations__title section-title">Вам также может понравиться:</h2>
          <div className="product-grid">
            {recommended.map((product) => (
              <ProductCard key={product.id} {...recommendedProps(product)} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
