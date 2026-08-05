import { useState } from 'react'

/**
 * Галерея товара для телефонов: одна большая фотография на всю ширину,
 * под ней — лента остальных, прокручиваемая пальцем. Тап по маленькой
 * подставляет её наверх, тап по большой — открывает на весь экран.
 *
 * На широких экранах не используется: там сверху стоит картинка коллекции,
 * а фотографии товара идут рядом внизу.
 */
export default function ProductGalleryMobile({ images, alt, onZoom }) {
  const [active, setActive] = useState(0)

  if (!images.length) return null

  // подстраховка, если список фотографий вдруг стал короче
  const current = images[Math.min(active, images.length - 1)]

  return (
    <section className="product-gallery-m">
      <img
        src={current}
        alt={alt}
        className="product-gallery-m__main"
        onClick={() => onZoom?.(current)}
      />

      {images.length > 1 && (
        <div className="product-gallery-m__strip">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`product-gallery-m__thumb${i === active ? ' product-gallery-m__thumb--active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Фотография ${i + 1} из ${images.length}`}
              aria-current={i === active}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
