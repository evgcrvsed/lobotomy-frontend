import { useState } from 'react'
import ProductCard from '../components/ProductCard'
import previewImg from '../assets/images/preview.png'
import productImg from '../assets/images/product_1.jpg'
import '../styles/components/product-card.css'
import '../styles/pages/index.css'

const CATALOG_PRODUCTS = Array.from({ length: 8 }, () => ({
  image: productImg,
  name: 'Айтем',
  color: 'цвет',
  price: '5 000 ₽',
}))

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState('all')

  return (
    <>
      <section className="hero">
        <img src={previewImg} alt="" className="hero__img" />
      </section>

      <section className="catalog" id="catalog">
        <div className="catalog__head">
          <span className="catalog__label">Каталог</span>
          <div className="catalog__filters">
            <button
              className={`catalog__filter${activeFilter === 'all' ? ' catalog__filter--active' : ''}`}
              type="button"
              onClick={() => setActiveFilter('all')}
            >
              Все
            </button>
          </div>
        </div>

        <div className="product-grid product-grid--catalog">
          {CATALOG_PRODUCTS.map((product, i) => (
            <ProductCard key={i} variant="v2" {...product} />
          ))}
        </div>
      </section>
    </>
  )
}
