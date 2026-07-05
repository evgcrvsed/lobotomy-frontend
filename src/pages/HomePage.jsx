import { useEffect, useState } from 'react'
import { api, imageUrl } from '../api/client'
import ProductCard from '../components/ProductCard'
import previewImg from '../assets/images/preview.png'
import '../styles/components/product-card.css'
import '../styles/pages/index.css'

function findImage(product, role) {
  const img = product.images.find((i) => i.role === role)
  return img ? imageUrl(img.filename) : null
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    api.getProducts().then((list) => {
      setProducts(list)
      setLoading(false)
    })
  }, [])

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

        {!loading && products.length === 0 && <p className="catalog__empty">Ой, забыл товары добавить...</p>}

        <div className="product-grid product-grid--catalog">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              variant="v2"
              image={findImage(product, 'main') ?? (product.images[0] ? imageUrl(product.images[0].filename) : null)}
              hoverImage={findImage(product, 'hover')}
              name={product.name}
              color={product.material ?? ''}
              price={`${product.price.toLocaleString('ru-RU')} ₽`}
            />
          ))}
        </div>
      </section>
    </>
  )
}
