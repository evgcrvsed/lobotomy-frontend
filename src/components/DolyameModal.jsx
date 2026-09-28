import { useState } from 'react'
import { DOLYAME_TERMS, dolyameTermPart, formatPrice } from '../constants'
import Modal from './Modal'
import '../styles/components/modal.css'
import '../styles/components/dolyame-modal.css'

const STEPS = [
  'Выберите способ оплаты заказа – Долями',
  'Подберите подходящий срок оплаты',
  'Оплачивайте покупку частями с карты',
]

/** Окно «Разделите стоимость покупки» — по макету Т-Банка.
 *  sum — стоимость с учётом количества. */
export default function DolyameModal({ open, onClose, sum }) {
  const [termIndex, setTermIndex] = useState(0)
  const term = DOLYAME_TERMS[termIndex]
  const part = dolyameTermPart(sum, term)

  return (
    <Modal open={open} onClose={onClose} titleId="dolyame-title" bare className="dm">
      <div className="dm__body">
        <div className="dm__top">
          <div className="dm__logos">
            <img src="/dolyame.svg" alt="Долями" width="86" height="24" />
            <span className="dm__times" aria-hidden="true">
              ×
            </span>
            <img src="/t-bank-logo.svg" alt="Т-Банк" width="92" height="28" />
          </div>
          <button type="button" className="dm__close" onClick={onClose} aria-label="Закрыть">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <h2 className="dm__title" id="dolyame-title">
          Разделите стоимость покупки
        </h2>
        <p className="dm__subtitle">Забирайте товар сразу, а платите частями в течение комфортного срока</p>

        <div className="dm__terms" role="group" aria-label="Срок оплаты">
          {DOLYAME_TERMS.map((t, i) => (
            <button
              key={t.label}
              type="button"
              className={`dm__term${i === termIndex ? ' dm__term--active' : ''}`}
              aria-pressed={i === termIndex}
              onClick={() => setTermIndex(i)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="dm__card">
          <p className="dm__now">{formatPrice(term.upfront ? part : 0)} сейчас</p>
          <p className="dm__then">
            Затем по {formatPrice(part)} {term.every}
          </p>
          {/* доля на каждый платёж; первая синяя — ближайший платёж */}
          <div className="dm__bar" aria-hidden="true">
            {Array.from({ length: term.payments }, (_, i) => (
              <span key={i} className={`dm__bar-part${i === 0 ? ' dm__bar-part--paid' : ''}`} />
            ))}
          </div>
        </div>

        <h3 className="dm__heading">Как оформить?</h3>
        <ol className="dm__steps">
          {STEPS.map((step, i) => (
            <li key={step} className="dm__step">
              <span className="dm__step-num">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>

        <p className="dm__footer">
          Подробнее о сервисе можно узнать на{' '}
          <a href="https://dolyame.ru" target="_blank" rel="noopener noreferrer">
            dolyame.ru
          </a>
        </p>
      </div>
    </Modal>
  )
}
