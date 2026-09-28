import { useRef, useState } from 'react'
import { DOLYAME_PARTS, dolyamePart, formatPrice } from '../constants'
import { useCountUp, useInView } from '../effects'
import DolyameModal from './DolyameModal'
import '../styles/components/effects.css'
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

  const part = dolyamePart(sum)
  // докрутку показываем глазами, а в подпись отдаём конечную сумму:
  // промежуточные цифры скринридеру не нужны
  const rolling = formatPrice(useCountUp(part))
  const exact = formatPrice(part)

  return (
    <>
      <button
        ref={ref}
        className={`dolyame fx-shimmer${seen ? ' fx-shimmer--run' : ''}`}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Долями: ${exact} × ${DOLYAME_PARTS} без переплат. Как оплатить`}
      >
        <img src="/dolyame-small-logo.svg" alt="" className="dolyame__logo" width="24" height="24" />
        <span className="dolyame__text">
            {/*{rolling} × {DOLYAME_PARTS} без переплат*/}
            Долями от 0 ₽
        </span>
        <img src="/chevron-right.png" alt="" className="dolyame__chevron" width="16" height="16" />
      </button>

      <DolyameModal open={open} onClose={() => setOpen(false)} sum={sum} />
    </>
  )
}
