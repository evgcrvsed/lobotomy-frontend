import { Link } from 'react-router-dom'
import logoBlack from '../assets/images/logo-black.png'

export default function Header() {
  return (
    <header className="header">
      {/*<button type="button" className="header__icon-btn" aria-label="Открыть меню">*/}
      {/*  <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">*/}
      {/*    <rect width="20" height="1.5" fill="#111111" />*/}
      {/*    <rect y="6" width="14" height="1.5" fill="#111111" />*/}
      {/*    <rect y="12" width="20" height="1.5" fill="#111111" />*/}
      {/*  </svg>*/}
      {/*</button>*/}
      <div></div>

      <Link to="/" className="header__logo" aria-label="Lobotomy — главная">
        <img src={logoBlack} alt="Lobotomy" />
      </Link>

      <div className="header__actions">
        <Link to="/profile" className="header__icon-btn" aria-label="Профиль">
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="6" r="5" stroke="#111111" strokeWidth="1.5" />
            <path
              d="M1 21C1 17.134 5.02944 14 10 14C14.9706 14 19 17.134 19 21"
              stroke="#111111"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </Link>
        <a href="#" className="header__icon-btn" aria-label="Корзина">
          <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 1H4L6 14H16L18.5 5H5"
              stroke="#111111"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="8" cy="18" r="1.5" fill="#111111" />
            <circle cx="14" cy="18" r="1.5" fill="#111111" />
          </svg>
        </a>
      </div>
    </header>
  )
}
