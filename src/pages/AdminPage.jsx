import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, imageUrl } from '../api/client'
import { formatPrice } from '../constants'
import Modal from '../components/Modal'
import '../styles/components/modal.css'
import '../styles/pages/admin.css'

// Столбцы размерной сетки задаются у каждого товара свои — это лишь заготовка
// для нового изделия, её можно переименовать, дополнить или снести целиком.
const DEFAULT_SIZE_COLUMNS = ['Длина', 'Плечо', 'Грудь', 'Рукав']
// Совпадает с ограничениями в backend/schemas/product.py — иначе форма
// упрётся в 422 или бэкенд молча обрежет введённое
const MAX_SIZE_COLUMNS = 8
const MAX_COLUMN_NAME = 50
const MAX_MEASUREMENT = 50
const MAX_SIZE_LABEL = 10

// values — замеры по индексам столбцов, а не по названиям: так переименование
// столбца не теряет уже введённые значения
const emptySizeRow = (label = '') => ({ label, values: [] })
const defaultSizes = () => ['S', 'M', 'L', 'XL'].map((label) => emptySizeRow(label))

// Подписи к настройкам витрины. Ключи должны совпадать с KNOWN_SETTINGS
// в backend/services/settings_service.py
const SETTING_FIELDS = [
  {
    key: 'profile_greeting',
    label: 'Приветствие в профиле',
    hint: 'Крупная надпись сверху на странице профиля. Пусто — вернётся «? ? ?».',
  },
]

const EMPTY_FORM = {
  collectionId: '',
  name: '',
  slug: '',
  description: '',
  material: '',
  density: '',
  price: '',
  sortOrder: '',
  imageMain: null,
  imageHover: null,
  imageSizechart: null,
  gallery: [],
  sizeColumns: [],
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

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false)
  const [deliveryDrafts, setDeliveryDrafts] = useState([])
  const [savingDelivery, setSavingDelivery] = useState(null)

  const [textsModalOpen, setTextsModalOpen] = useState(false)
  const [settingDrafts, setSettingDrafts] = useState({})
  const [savedSetting, setSavedSetting] = useState(null)
  const [savingSetting, setSavingSetting] = useState(null)

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

  async function openDeliveryModal() {
    setDeliveryDrafts(await api.getDeliveryMethods())
    setDeliveryModalOpen(true)
  }

  function editDelivery(code, field, value) {
    setDeliveryDrafts((list) => list.map((m) => (m.code === code ? { ...m, [field]: value } : m)))
  }

  async function saveDelivery(method) {
    setSavingDelivery(method.code)
    try {
      const res = await api.updateDeliveryMethod(method.code, {
        label: method.label,
        price: parseInt(method.price, 10) || 0,
        index_label: method.index_label,
        point_label: method.point_label,
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось сохранить: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      const updated = await res.json()
      setDeliveryDrafts((list) => list.map((m) => (m.code === updated.code ? updated : m)))
    } finally {
      setSavingDelivery(null)
    }
  }

  async function openTextsModal() {
    setSettingDrafts(await api.getSettings())
    setTextsModalOpen(true)
  }

  async function saveSetting(key) {
    setSavingSetting(key)
    try {
      const res = await api.updateSetting(key, settingDrafts[key] ?? '')
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert('Не удалось сохранить: ' + (err.detail ?? 'что-то пошло не так'))
        return
      }
      // бэкенд возвращает все настройки: пустое поле он заменяет значением по умолчанию
      setSettingDrafts(await res.json())
      setSavedSetting(key)
      setTimeout(() => setSavedSetting(null), 1800)
    } finally {
      setSavingSetting(null)
    }
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

  /** Чья картинка стоит сверху на главной. Выбранная всегда одна — бэкенд снимает флаг с остальных. */
  async function setHeroCollection(col) {
    const res = await api.updateCollection(col.id, { name: col.name, image: col.image, is_hero: true })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      alert('Не удалось выбрать главную картинку: ' + (err.detail ?? 'что-то пошло не так'))
      return
    }
    await reloadCollections()
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

  // порядок задаёт бэкенд, но сортируем и здесь — чтобы список перестроился
  // сразу после сохранения, а не только после перезагрузки
  const filteredProducts = (
    activeCollectionId !== null ? products.filter((p) => p.collection_id === activeCollectionId) : products
  )
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)

  function openCreateModal() {
    setCurrentProductId(null)
    setForm({
      ...EMPTY_FORM,
      collectionId: collections[0]?.id ?? '',
      sizeColumns: [...DEFAULT_SIZE_COLUMNS],
      sizes: defaultSizes(),
    })
    setModalOpen(true)
  }

  async function openEditModal(productId) {
    const product = await api.getProduct(productId)
    if (!product) return

    // у товара без размеров шапки тоже нет — подставляем заготовку,
    // чтобы не начинать с пустой сетки
    const sizeColumns = product.sizes.length ? (product.size_columns ?? []) : [...DEFAULT_SIZE_COLUMNS]

    setCurrentProductId(productId)
    setForm({
      collectionId: product.collection_id,
      name: product.name,
      slug: product.slug ?? '',
      description: product.description ?? '',
      material: product.material ?? '',
      density: product.density ?? '',
      price: product.price,
      sortOrder: String(product.sort_order ?? ''),
      imageMain: product.images.find((i) => i.role === 'main')?.filename ?? null,
      imageHover: product.images.find((i) => i.role === 'hover')?.filename ?? null,
      imageSizechart: product.images.find((i) => i.role === 'sizechart')?.filename ?? null,
      gallery: product.images
        .filter((i) => i.role === 'gallery')
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((i) => i.filename),
      sizeColumns,
      sizes: product.sizes.length
        ? product.sizes.map((s) => ({
            label: s.label,
            values: sizeColumns.map((column) => s.measurements?.[column] ?? ''),
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

  function updateSizeLabel(index, value) {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((row, i) => (i === index ? { ...row, label: value } : row)),
    }))
  }

  function updateSizeValue(rowIndex, columnIndex, value) {
    setForm((f) => ({
      ...f,
      sizes: f.sizes.map((row, i) => {
        if (i !== rowIndex) return row
        const values = [...row.values]
        // строка короче шапки, если столбец добавили уже после неё
        while (values.length <= columnIndex) values.push('')
        values[columnIndex] = value
        return { ...row, values }
      }),
    }))
  }

  function addSizeRow() {
    setForm((f) => ({ ...f, sizes: [...f.sizes, emptySizeRow()] }))
  }

  function removeSizeRow(index) {
    setForm((f) => ({ ...f, sizes: f.sizes.filter((_, i) => i !== index) }))
  }

  function updateSizeColumn(index, value) {
    setForm((f) => ({
      ...f,
      sizeColumns: f.sizeColumns.map((name, i) => (i === index ? value : name)),
    }))
  }

  function addSizeColumn() {
    setForm((f) => ({ ...f, sizeColumns: [...f.sizeColumns, ''] }))
  }

  function removeSizeColumn(index) {
    // вместе со столбцом уходят замеры под ним — иначе значения съедут влево
    setForm((f) => ({
      ...f,
      sizeColumns: f.sizeColumns.filter((_, i) => i !== index),
      sizes: f.sizes.map((row) => ({ ...row, values: row.values.filter((_, i) => i !== index) })),
    }))
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
    if (form.imageSizechart) {
      images.push({ filename: form.imageSizechart, role: 'sizechart', sort_order: 99 })
    }

    // столбцы без названия не сохраняем — вместе со значениями под ними
    const columns = form.sizeColumns
      .map((name, index) => ({ name: name.trim(), index }))
      .filter((column) => column.name)
    const valueAt = (row, index) => (row.values[index] ?? '').trim()

    // имя столбца — это ключ замера: по двум одинаковым бэкенд не различит клетки
    // и молча оставит один столбец вместе со значениями последнего
    const names = columns.map((c) => c.name)
    if (new Set(names).size !== names.length) {
      alert('Два столбца размерной сетки названы одинаково — переименуйте один из них')
      return
    }

    // строки, где не заполнен ни один замер, не сохраняем; если столбцов нет
    // вовсе — хватает одной подписи, она нужна для выбора размера в карточке
    const sizes = form.sizes
      .filter(
        (row) =>
          row.label.trim() && (columns.length === 0 || columns.some((c) => valueAt(row, c.index)))
      )
      .map((row) => ({
        label: row.label.trim(),
        measurements: Object.fromEntries(
          columns.map((c) => [c.name, valueAt(row, c.index)]).filter(([, value]) => value)
        ),
      }))

    const data = {
      collection_id: parseInt(form.collectionId, 10),
      name: form.name.trim(),
      slug: form.slug.trim() || null,
      description: form.description.trim() || null,
      material: form.material.trim() || null,
      density: form.density ? parseInt(form.density, 10) : null,
      price: parseInt(form.price, 10),
      // пусто — бэкенд поставит товар в конец каталога
      sort_order: form.sortOrder.trim() === '' ? null : parseInt(form.sortOrder, 10),
      images,
      size_columns: columns.map((c) => c.name),
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
            <Link to="/admin/orders" className="btn btn--outline">
              Заказы
            </Link>
            <Link to="/admin/stats" className="btn btn--outline">
              Статы
            </Link>
            <Link to="/admin/traffic" className="btn btn--outline">
              Трафик
            </Link>
            <button className="btn btn--outline" onClick={openDeliveryModal}>
              Доставка
            </button>
            <button className="btn btn--outline" onClick={openTextsModal}>
              Тексты
            </button>
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
                  <span className="admin-row__order" title="Порядок в каталоге">
                    {product.sort_order}
                  </span>
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
                  <div className="admin-row__price">{formatPrice(product.price)}</div>
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

          <div className="modal__row">
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
            <div className="modal__field">
              <label className="modal__label" htmlFor="field-sort">
                Порядок в каталоге
              </label>
              <input
                className="modal__input"
                type="number"
                id="field-sort"
                placeholder="в конец"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              />
              <span className="modal__hint">
                Меньше — выше в каталоге. Просто давай тут каждому товару его номер по какому порядку он покажется и всё
              </span>
            </div>
          </div>

          <div className="modal__row modal__row--triple">
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
            <ImageUploadSlot
              id="field-image-sizechart"
              label="Размерная сетка"
              filename={form.imageSizechart}
              uploading={uploadingField === 'imageSizechart'}
              onSelect={(e) => handleFileSelect(e, 'imageSizechart')}
              onClear={() => setForm({ ...form, imageSizechart: null })}
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
            <span className="modal__label">Размерная сетка</span>
            <p className="admin-media__hint">
              Столбцы и значения — свободный текст. К голому числу карточка сама допишет
              «cm», всё остальное («46-48», «one size») покажет как есть.
              Пустые клетки в карточку не попадут.
            </p>
            {/* число столбцов задаёт сетку строк — см. --size-cols в admin.css */}
            <div
              className={`size-table${form.sizeColumns.length === 0 ? ' size-table--bare' : ''}`}
              style={{ '--size-cols': form.sizeColumns.length }}
            >
              <div className="size-table__row size-table__row--head">
                <span>Размер</span>
                {form.sizeColumns.map((name, c) => (
                  <div className="size-table__column-head" key={c}>
                    <input
                      className="modal__input"
                      type="text"
                      placeholder="Замер"
                      maxLength={MAX_COLUMN_NAME}
                      value={name}
                      onChange={(e) => updateSizeColumn(c, e.target.value)}
                    />
                    <button
                      type="button"
                      className="size-table__remove"
                      onClick={() => removeSizeColumn(c)}
                      aria-label={`Убрать столбец «${name || 'без названия'}»`}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <span />
              </div>
              {form.sizes.map((row, i) => (
                <div className="size-table__row" key={i}>
                  <input
                    className="modal__input"
                    type="text"
                    placeholder="S"
                    maxLength={MAX_SIZE_LABEL}
                    value={row.label}
                    onChange={(e) => updateSizeLabel(i, e.target.value)}
                  />
                  {form.sizeColumns.map((_, c) => (
                    <input
                      key={c}
                      className="modal__input"
                      type="text"
                      placeholder="—"
                      maxLength={MAX_MEASUREMENT}
                      value={row.values[c] ?? ''}
                      onChange={(e) => updateSizeValue(i, c, e.target.value)}
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
              <div className="size-table__buttons">
                <button type="button" className="btn btn--outline size-table__add" onClick={addSizeRow}>
                  + Добавить размер
                </button>
                <button
                  type="button"
                  className="btn btn--outline size-table__add"
                  onClick={addSizeColumn}
                  disabled={form.sizeColumns.length >= MAX_SIZE_COLUMNS}
                >
                  + Добавить столбец
                </button>
              </div>
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

      <Modal
        open={deliveryModalOpen}
        titleId="delivery-modal-title"
        title="Способы доставки"
        onClose={() => setDeliveryModalOpen(false)}
      >
        <div className="modal__form">
          <p className="admin-media__hint">
            Стоимость и подписи полей на странице оформления. Меняется сразу для новых заказов —
            в уже оформленных остаётся та цена, что была на момент покупки.
          </p>
          {deliveryDrafts.map((m) => (
            <div className="delivery-row" key={m.code}>
              <div className="delivery-row__main">
                <input
                  className="modal__input"
                  value={m.label}
                  aria-label="Название"
                  onChange={(e) => editDelivery(m.code, 'label', e.target.value)}
                />
                <input
                  className="modal__input delivery-row__price"
                  type="number"
                  min="0"
                  value={m.price}
                  aria-label="Стоимость"
                  onChange={(e) => editDelivery(m.code, 'price', e.target.value)}
                />
                <button
                  className="btn btn--dark"
                  type="button"
                  disabled={savingDelivery === m.code}
                  onClick={() => saveDelivery(m)}
                >
                  {savingDelivery === m.code ? '...' : 'Сохранить'}
                </button>
              </div>
              <div className="delivery-row__labels">
                <input
                  className="modal__input"
                  value={m.index_label}
                  aria-label="Подпись поля индекса"
                  onChange={(e) => editDelivery(m.code, 'index_label', e.target.value)}
                />
                <input
                  className="modal__input"
                  value={m.point_label}
                  aria-label="Подпись поля адреса"
                  onChange={(e) => editDelivery(m.code, 'point_label', e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={textsModalOpen}
        titleId="texts-modal-title"
        title="Тексты сайта"
        onClose={() => setTextsModalOpen(false)}
      >
        <div className="modal__form">
          {SETTING_FIELDS.map(({ key, label, hint }) => (
            <div className="modal__field" key={key}>
              <label className="modal__label" htmlFor={`setting-${key}`}>
                {label}
              </label>
              <div className="setting-row">
                <input
                  className="modal__input"
                  id={`setting-${key}`}
                  type="text"
                  value={settingDrafts[key] ?? ''}
                  onChange={(e) => setSettingDrafts({ ...settingDrafts, [key]: e.target.value })}
                />
                <button
                  className="btn btn--dark"
                  type="button"
                  disabled={savingSetting === key}
                  onClick={() => saveSetting(key)}
                >
                  {savingSetting === key ? '...' : savedSetting === key ? 'Сохранено ✓' : 'Сохранить'}
                </button>
              </div>
              <span className="modal__hint">{hint}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={colModalOpen} titleId="col-modal-title" title="Коллекции" onClose={() => setColModalOpen(false)}>
        <div className="modal__form">
          <p className="admin-media__hint">
            Картинка коллекции показывается сверху на страницах её товаров. Чтобы её установить - кликай по квадрату с плюсиком.
            Кружком слева выбирается, чья картинка стоит в самом верху главной страницы.
          </p>
          {collections.map((col) => (
            <div className="col-row" key={col.id}>
              <label
                className="col-row__hero"
                title={
                  col.image
                    ? 'Показывать эту картинку сверху на главной'
                    : 'Сначала загрузите картинку этой коллекции'
                }
              >
                <input
                  type="radio"
                  name="hero-collection"
                  className="col-row__hero-input"
                  checked={!!col.is_hero}
                  disabled={!col.image}
                  onChange={() => setHeroCollection(col)}
                />
                <span className="col-row__hero-dot" />
              </label>
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
