import { Link } from 'react-router-dom'
import '../styles/pages/checkout.css'
import '../styles/pages/legal.css'

/**
 * Обёртка для длинных юридических текстов (политика конфиденциальности,
 * договор оферты и т.п.). Header и Footer уже даёт Layout — здесь только
 * хлебная крошка и сам текст, который передаётся через children.
 *
 * Заголовок отдельно не рисуем: вставленный текст уже начинается со
 * своего <h1> — второй заголовок поверх был бы дублем.
 */
export default function LegalPage({ title, children }) {
  return (
    <div className="legal-page">
      <nav className="checkout__breadcrumbs">
        <Link to="/">Главная</Link>/{title}
      </nav>
      <div className="legal-page__body">{children}</div>
    </div>
  )
}
