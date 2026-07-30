import '../styles/pages/legal.css'

/**
 * Обёртка для длинных юридических текстов (политика конфиденциальности,
 * договор оферты и т.п.). Header и Footer уже даёт Layout — здесь только
 * заголовок и сам текст, который передаётся через children.
 */
export default function LegalPage({ title, children }) {
  return (
    <div className="legal-page">
      <h1 className="legal-page__title">{title}</h1>
      <div className="legal-page__body">{children}</div>
    </div>
  )
}
