import { useEffect, useState } from 'react'
import Modal from '../components/Modal'
import ProductCard from '../components/ProductCard'
import productImg from '../assets/images/product_1.jpg'
import '../styles/components/modal.css'
import '../styles/components/product-card.css'
import '../styles/pages/profile.css'

const STORAGE_KEY = 'lobotomy_profile'

const FIELDS = [
  { key: 'name', label: 'ФИО', placeholder: 'Иванов Иван Иванович', type: 'text', autoComplete: 'name' },
  { key: 'address', label: 'Адрес', placeholder: 'ул. Пушкина, д. 1, кв. 2', type: 'text', autoComplete: 'street-address' },
  { key: 'city', label: 'Город', placeholder: 'Москва', type: 'text', autoComplete: 'address-level2' },
  { key: 'zip', label: 'Индекс', placeholder: '101000', type: 'text', autoComplete: 'postal-code', inputMode: 'numeric' },
  { key: 'email', label: 'Почта', placeholder: 'hello@example.com', type: 'email', autoComplete: 'email' },
]

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

const RECOMMENDATIONS = [
  { image: productImg, name: 'Zip-Hoodie v1.2', color: 'Чёрный', price: '5500₽' },
  { image: productImg, name: 'Zip-Hoodie v1.2', color: 'Чёрный', price: '5500₽' },
]

export default function ProfilePage() {
  const [profile, setProfile] = useState({})
  const [form, setForm] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setProfile(loadProfile())
  }, [])

  function openModal() {
    setForm(profile)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
  }

  function handleSubmit(e) {
    e.preventDefault()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form))
    setProfile(form)
    setModalOpen(false)

    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <>
      <section className="hello">
        <h1 className="hello__title">Привет, Lobotomy</h1>
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
                <li>
                  <a href="#" className="sidebar-nav__link">
                    Выйти из аккаунта
                  </a>
                </li>
              </ul>
            </nav>
          </aside>

          <div className="profile__cards">
            <div className="profile-card">
              <h2 className="profile-card__title section-title">Последние заказы</h2>
              <p className="profile-card__empty">Вы ещё ничего не заказывали</p>
              <div className="profile-card__actions">
                <a href="#" className="btn btn--dark">
                  Каталог
                </a>
              </div>
            </div>

            <div className="profile-card">
              <h2 className="profile-card__title section-title">Личная информация</h2>
              <ul className="profile-info__list">
                {FIELDS.map(({ key, label }) => {
                  const value = profile[key]?.trim?.()
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
            </div>

            <div className="profile-card profile-card--wide">
              <h2 className="profile-card__title section-title">История заказов</h2>
              <p className="profile-card__empty">Вы ещё ничего не заказывали</p>
              <div className="profile-card__actions">
                <a href="#" className="btn btn--dark">
                  Каталог
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Modal open={modalOpen} titleId="modalTitle" title="Личная информация" onClose={closeModal}>
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
            <button type="button" className="btn btn--outline" onClick={closeModal}>
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
