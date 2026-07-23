import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { clearToken, getToken } from '../auth'
import Modal from '../components/Modal'
import ProductCard from '../components/ProductCard'
import productImg from '../assets/images/product_1.jpg'
import '../styles/components/modal.css'
import '../styles/components/product-card.css'
import '../styles/pages/profile.css'

const FIELDS = [
  { key: 'full_name', label: 'ФИО', placeholder: 'Иванов Иван Иванович', type: 'text', autoComplete: 'name' },
  { key: 'address', label: 'Адрес', placeholder: 'ул. Пушкина, д. 1, кв. 2', type: 'text', autoComplete: 'street-address' },
  { key: 'city', label: 'Город', placeholder: 'Москва', type: 'text', autoComplete: 'address-level2' },
  { key: 'postal_code', label: 'Индекс', placeholder: '101000', type: 'text', autoComplete: 'postal-code', inputMode: 'numeric' },
  { key: 'email', label: 'Почта', placeholder: 'hello@example.com', type: 'email', autoComplete: 'email' },
]

const RECOMMENDATIONS = [
  { image: productImg, name: 'Zip-Hoodie v1.2', color: 'Чёрный', price: '5500₽' },
  { image: productImg, name: 'Zip-Hoodie v1.2', color: 'Чёрный', price: '5500₽' },
]

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)
  const [form, setForm] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  // при заходе на страницу проверяем сохранённый токен
  useEffect(() => {
    if (!getToken()) {
      setChecking(false)
      return
    }
    api.getMe().then((me) => {
      if (!me) clearToken() // токен протух — забываем его
      setUser(me)
      setChecking(false)
    })
  }, [])

  function logout() {
    clearToken()
    setUser(null)
  }

  function openModal() {
    setForm({
      full_name: user.full_name ?? '',
      address: user.address ?? '',
      city: user.city ?? '',
      postal_code: user.postal_code ?? '',
      email: user.email ?? '',
    })
    setModalOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()

    const payload = Object.fromEntries(FIELDS.map(({ key }) => [key, form[key]?.trim() || null]))
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

  const firstName = user?.full_name?.split(' ').at(-1)

  return (
    <>
      <section className="hello">
        <h1 className="hello__title">Привет, {firstName || 'Lobotomy'}</h1>
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
              <h2 className="profile-card__title section-title">Последние заказы</h2>
              <p className="profile-card__empty">Вы ещё ничего не заказывали</p>
              <div className="profile-card__actions">
                <Link to="/" className="btn btn--dark">
                  Каталог
                </Link>
              </div>
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
              <p className="profile-card__empty">Вы ещё ничего не заказывали</p>
              <div className="profile-card__actions">
                <Link to="/" className="btn btn--dark">
                  Каталог
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal open={modalOpen} titleId="modalTitle" title="Личная информация" onClose={() => setModalOpen(false)}>
        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          {FIELDS.map(({ key, label, placeholder, type, autoComplete, inputMode }) => (
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
            {RECOMMENDATIONS.map((product, i) => (
              <ProductCard key={i} {...product} />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
