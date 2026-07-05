import { useEffect, useState } from 'react'
import { api, imageUrl } from '../api/client'
import Modal from '../components/Modal'
import '../styles/components/modal.css'
import '../styles/pages/admin.css'

const EMPTY_FORM = {
  collectionId: '',
  name: '',
  description: '',
  material: '',
  density: '',
  price: '',
  imageMain: null,
  imageHover: null,
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  return `${Math.max(1, Math.round(bytes / 1024))} КБ`
}

function ImageUploadSlot({ id, label, filename, uploading, onSelect, onClear }) {
  return (
    <div className="modal__field">
      <span className="modal__label">{label}</span>
      {filename ? (
        <div className="image-slot image-slot--filled">
          <img src={imageUrl(filename)} alt="" className="image-slot__preview" />
          <button type="button" className="image-slot__remove" onClick={onClear} aria-label="Убрать фото">
            ×
          </button>
        </div>
      ) : (
        <label className="image-slot" htmlFor={id}>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="image-slot__input"
            disabled={uploading}
            onChange={onSelect}
          />
          <span className="image-slot__hint">{uploading ? 'Загрузка...' : '+ Выбрать файл'}</span>
        </label>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [collections, setCollections] = useState([])
  const [products, setProducts] = useState([])
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCollectionId, setActiveCollectionId] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [currentProductId, setCurrentProductId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingField, setUploadingField] = useState(null)

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const cols = await api.getCollections()
    setCollections(cols)
    await refreshProducts()
    await refreshMedia()
  }

  async function refreshProducts() {
    setLoading(true)
    const list = await api.getProducts()
    setProducts(list)
    setLoading(false)
  }

  async function refreshMedia() {
    setMedia(await api.getImages())
  }

  async function deleteMediaFile(filename) {
    if (!confirm(`Удалить файл ${filename}? Отменить будет нельзя.`)) return

    const res = await api.deleteImage(filename)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('Не удалось удалить: ' + (err.detail ?? 'что-то пошло не так'))
      return
    }
    await refreshMedia()
  }

  function getCollectionName(id) {
    return collections.find((c) => c.id === id)?.name ?? '—'
  }

  const filteredProducts =
    activeCollectionId !== null ? products.filter((p) => p.collection_id === activeCollectionId) : products

  function openCreateModal() {
    setCurrentProductId(null)
    setForm({ ...EMPTY_FORM, collectionId: collections[0]?.id ?? '' })
    setModalOpen(true)
  }

  async function openEditModal(productId) {
    const product = await api.getProduct(productId)
    if (!product) return

    setCurrentProductId(productId)
    setForm({
      collectionId: product.collection_id,
      name: product.name,
      description: product.description ?? '',
      material: product.material ?? '',
      density: product.density ?? '',
      price: product.price,
      imageMain: product.images.find((i) => i.role === 'main')?.filename ?? null,
      imageHover: product.images.find((i) => i.role === 'hover')?.filename ?? null,
    })
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setCurrentProductId(null)
  }

  async function handleFileSelect(e, field) {
    const file = e.target.files[0]
    if (!file) return

    setUploadingField(field)
    try {
      const res = await api.uploadImage(file)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось загрузить фото: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      const { filename } = await res.json()
      setForm((f) => ({ ...f, [field]: filename }))
      await refreshMedia()
    } finally {
      setUploadingField(null)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (!form.imageMain) {
      alert('Добавьте основное фото')
      return
    }

    const images = [{ filename: form.imageMain, role: 'main', sort_order: 1 }]
    if (form.imageHover) {
      images.push({ filename: form.imageHover, role: 'hover', sort_order: 2 })
    }

    const data = {
      collection_id: parseInt(form.collectionId, 10),
      name: form.name.trim(),
      description: form.description.trim() || null,
      material: form.material.trim() || null,
      density: form.density ? parseInt(form.density, 10) : null,
      price: parseInt(form.price, 10),
      images,
    }

    setSubmitting(true)
    try {
      const res = currentProductId ? await api.updateProduct(currentProductId, data) : await api.createProduct(data)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Ошибка: ' + (err.detail ?? 'Что-то пошло не так'))
        return
      }

      closeModal()
      await refreshProducts()
      await refreshMedia()
    } finally {
      setSubmitting(false)
    }
  }

  async function deleteProduct(productId, name) {
    if (!confirm(`Удалить «${name}»?`)) return

    const res = await api.deleteProduct(productId)
    if (!res.ok) {
      alert('Не удалось удалить изделие')
      return
    }
    await refreshProducts()
    await refreshMedia()
  }

  return (
    <>
      <div className="admin-page">
        <div className="admin-page__top">
          <h1 className="admin-page__title">Каталог — управление</h1>
          <button className="btn btn--dark" onClick={openCreateModal}>
            + Добавить изделие
          </button>
        </div>

        <div className="admin-filters">
          <button
            className={`admin-filter${activeCollectionId === null ? ' admin-filter--active' : ''}`}
            onClick={() => setActiveCollectionId(null)}
          >
            Все
          </button>
          {collections.map((col) => (
            <button
              key={col.id}
              className={`admin-filter${activeCollectionId === col.id ? ' admin-filter--active' : ''}`}
              onClick={() => setActiveCollectionId(col.id)}
            >
              {col.name}
            </button>
          ))}
        </div>

        <div className="admin-list">
          {loading && <p className="admin-empty">Загрузка...</p>}
          {!loading && filteredProducts.length === 0 && <p className="admin-empty">Нет изделий</p>}
          {!loading &&
            filteredProducts.map((product) => {
              const firstImg =
                product.images.find((i) => i.role === 'main')?.filename ?? product.images[0]?.filename ?? null
              const meta = [product.material, product.density ? product.density + ' г/м²' : null]
                .filter(Boolean)
                .join(' · ')

              return (
                <div className="admin-row" key={product.id}>
                  <div className="admin-row__img">
                    {firstImg ? (
                      <img src={imageUrl(firstImg)} alt={product.name} />
                    ) : (
                      <div className="admin-row__img-placeholder" />
                    )}
                  </div>
                  <div className="admin-row__body">
                    <span className="admin-row__name">{product.name}</span>
                    <span className="admin-row__collection">{getCollectionName(product.collection_id)}</span>
                  </div>
                  <div className="admin-row__meta">{meta}</div>
                  <div className="admin-row__price">{product.price.toLocaleString('ru-RU')} ₽</div>
                  <div className="admin-row__actions">
                    <button className="btn btn--outline" onClick={() => openEditModal(product.id)}>
                      Ред.
                    </button>
                    <button
                      className="btn btn--outline admin-btn--danger"
                      onClick={() => deleteProduct(product.id, product.name)}
                    >
                      Уд.
                    </button>
                  </div>
                </div>
              )
            })}
        </div>

        <section className="admin-media">
          <h2 className="admin-media__title">Медиатека</h2>
          <p className="admin-media__hint">
            Все загруженные файлы. Файлы без товара можно удалить — они больше нигде не используются.
          </p>
          {media.length === 0 ? (
            <p className="admin-empty">Файлов нет</p>
          ) : (
            <div className="media-grid">
              {media.map((m) => (
                <div className="media-item" key={m.filename}>
                  <div className="media-item__thumb">
                    <img src={imageUrl(m.filename)} alt={m.filename} loading="lazy" />
                  </div>
                  <div className="media-item__info">
                    <span className="media-item__size">{formatSize(m.size)}</span>
                    {m.products.length > 0 ? (
                      <span className="media-item__usage" title={m.products.join(', ')}>
                        {m.products.join(', ')}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="media-item__delete"
                        onClick={() => deleteMediaFile(m.filename)}
                      >
                        Удалить
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={modalOpen}
        titleId="modal-title"
        title={currentProductId ? 'Редактировать изделие' : 'Добавить изделие'}
        onClose={closeModal}
      >
        <form className="modal__form" onSubmit={handleSubmit} noValidate>
          <div className="modal__field">
            <label className="modal__label" htmlFor="field-collection">
              Коллекция
            </label>
            <select
              className="modal__select"
              id="field-collection"
              required
              value={form.collectionId}
              onChange={(e) => setForm({ ...form, collectionId: e.target.value })}
            >
              {collections.map((col) => (
                <option value={col.id} key={col.id}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal__field">
            <label className="modal__label" htmlFor="field-name">
              Название *
            </label>
            <input
              className="modal__input"
              type="text"
              id="field-name"
              placeholder='T-shirt "Cardinal sins"'
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="modal__field">
            <label className="modal__label" htmlFor="field-description">
              Описание
            </label>
            <textarea
              className="modal__textarea"
              id="field-description"
              placeholder="оверсайз крой\nвсе принты - вышивка"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="modal__row">
            <div className="modal__field">
              <label className="modal__label" htmlFor="field-material">
                Материал
              </label>
              <input
                className="modal__input"
                type="text"
                id="field-material"
                placeholder="100% хлопок"
                value={form.material}
                onChange={(e) => setForm({ ...form, material: e.target.value })}
              />
            </div>
            <div className="modal__field">
              <label className="modal__label" htmlFor="field-density">
                Плотность, г/м²
              </label>
              <input
                className="modal__input"
                type="number"
                id="field-density"
                placeholder="180"
                min="1"
                value={form.density}
                onChange={(e) => setForm({ ...form, density: e.target.value })}
              />
            </div>
          </div>

          <div className="modal__field">
            <label className="modal__label" htmlFor="field-price">
              Стоимость, ₽ *
            </label>
            <input
              className="modal__input"
              type="number"
              id="field-price"
              placeholder="5000"
              min="1"
              required
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </div>

          <div className="modal__row">
            <ImageUploadSlot
              id="field-image-main"
              label="Основное фото *"
              filename={form.imageMain}
              uploading={uploadingField === 'imageMain'}
              onSelect={(e) => handleFileSelect(e, 'imageMain')}
              onClear={() => setForm({ ...form, imageMain: null })}
            />
            <ImageUploadSlot
              id="field-image-hover"
              label="Фото при наведении"
              filename={form.imageHover}
              uploading={uploadingField === 'imageHover'}
              onSelect={(e) => handleFileSelect(e, 'imageHover')}
              onClear={() => setForm({ ...form, imageHover: null })}
            />
          </div>

          <div className="modal__actions">
            <button className="btn btn--dark" type="submit" disabled={submitting}>
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button className="btn btn--outline" type="button" onClick={closeModal}>
              Отмена
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
