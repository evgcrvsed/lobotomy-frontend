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

    // ширина контейнера меняется при ресайзе окна и повороте телефона
    const target = el.parentElement ?? el
    const observer = new ResizeObserver(fit)
    observer.observe(target)
    return () => observer.disconnect()
  }, [text, maxSize, minSize])

  return (
    <Tag ref={ref} className={className} title={text}>
      {text}
    </Tag>
  )
}
