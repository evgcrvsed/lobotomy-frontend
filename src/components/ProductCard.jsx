export default function ProductCard({ image, name, color, price, variant, href = '#' }) {
  return (
    <article className={`product-card${variant === 'v2' ? ' product-card--v2' : ''}`}>
      <a href={href} className="product-card__img-wrap">
        <img src={image} alt={name} className="product-card__img" />
      </a>
      <div className="product-card__info">
        <span className="product-card__name">{name}</span>
        <span className="product-card__color">{color}</span>
        <span className="product-card__price">{price}</span>
      </div>
    </article>
  )
}
