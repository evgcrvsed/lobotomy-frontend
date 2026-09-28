import { Link } from 'react-router-dom'

export default function ProductCard({ image, hoverImage, name, color, price, variant, href = '#' }) {
  return (
    <article className={`product-card${variant === 'v2' ? ' product-card--v2' : ''}`}>
      {/* lazy: фото каталога качаются, только когда карточка подъезжает к экрану.
          Иначе на телефоне два десятка фото делят канал с верхней картинкой,
          и первый экран долго остаётся чёрным */}
      <Link to={href} className="product-card__img-wrap">
        <img src={image} alt={name} className="product-card__img" loading="lazy" decoding="async" />
        {hoverImage && (
          <img
            src={hoverImage}
            alt=""
            aria-hidden="true"
            className="product-card__img product-card__img--hover"
            loading="lazy"
            decoding="async"
          />
        )}
      </Link>
      <div className="product-card__info">
        <span className="product-card__name">{name}</span>
        <span className="product-card__color">{color}</span>
        <span className="product-card__price">{price}</span>
      </div>
    </article>
  )
}
