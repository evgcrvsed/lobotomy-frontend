import { useEffect, useRef, useState } from 'react'

/**
 * Галерея товара для телефонов: большая фотография листается свайпом,
 * под ней лента миниатюр. Тап по миниатюре пролистывает наверх, тап по
 * большой открывает её на весь экран.
 *
 * Листание сделано нативной прокруткой со scroll-snap, а не обработкой
 * касаний: так картинка следует за пальцем и сохраняется инерция.
 */
export default function ProductGalleryMobile({ images, alt, onZoom }) {
  const [active, setActive] = useState(0)
  const trackRef = useRef(null)
  const stripRef = useRef(null)

  function goTo(index) {
    const track = trackRef.current
    // scrollLeft, а не scrollTo({behavior:'smooth'}): плавная прокрутка
    // конфликтует со scroll-snap-type: mandatory и молча не срабатывает
    if (track) track.scrollLeft = index * track.clientWidth
    // подсветку ставим сразу, не дожидаясь события прокрутки: программная
    // прокрутка его порождает не везде, и миниатюра бы не подсветилась
    setActive(index)
  }

  function handleScroll() {
    const track = trackRef.current
    if (!track || !track.clientWidth) return
    setActive(Math.round(track.scrollLeft / track.clientWidth))
  }

  // подтягиваем ленту миниатюр за текущей фотографией, если она уехала за край
  useEffect(() => {
    const strip = stripRef.current
    const thumb = strip?.children[active]
    if (!strip || !thumb) return
    strip.scrollLeft = thumb.offsetLeft - strip.clientWidth / 2 + thumb.clientWidth / 2
  }, [active])

  if (!images.length) return null

  return (
    <section className="product-gallery-m">
      <div className="product-gallery-m__track" ref={trackRef} onScroll={handleScroll}>
        {images.map((src) => (
          <img
            key={src}
            src={src}
            alt={alt}
            className="product-gallery-m__main"
            onClick={() => onZoom?.(src)}
          />
        ))}
      </div>

      {images.length > 1 && (
        <div className="product-gallery-m__strip" ref={stripRef}>
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              className={`product-gallery-m__thumb${i === active ? ' product-gallery-m__thumb--active' : ''}`}
              onClick={() => goTo(i)}
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
