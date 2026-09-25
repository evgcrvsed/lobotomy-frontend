import { useEffect, useRef, useState } from 'react'
import useMediaQuery from './useMediaQuery'

// Набор мелких эффектов для любых кнопок и плашек — не привязан к конкретной
// странице. Всё уважает «уменьшить движение» в системе: там, где человек
// попросил не анимировать, эффекты молча выключаются.

const REDUCED = '(prefers-reduced-motion: reduce)'

/**
 * Число, которое доезжает до нового значения, а не прыгает.
 * Возвращает промежуточное значение — форматировать его дело вызывающего.
 *
 * Первый рендер без анимации: считать от нуля при загрузке страницы нечестно,
 * анимируем только реальные изменения.
 */
export function useCountUp(value, { duration = 420 } = {}) {
  const reduced = useMediaQuery(REDUCED)
  const [shown, setShown] = useState(value)
  // от чего ехать: если предыдущая анимация не доиграла, продолжаем с места,
  // где она остановилась, — иначе цифра дёргалась бы назад при быстрых кликах
  const from = useRef(value)

  useEffect(() => {
    if (reduced || from.current === value) {
      from.current = value
      setShown(value)
      return
    }

    const start = from.current
    const t0 = performance.now()
    let raf = 0

    const step = (t) => {
      const k = Math.min(1, (t - t0) / duration)
      const eased = 1 - (1 - k) ** 3 // замедление к концу
      const next = Math.round(start + (value - start) * eased)
      from.current = next
      setShown(next)
      if (k < 1) raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, reduced])

  return shown
}

/**
 * Попадал ли элемент в кадр. Срабатывает один раз и больше не следит —
 * для эффектов-приветствий, которые не должны повторяться при каждой прокрутке.
 */
export function useInView(ref, { threshold = 0.6 } = {}) {
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return

    // без IntersectionObserver считаем элемент увиденным: лучше показать
    // эффект сразу, чем не показать вовсе
    if (!('IntersectionObserver' in window)) {
      setSeen(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, threshold, seen])

  return seen
}

/**
 * Лёгкий наклон элемента за курсором. Только для мыши: на тач-экранах
 * pointermove приходит вместе с тапом, и плашка дёргалась бы при нажатии.
 *
 * Угол ставится инлайновым transform, плавность возврата — за CSS (.fx-tilt).
 */
export function useTilt(ref, { rotateX = 7, rotateY = 9, scale = 1.02 } = {}) {
  const fine = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reduced = useMediaQuery(REDUCED)

  useEffect(() => {
    const el = ref.current
    if (!el || !fine || reduced) return

    const reset = () => {
      el.style.transform = ''
    }

    const move = (e) => {
      const r = el.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      el.style.transform =
        `perspective(600px) rotateX(${-y * rotateX}deg) rotateY(${x * rotateY}deg) scale(${scale})`
    }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', reset)
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', reset)
      reset() // иначе элемент остался бы повёрнутым после размонтирования эффекта
    }
  }, [ref, fine, reduced, rotateX, rotateY, scale])
}
