import { useEffect, useState } from 'react'
import { api, imageUrl } from '../api/client'
import Modal from '../components/Modal'
import '../styles/components/modal.css'
import '../styles/pages/admin.css'

const SIZE_FIELDS = [
  ['length', 'Length'],
  ['shoulder', 'Shoulder'],
  ['chest', 'Chest'],
  ['sleeve', 'Sleeve'],
]

const emptySizeRow = (label = '') => ({ label, length: '', shoulder: '', chest: '', sleeve: '' })
const defaultSizes = () => ['S', 'M', 'L', 'XL'].map(emptySizeRow)

const EMPTY_FORM = {
  collectionId: '',
  name: '',
  slug: '',
  description: '',
  material: '',
  density: '',
  price: '',
  imageMain: null,
  imageHover: null,
  gallery: [],
  sizes: [],
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

  const [colModalOpen, setColModalOpen] = useState(false)
  const [colDrafts, setColDrafts] = useState({})
  const [newColName, setNewColName] = useState('')

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

  async function reloadCollections() {
    const cols = await api.getCollections()
    setCollections(cols)
    setColDrafts(Object.fromEntries(cols.map((c) => [c.id, c.name])))
  }

  function openColModal() {
    setColDrafts(Object.fromEntries(collections.map((c) => [c.id, c.name])))
    setNewColName('')
    setColModalOpen(true)
  }

  async function saveCollectionName(col) {
    const name = (colDrafts[col.id] ?? '').trim()
    if (!name) return

    const res = await api.updateCollection(col.id, { name, image: col.image })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('Не удалось переименовать: ' + (err.detail ?? 'что-то пошло не так'))
      return
    }
    await reloadCollections()
  }

  async function setCollectionImage(col, image) {
    const res = await api.updateCollection(col.id, { name: col.name, image })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('Не удалось сохранить картинку: ' + (err.detail ?? 'что-то пошло не так'))
      return
    }
    await reloadCollections()
    await refreshMedia()
  }

  async function handleColImageSelect(e, col) {
    const file = e.target.files[0]
    if (!file) return

    const res = await api.uploadImage(file)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('Не удалось загрузить фото: ' + (err.detail ?? 'что-то пошло не так'))
      e.target.value = ''
      return
    }
    const { filename } = await res.json()
    e.target.value = ''
    await setCollectionImage(col, filename)
  }

  async function addCollection() {
    const name = newColName.trim()
    if (!name) return

    const res = await api.createCollection({ name })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('Не удалось создать: ' + (err.detail ?? 'что-то пошло не так'))
      return
    }
    setNewColName('')
    await reloadCollections()
  }

  async function removeCollection(col) {
    if (!confirm(`Удалить коллекцию «${col.name}»?`)) return

    const res = await api.deleteCollection(col.id)
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('Не удалось удалить: ' + (err.detail ?? 'что-то пошло не так'))
      return
    }
    if (activeCollectionId === col.id) setActiveCollectionId(null)
    await reloadCollections()
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
    setForm({ ...EMPTY_FORM, collectionId: collections[0]?.id ?? '', sizes: defaultSizes() })
    setModalOpen(true)
  }

  async function openEditModal(productId) {
    const product = await api.getProduct(productId)
    if (!product) return

    setCurrentProductId(productId)
    setForm({
      collectionId: product.collection_id,
      name: product.name,
      slug: product.slug ?? '',
      description: product.description ?? '',
      material: product.material ?? '',
      density: product.density ?? '',
      price: product.price,
      imageMain: product.images.find((i) => i.role === 'main')?.filename ?? null,
      imageHover: product.images.find((i) => i.role === 'hover')?.filename ?? null,
      gallery: product.images
        .filter((i) => i.role === 'gallery')
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => i.filename),
      sizes: product.sizes.length
        ? product.sizes.map((s) => ({
            label: s.label,
            length: s.length ?? '',
            shoulder: s.shoulder ?? '',
            chest: s.chest ?? '',
            sleeve: s.sleeve ?? '',
          }))
        : defaultSizes(),
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

  async function handleGallerySelect(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setUploadingField('gallery')
    try {
      const uploaded = []
      for (const file of files) {
        const res = await api.uploadImage(file)
        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          alert(`Не удалось загрузить ${file.name}: ` + (err.detail ?? 'что-то пошло не так'))
          continue
        }
        uploaded.push((await res.json()).filename)
      }
      if (uploaded.length) {
        setForm((f) => ({ ...f, gallery: [...f.gallery, ...uploaded] }))
      }
      await refreshMedia()
    } finally {
      setUploadingField(null)
      e.target.value = ''
    }
  }

  function removeGalleryItem(index) {
    setForm((f) => ({ ...f, gallery: f.gallery.filter((_, i) => i !== index) }))
  }

  function updateSizeRow(index, field, value) {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }))
  }

  function addSizeRow() {
    setForm((f) => ({ ...f, sizes: [...f.sizes, emptySizeRow()] }))
  }

  function removeSizeRow(index) {
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, i) => i !== index) }))
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
    form.gallery.forEach((filename, i) => {
      images.push({ filename, role: 'gallery', sort_order: 3 + i })
    })

    // строки, где не заполнен ни один замер, не сохраняем
    const toNum = (v) => (v === '' ? null : parseInt(v, 10))
    const sizes = form.sizes
      .filter((row) => row.label.trim() && SIZE_FIELDS.some(([field]) => row[field] !== ''))
      .map((row) => ({
        label: row.label.trim(),
        length: toNum(row.length),
        shoulder: toNum(row.shoulder),
        chest: toNum(row.chest),
        sleeve: toNum(row.sleeve),
      }))

    const data = {
      collection_id: parseInt(form.collectionId, 10),
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      description: form.description.trim() || null,
      material: form.material.trim() || null,
      density: form.density ? parseInt(form.density, 10) : null,
      price: parseInt(form.price, 10),
      images,
      sizes,
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
          <h1 className="admin-page__title">Каталог</h1>
          <div className="admin-page__actions">
            <button className="btn btn--dark" onClick={openColModal}>
              + Редактировать коллекции
            </button>
            <button className="btn btn--dark" onClick={openCreateModal}>
              + Добавить изделие
            </button>
          </div>
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
          <h2 className="admin-media__title">Картинки на бэке (чисто отладка чтобы мусор детектить и удалять сразу же)</h2>
          <p className="admin-media__hint">
            Все загруженные файлы. Файлы без товара можно удалить — они больше нигде не используются. Удалить используемые файлы нельзя.
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
        wide
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
            <label className="modal__label" htmlFor="field-slug">
              Название адреса страницы
            </label>
            <input
              className="modal__input"
              type="text"
              id="field-slug"
              placeholder="zip-hoodie-v1-2"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
            <span className="modal__hint">
              Адрес карточки: /product/{form.slug.trim() || '...'} — если оставить пустым, сгенерируется из названия
            </span>
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

          <div className="modal__field">
            <span className="modal__label">Фотографии на странице товара</span>
            <div className="gallery-grid">
              {form.gallery.map((filename, i) => (
                <div className="image-slot image-slot--filled" key={`${filename}-${i}`}>
                  <img src={imageUrl(filename)} alt="" className="image-slot__preview" />
                  <button
                    type="button"
                    className="image-slot__remove"
                    onClick={() => removeGalleryItem(i)}
                    aria-label="Убрать фото"
                  >
                    ×
                  </button>
                </div>
              ))}
              <label className="image-slot" htmlFor="field-gallery">
                <input
                  id="field-gallery"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="image-slot__input"
                  disabled={uploadingField === 'gallery'}
                  onChange={handleGallerySelect}
                />
                <span className="image-slot__hint">
                  {uploadingField === 'gallery' ? 'Загрузка...' : '+ Добавить'}
                </span>
              </label>
            </div>
          </div>

          <div className="modal__field">
            <span className="modal__label">Размерная сетка, всё в СМ!</span>
            <div className="size-table">
              <div className="size-table__row size-table__row--head">
                <span></span>
                {SIZE_FIELDS.map(([field, title]) => (
                  <span key={field}>{title}</span>
                ))}
                <span />
              </div>
              {form.sizes.map((row, i) => (
                <div className="size-table__row" key={i}>
                  <input
                    className="modal__input"
                    type="text"
                    placeholder="S"
                    value={row.label}
                    onChange={(e) => updateSizeRow(i, 'label', e.target.value)}
                  />
                  {SIZE_FIELDS.map(([field]) => (
                    <input
                      key={field}
                      className="modal__input"
                      type="number"
                      min="1"
                      placeholder="—"
                      value={row[field]}
                      onChange={(e) => updateSizeRow(i, field, e.target.value)}
                    />
                  ))}
                  <button
                    type="button"
                    className="size-table__remove"
                    onClick={() => removeSizeRow(i)}
                    aria-label="Убрать размер"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn--outline size-table__add" onClick={addSizeRow}>
                + Добавить размер
              </button>
            </div>
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

      <Modal open={colModalOpen} titleId="col-modal-title" title="Коллекции" onClose={() => setColModalOpen(false)}>
        <div className="modal__form">
          <p className="admin-media__hint">
            Картинка коллекции показывается сверху на страницах её товаров. Чтобы её установить - кликай по квадрату с плюсиком
          </p>
          {collections.map((col) => (
            <div className="col-row" key={col.id}>
              <label className="col-row__img" title="Картинка коллекции">
                {col.image ? (
                  <img src={imageUrl(col.image)} alt="" />
                ) : (
                  <span className="col-row__img-plus">+</span>
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="col-row__img-input"
                  onChange={(e) => handleColImageSelect(e, col)}
                />
              </label>
              {col.image && (
                <button
                  type="button"
                  className="col-row__img-clear"
                  onClick={() => setCollectionImage(col, null)}
                  aria-label="Убрать картинку"
                >
                  ×
                </button>
              )}
              <input
                className="modal__input"
                type="text"
                value={colDrafts[col.id] ?? ''}
                onChange={(e) => setColDrafts({ ...colDrafts, [col.id]: e.target.value })}
              />
              <button
                className="btn btn--outline"
                type="button"
                disabled={(colDrafts[col.id] ?? '').trim() === col.name || !(colDrafts[col.id] ?? '').trim()}
                onClick={() => saveCollectionName(col)}
              >
                Сохранить
              </button>
              <button
                className="btn btn--outline admin-btn--danger"
                type="button"
                onClick={() => removeCollection(col)}
              >
                Уд.
              </button>
            </div>
          ))}

          <div className="col-row col-row--new">
            <input
              className="modal__input"
              type="text"
              placeholder="Новая коллекция"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCollection()
              }}
            />
            <button className="btn btn--dark" type="button" disabled={!newColName.trim()} onClick={addCollection}>
              Добавить
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
