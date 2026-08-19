import { useEffect, useState } from 'react'
import { api, imageUrl } from '../api/client'
import HeroImage from '../components/HeroImage'
import ProductCard from '../components/ProductCard'
import { formatPrice } from '../constants'
import previewImg from '../assets/images/preview.webp'
import '../styles/components/product-card.css'
import '../styles/pages/index.css'

function findImage(product, role) {
  const img = product.images.find((i) => i.role === role)
  return img ? imageUrl(img.filename) : null
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [collections, setCollections] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    Promise.all([api.getProducts(), api.getCollections()])
      .then(([list, cols]) => {
        setProducts(list)
        setCollections(cols)
      })
      // finally, а не then: если бэкенд недоступен, промис отклоняется, и без
      // этого loading остался бы true навсегда — верхняя картинка не появилась бы
      // вообще (осталась бы чёрная секция вместо заглушки)
      .finally(() => setLoading(false))
  }, [])

  function productHref(product) {
    const colSlug = collections.find((c) => c.id === product.collection_id)?.slug
    return colSlug && product.slug ? `/${colSlug}/${product.slug}` : '#'
  }

  // Скрытые товары в каталог не попадают, но остаются доступны по прямой ссылке —
  // страница товара грузится отдельно, по slug, и про этот фильтр не знает
  const visibleProducts = products.filter((p) => !p.is_hidden)
  const filteredProducts =
    activeFilter === 'all'
      ? visibleProducts
      : visibleProducts.filter((p) => p.collection_id === activeFilter)

  // «Все» — картинка, отмеченная в админке; иначе последняя добавленная.
  // У коллекции без своей картинки показываем общую, а не заглушку.
  const activeCollectionImage =
    activeFilter === 'all' ? null : collections.find((c) => c.id === activeFilter)?.image
  const defaultImage =
    collections.find((c) => c.is_hero && c.image)?.image ??
    [...collections].reverse().find((c) => c.image)?.image
  const heroImage = activeCollectionImage ?? defaultImage
  // null, пока коллекции не пришли: тогда ещё неизвестно, какая картинка нужна,
  // и заглушку показывать нельзя — она мелькнёт и сменится настоящей
  const heroSrc = loading ? null : heroImage ? imageUrl(heroImage) : previewImg

  return (
    <>
      <HeroImage src={heroSrc} />

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
            {collections.map((col) => (
              <button
                key={col.id}
                className={`catalog__filter${activeFilter === col.id ? ' catalog__filter--active' : ''}`}
                type="button"
                onClick={() => setActiveFilter(col.id)}
              >
                {col.name}
              </button>
            ))}
          </div>
        </div>

        {!loading && visibleProducts.length === 0 && (
          <p className="catalog__empty">Ой, забыл товары добавить...</p>
        )}
        {!loading && visibleProducts.length > 0 && filteredProducts.length === 0 && (
          <p className="catalog__empty">В этой коллекции пока пусто</p>
        )}

        <div className="product-grid product-grid--catalog">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              variant="v2"
              href={productHref(product)}
              image={findImage(product, 'main') ?? (product.images[0] ? imageUrl(product.images[0].filename) : null)}
              hoverImage={findImage(product, 'hover')}
              name={product.name}
              color={product.material ?? ''}
              price={formatPrice(product.price)}
            />
          ))}
        </div>
      </section>
    </>
  )
}
