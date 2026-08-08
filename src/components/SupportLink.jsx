import '../styles/components/support-link.css'

// Телеграм поддержки — один адрес на все места, где предлагаем написать
const SUPPORT_URL = 'https://t.me/lobotomy_support'

/**
 * Кружок с «?» — ссылка в техподдержку; подпись раскрывается при наведении.
 * Стоит в профиле, на странице после оплаты и в карточке заказа.
 */
export default function SupportLink({ label = 'Тех. поддержка' }) {
  return (
    <a
      className="support-link"
      href={SUPPORT_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
    >
      <span className="support-link__icon" aria-hidden="true">
        ?
      </span>
      <span className="support-link__label">{label}</span>
    </a>
  )
}
