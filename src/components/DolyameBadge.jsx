import { useEffect, useRef, useState } from 'react'
import { DOLYAME_PARTS, dolyamePart, formatPrice } from '../constants'
import { useCountUp, useInView } from '../effects'
import DolyameModal from './DolyameModal'
import '../styles/components/effects.css'
import '../styles/components/dolyame.css'

/** Пауза между «шторка доехала» и открытием окна — чтобы закрытое
 *  состояние успели увидеть, а не окно перекрыло анимацию на излёте */
const COVERED_PAUSE_MS = 120

/** Плашка «Долями» на карточке товара — по образцу официальной от Т-Банка.
 *
 *  Только витрина. Своей кнопки оплаты частями у нас нет: Долями подключены
 *  через платёжную форму Т-Банка, и способ покупатель выбирает уже там.
 *  Поэтому по клику не переход к оплате, а окно с объяснением, где её искать.
 *
 *  sum — стоимость с учётом количества, поэтому платёж пересчитывается,
 *  когда покупатель меняет счётчик рядом.
 */
export default function DolyameBadge({ sum }) {
  // covered — белая часть целиком закрыла «Проект Т-Банк»; держим так,
  // пока открыто окно, и отпускаем после закрытия
  const [covered, setCovered] = useState(false)
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const mainRef = useRef(null)
  const seen = useInView(ref) // блик пробегает, когда плашку впервые увидели
  const timer = useRef(0)

  useEffect(() => () => clearTimeout(timer.current), [])

  const part = dolyamePart(sum)
  // докрутку показываем глазами, а в подпись отдаём конечную сумму:
  // промежуточные цифры скринридеру не нужны
  const rolling = formatPrice(useCountUp(part))
  const exact = formatPrice(part)

  function handleClick() {
    if (covered) return
    setCovered(true)

    // Окно — только когда шторка доехала до конца. Длительность берём из CSS,
    // а не дублируем: сколько там стоит, столько и ждём (при «уменьшить
    // движение» там 0 — окно откроется сразу)
    const { transitionDuration } = getComputedStyle(mainRef.current)
    const duration = parseFloat(transitionDuration) * (transitionDuration.endsWith('ms') ? 1 : 1000)
    timer.current = setTimeout(() => setOpen(true), duration ? duration + COVERED_PAUSE_MS : 0)
  }

  function handleClose() {
    setOpen(false)
    setCovered(false)
  }

  return (
    <>
      <button
        ref={ref}
        className={`dolyame fx-shimmer${seen ? ' fx-shimmer--run' : ''}${covered ? ' dolyame--covered' : ''}`}
        type="button"
        onClick={handleClick}
        aria-label={`Долями: ${exact} × ${DOLYAME_PARTS} без переплат. Как оплатить`}
      >
        <span className="dolyame__main" ref={mainRef}>
          <img src="/dolyame-small-logo.svg" alt="" className="dolyame__logo" width="24" height="24" />
          <span className="dolyame__text">
            {rolling} × {DOLYAME_PARTS} без переплат
          </span>
          <img src="/chevron-right.png" alt="" className="dolyame__chevron" width="16" height="16" />
        </span>

        <span className="dolyame__brand">
          <img src="/proect-t-bank.svg" alt="" width="57" height="22" />
        </span>
      </button>

      <DolyameModal open={open} onClose={handleClose} sum={sum} />
    </>
  )
}
