import { useEffect, useState } from 'react'
import '../styles/components/hero.css'

/**
 * Верхняя картинка на всю ширину (главная и страница товара).
 *
 * Показывает картинку только когда она уже скачана. Пока грузится — просто
 * чёрный фон секции: иначе видно, как сначала мелькает заглушка, а потом
 * подменяется настоящей картинкой.
 *
 * src === null означает «ещё не знаем, какую картинку показывать» (данные
 * не пришли с сервера) — это не то же самое, что «картинки нет».
 */
export default function HeroImage({ src }) {
  const [readySrc, setReadySrc] = useState(null)

  useEffect(() => {
    if (!src) {
      setReadySrc(null)
      return
    }

    // Грузим в памяти и показываем только готовую — так не будет
    // ни мелькания заглушки, ни рывка при появлении.
    const img = new Image()
    let cancelled = false
    const done = () => {
      if (!cancelled) setReadySrc(src)
    }

    img.onload = done
    // на ошибке тоже показываем: пусть будет битая картинка,
    // чем вечно чёрный экран
    img.onerror = done
    img.src = src
    // картинка уже в кэше браузера — onload может не сработать
    if (img.complete) done()

    return () => {
      cancelled = true
    }
  }, [src])

  return (
    <section className="hero">
      {readySrc && <img src={readySrc} alt="" className="hero__img" />}
    </section>
  )
}
