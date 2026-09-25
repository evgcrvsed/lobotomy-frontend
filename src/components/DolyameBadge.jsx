import { useRef, useState } from 'react'
import { DOLYAME_PARTS, dolyamePart, formatPrice } from '../constants'
import { useCountUp, useInView, useTilt } from '../effects'
import Modal from './Modal'
import '../styles/components/effects.css'
import '../styles/components/modal.css'
import '../styles/components/dolyame.css'

/** Плашка «Долями» на карточке товара.
 *
 *  Только витрина. Своей кнопки оплаты частями у нас нет: Долями подключены
 *  через платёжную форму Т-Банка, и способ покупатель выбирает уже там.
 *  Поэтому по клику не переход к оплате, а окно с объяснением, где её искать.
 *
 *  sum — стоимость с учётом количества, поэтому платёж пересчитывается,
 *  когда покупатель меняет счётчик рядом.
 */
export default function DolyameBadge({ sum }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const seen = useInView(ref) // блик пробегает, когда плашку впервые увидели
  useTilt(ref)

  const part = dolyamePart(sum)
  // докрутку показываем глазами, а в подпись и окно отдаём конечную сумму:
  // промежуточные цифры скринридеру не нужны, а в окне они успели бы устареть
  const rolling = formatPrice(useCountUp(part))
  const exact = formatPrice(part)

  return (
    <>
      <button
        ref={ref}
        className={`dolyame fx-shimmer fx-tilt${seen ? ' fx-shimmer--run' : ''}`}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Долями: по ${exact} × ${DOLYAME_PARTS}. Как оплатить`}
      >
        <span className="dolyame__logo">
          <svg width="14" height="12" viewBox="0 0 14 12" fill="none" aria-hidden="true">
            <rect x="0" y="4" width="2.6" height="8" rx="1" fill="currentColor" />
            <rect x="3.8" y="2" width="2.6" height="10" rx="1" fill="currentColor" />
            <rect x="7.6" y="6" width="2.6" height="6" rx="1" fill="currentColor" />
            <rect x="11.4" y="0" width="2.6" height="12" rx="1" fill="currentColor" />
          </svg>
          Долями
        </span>

        <span className="dolyame__sum">
          по {rolling} × {DOLYAME_PARTS}
        </span>

        <span className="dolyame__info" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2" />
            <path d="M8 7.3V11.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            <circle cx="8" cy="4.9" r="0.85" fill="currentColor" />
          </svg>
        </span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Оплата Долями" titleId="dolyame-title">
        <div className="dolyame-modal">
          <p className="dolyame-modal__sum">
            Покупку можно разделить на {DOLYAME_PARTS} платежа по {exact}
          </p>

          <ol className="dolyame-modal__steps">
            <li>Добавьте товар в корзину и оформите заказ как обычно.</li>
            <li>
              На странице оплаты нажмите <b>«Разделить оплату»</b> и выберите Долями.
            </li>
          </ol>

          <p className="dolyame-modal__note">
            Первый платёж спишется сразу, остальные — по графику Долями. Сервис предоставляет
            Т-Банк, решение об оплате частями принимает он же.
          </p>
        </div>
      </Modal>
    </>
  )
}
