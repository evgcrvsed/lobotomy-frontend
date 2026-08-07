import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import { addToCart, getCart } from '../cart'
import FitText from '../components/FitText'
import HeroImage from '../components/HeroImage'
import ProductGalleryMobile from '../components/ProductGalleryMobile'
import { formatPrice } from '../constants'
import useMediaQuery from '../useMediaQuery'
import previewImg from '../assets/images/preview.webp'
import '../styles/components/image-viewer.css'
import '../styles/pages/product.css'

// Голое число админ пишет без единиц — «cm» дописываем сами, как было раньше.
// Всё остальное («46-48», «one size», «70 см») показываем ровно как введено.
const withUnits = (value) => (/^\d+([.,]\d+)?$/.test(value) ? `${value}cm` : value)

export default function ProductPage() {
  const { collectionSlug, productSlug } = useParams()
  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState(null)
  const [collection, setCollection] = useState(null)
  const [size, setSize] = useState('')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [cartItems, setCartItems] = useState(() => getCart())
  const [viewerSrc, setViewerSrc] = useState(null)

  useEffect(() => {
    const sync = () => setCartItems(getCart())
    window.addEventListener('cart-changed', sync)
    return () => window.removeEventListener('cart-changed', sync)
  }, [])

  const inCart = product ? cartItems.some((i) => i.productId === product.id) : false

  function handleAddToCart() {
    const mainImage = product.images.find((i) => i.role === 'main') ?? product.images[0]
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size: size || null,
      qty,
      image: mainImage?.filename ?? null,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([api.getProductBySlug(productSlug), api.getCollections()])
      .then(([prod, cols]) => {
        setProduct(prod)
        setCollection(
          cols.find((c) => c.id === prod?.collection_id) ?? cols.find((c) => c.slug === collectionSlug) ?? null
        )
        setSize(prod?.sizes[0]?.label ?? '')
        setQty(1)
      })
      // finally: при недоступном бэкенде промис отклоняется, и без этого
      // страница навсегда осталась бы в состоянии загрузки
      .finally(() => setLoading(false))
  }, [productSlug, collectionSlug])

  // Верхняя картинка — своя у каждой коллекции; если не задана — заглушка.
  // Пока грузимся — null: иначе заглушка мелькнёт и сменится настоящей.
  const heroSrc = loading ? null : collection?.image ? imageUrl(collection.image) : previewImg

  const gallery = product
    ? product.images.filter((i) => i.role === 'gallery').sort((a, b) => a.sort_order - b.sort_order)
    : []

  const sizeColumns = product?.size_columns ?? []

  const materialLines = product
    ? [product.material, product.density ? `Плотность — ${product.density}г/м²` : null].filter(Boolean)
    : []

  // На телефоне сверху не картинка коллекции, а фотографии товара: большая
  // плюс лента остальных. Разметка разная, одним CSS не обойтись.
  const isMobile = useMediaQuery('(max-width: 768px)')
  const galleryUrls = gallery.map((i) => imageUrl(i.filename))
  // если галереи нет — берём главное фото, иначе верх страницы будет пустым
  const mainImage = product?.images.find((i) => i.role === 'main') ?? product?.images[0]
  const mobileImages = galleryUrls.length
    ? galleryUrls
    : mainImage
      ? [imageUrl(mainImage.filename)]
      : []

  return (
    <div className="product-page">
      {!isMobile && <HeroImage src={heroSrc} />}

      {isMobile && !loading && product && (
        <ProductGalleryMobile
          key={product.id}
          images={mobileImages}
          alt={product.name}
          onZoom={setViewerSrc}
        />
      )}

      <div className="product-info">
        {loading && <p className="product-status">Загрузка...</p>}
        {!loading && !product && <p className="product-status">Товар не найден</p>}

        {!loading && product && (
          <>
            <div className="product-info__head">
              <nav className="product-breadcrumbs">
                <Link to="/">Главная</Link>
                /
                <Link to="/">{collection?.name ?? collectionSlug}</Link>
                /{product.name}
              </nav>
              <FitText as="h1" className="product-title" text={product.name} maxSize={20} minSize={12} />
              <span className="product-price">{formatPrice(product.price)}</span>
            </div>

            <div className="product-columns">
              <div className="product-col">
                {product.sizes.length > 0 && (
                  <div className="product-block">
                    <span className="product-label">Размер</span>
                    <select className="product-select" value={size} onChange={(e) => setSize(e.target.value)}>
                      {product.sizes.map((s) => (
                        <option key={s.id} value={s.label}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {product.description && (
                  <div className="product-block">
                    <span className="product-label">Описание</span>
                    <p className="product-text">{product.description}</p>
                  </div>
                )}
              </div>

              <div className="product-col product-col--right">
                <div className="product-cart-row">
                  <button className="product-cart-btn" type="button" onClick={handleAddToCart}>
                    {added ? 'Добавлено ✓' : 'Добавить в корзину'}
                  </button>
                  <Link
                    to="/checkout"
                    className={`product-goto-cart${inCart ? ' product-goto-cart--visible' : ''}`}
                    aria-label="Перейти в корзину"
                    tabIndex={inCart ? 0 : -1}
                  >
                    <svg width="20" height="22" viewBox="0 0 20 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1 1H4L6 14H16L18.5 5H5"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle cx="8" cy="18" r="1.5" fill="#ffffff" />
                      <circle cx="14" cy="18" r="1.5" fill="#ffffff" />
                    </svg>
                  </Link>
                </div>

                <div className="product-actions-row">
                  <div className="product-qty">
                    <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Меньше">
                      −
                    </button>
                    <span className="product-qty__value">{qty}</span>
                    <button type="button" onClick={() => setQty(qty + 1)} aria-label="Больше">
                      +
                    </button>
                  </div>
                  <button className="product-fav-btn" type="button">
                    Добавить в избранное
                  </button>
                </div>
              </div>
            </div>

            <div className="product-material-row">
              <div className="product-block">
                {materialLines.length > 0 && (
                  <>
                    <span className="product-label">Материал</span>
                    <p className="product-text">{materialLines.join('\n')}</p>
                  </>
                )}
              </div>

              {/* столбцы сетки — свои у каждого товара, задаются в админке;
                  без них показывать нечего: остались бы одни подписи размеров */}
              {product.sizes.length > 0 && sizeColumns.length > 0 ? (
                <table className="product-sizes">
                  <thead>
                    <tr>
                      <th />
                      {sizeColumns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.sizes.map((s) => (
                      <tr key={s.id}>
                        <td>{s.label} —</td>
                        {sizeColumns.map((column) => (
                          <td key={column}>
                            {s.measurements?.[column] ? withUnits(s.measurements[column]) : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <span />
              )}

              <span />
            </div>

            {/* на телефоне этих фото здесь нет — они показаны сверху галереей */}
            {!isMobile && gallery.length > 0 && (
              <div className="product-similar">
                {gallery.map((img) => (
                  <img
                    key={img.id}
                    src={imageUrl(img.filename)}
                    alt={product.name}
                    className="product-similar__img"
                    loading="lazy"
                    onClick={() => setViewerSrc(imageUrl(img.filename))}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {viewerSrc && (
        <div className="image-viewer" onClick={() => setViewerSrc(null)}>
          <img src={viewerSrc} alt={product?.name ?? ''} />
          <button type="button" className="image-viewer__close" aria-label="Закрыть">
            ×
          </button>
        </div>
      )}
    </div>
  )
}
