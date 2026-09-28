import { useEffect, useState } from 'react'
import { api, imageUrl } from '../api/client'
import HeroImage from '../components/HeroImage'
import ProductCard from '../components/ProductCard'
import { formatPrice } from '../constants'
import previewImg from '../assets/images/preview.webp'
import useMediaQuery from '../useMediaQuery'
import '../styles/components/product-card.css'
import '../styles/pages/index.css'

function findImage(product, role) {
  const img = product.images.find((i) => i.role === role)
  return img ? imageUrl(img.filename) : null
}

export default function HomePage() {
  const [products, setProducts] = useState([])
  const [collections, setCollections] = useState([])
  // Грузятся независимо: верхней картинке нужны только коллекции, и ждать
  // список всех товаров ей незачем — на телефоне это лишние секунды чёрного экрана
  const [loading, setLoading] = useState(true) // товары
  const [collectionsLoading, setCollectionsLoading] = useState(true)
  // Фото каталога не качаем, пока не скачалась верхняя картинка. Просьбы к браузеру
  // тут не помогают: loading="lazy" на медленном интернете заранее грузит всё
  // в пределах ~2500px от экрана (то есть весь первый ряд каталога), а приоритет
  // запроса сервер (Caddy) при раздаче почти не учитывает — и два десятка фото
  // делили канал с верхней, пока экран оставался чёрным.
  const [heroReady, setHeroReady] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  // Та же граница, что и у мобильной версии страницы товара
  const isMobile = useMediaQuery('(max-width: 768px)')

  useEffect(() => {
    // finally, а не then: если бэкенд недоступен, промис отклоняется, и без
    // этого флаг загрузки остался бы true навсегда — верхняя картинка не появилась
    // бы вообще (осталась бы чёрная секция вместо заглушки)
    api
      .getCollections()
      .then(setCollections)
      .finally(() => setCollectionsLoading(false))
    api
      .getProducts()
      .then(setProducts)
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

  // На телефоне — вертикальная версия, если её загрузили: широкая картинка
  // на узком экране обрезается по краям. Нет вертикальной — берём основную.
  const collectionImage = (col) => (col ? (isMobile && col.image_mobile) || col.image : null)

  // «Все» — картинка, отмеченная в админке; иначе последняя добавленная.
  // У коллекции без своей картинки показываем общую, а не заглушку.
  const activeCollectionImage =
    activeFilter === 'all' ? null : collectionImage(collections.find((c) => c.id === activeFilter))
  const defaultImage = collectionImage(
    collections.find((c) => c.is_hero && c.image) ?? [...collections].reverse().find((c) => c.image)
  )
  const heroImage = activeCollectionImage ?? defaultImage
  // null, пока коллекции не пришли: тогда ещё неизвестно, какая картинка нужна,
  // и заглушку показывать нельзя — она мелькнёт и сменится настоящей
  const heroSrc = collectionsLoading ? null : heroImage ? imageUrl(heroImage) : previewImg

  return (
    <>
      <HeroImage src={heroSrc} onReady={() => setHeroReady(true)} />

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
              image={
                heroReady
                  ? (findImage(product, 'main') ?? (product.images[0] ? imageUrl(product.images[0].filename) : null))
                  : null
              }
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
