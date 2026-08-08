import '../styles/components/support-link.css'

// Телеграм поддержки — один адрес на все места, где предлагаем написать
const SUPPORT_URL = 'https://t.me/lobotomy_support'

/**
 * Кружок с «?» — ссылка в техподдержку. Стоит в профиле, после оплаты и в заказе.
 *
 * По умолчанию подпись раскрывается при наведении. В центрированной колонке так
 * нельзя: раскрываясь, подпись раздвигает ссылку и уводит кружок из-под курсора —
 * для таких мест есть showLabel, с ним подпись видна всегда.
 */
export default function SupportLink({ label = 'Тех. поддержка', showLabel = false }) {
  return (
    <a
      className={`support-link${showLabel ? ' support-link--with-label' : ''}`}
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
