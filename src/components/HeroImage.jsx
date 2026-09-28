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
 *
 * onReady — зовётся, когда картинка скачалась (или не смогла): по этому
 * сигналу главная начинает качать фото каталога.
 */
export default function HeroImage({ src, onReady }) {
  const [readySrc, setReadySrc] = useState(null)

  useEffect(() => {
    if (!src) {
      setReadySrc(null)
      return
    }

    // Грузим в памяти и показываем только готовую — так не будет
    // ни мелькания заглушки, ни рывка при появлении.
    const img = new Image()
    // Первый экран — качаем раньше всего остального на странице
    img.fetchPriority = 'high'
    let cancelled = false
    const done = () => {
      if (cancelled) return
      setReadySrc(src)
      onReady?.()
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
    // onReady намеренно не в зависимостях: новая функция при каждом рендере
    // страницы не должна заново запускать загрузку той же картинки
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  return (
    <section className="hero">
      {readySrc && <img src={readySrc} alt="" className="hero__img" fetchPriority="high" />}
    </section>
  )
}
