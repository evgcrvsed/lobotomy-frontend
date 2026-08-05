import { useLayoutEffect, useRef } from 'react'

/**
 * Текст в одну строку: начинает с maxSize и уменьшает шрифт, пока не влезет
 * по ширине. Чистым CSS так нельзя — нужно измерять фактическую ширину текста.
 *
 * Если даже на minSize не помещается (очень длинное название на узком экране),
 * остаток скрывается многоточием — это лучше, чем выехать за пределы страницы.
 */
export default function FitText({ as: Tag = 'span', text, maxSize, minSize = 12, className }) {
  const ref = useRef(null)

  // useLayoutEffect, а не useEffect: подгоняем до отрисовки на экран,
  // иначе будет заметно, как текст скачком меняет размер
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const fit = () => {
      let size = maxSize
      el.style.fontSize = `${size}px`
      // scrollWidth — ширина текста в одну строку, clientWidth — сколько есть места
      while (size > minSize && el.scrollWidth > el.clientWidth) {
        size -= 0.5
        el.style.fontSize = `${size}px`
      }
    }

    fit()

    // ресайз окна и поворот телефона
    window.addEventListener('resize', fit)
    // контейнер мог поменять ширину и без ресайза окна
    const observer = new ResizeObserver(fit)
    if (el.parentElement) observer.observe(el.parentElement)
    // до загрузки шрифта ширина меряется по запасному — размер был бы неверным
    let cancelled = false
    document.fonts?.ready.then(() => {
      if (!cancelled) fit()
    })

    return () => {
      cancelled = true
      window.removeEventListener('resize', fit)
      observer.disconnect()
    }
  }, [text, maxSize, minSize])

  return (
    <Tag ref={ref} className={className} title={text}>
      {text}
    </Tag>
  )
}
