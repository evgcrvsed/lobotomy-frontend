// Единый источник правды по подписям и формату цены.
// Способы доставки живут в БД и грузятся с /api/delivery.

/** Из списка методов -> { code: label } */
export const deliveryLabels = (methods) =>
  Object.fromEntries(methods.map((m) => [m.code, m.label]))

/** Подписи полей адреса для выбранного способа */
export const deliveryTexts = (methods, code) => {
  const m = methods.find((x) => x.code === code)
  return { index: m?.index_label ?? 'Индекс', point: m?.point_label ?? 'Адрес' }
}

// После «Отправлен» статус ведёт СДЭК: см. backend/services/cdek_sync.py
export const ORDER_STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'В работе',
  shipped: 'Отправлен',
  ready: 'Готов к выдаче',
  delivered: 'Вручён',
  cancelled: 'Отменён',
}

// Откуда пришёл посетитель. Ключи и порядок — те же, что в SOURCE_RULES
// в backend/services/visit_service.py.
//
// Порядок здесь задаёт и порядок секторов на диаграмме. Он неизменный, а не
// «по убыванию»: цвета проверены на различимость (в том числе при дальтонизме)
// именно для соседей в этом порядке, и при смене периода сектора не
// перекрашиваются — два отчёта можно сравнить глазами.
//
// Прямые заходы и «Другое» — серые: это не площадки, а «неизвестно откуда»,
// и цветного места они занимать не должны.
export const TRAFFIC_SOURCES = [
  { key: 'vk', label: 'ВКонтакте', color: '#2a78d6' },
  { key: 'telegram', label: 'Telegram', color: '#eb6834' },
  { key: 'instagram', label: 'Instagram', color: '#1baf7a' },
  { key: 'youtube', label: 'YouTube', color: '#eda100' },
  { key: 'tiktok', label: 'TikTok', color: '#e87ba4' },
  { key: 'pinterest', label: 'Pinterest', color: '#008300' },
  { key: 'google', label: 'Google', color: '#4a3aa7' },
  { key: 'yandex', label: 'Яндекс', color: '#e34948' },
  { key: 'direct', label: 'Прямые заходы', color: '#4a4a4a' },
  { key: 'other', label: 'Другое', color: '#b0b0b0' },
]

/** Дата и время в едином формате: 29.07.2026, 11:14 */
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Цена в едином формате: 5 500 ₽ */
export function formatPrice(value) {
  return `${Number(value).toLocaleString('ru-RU')} ₽`
}

/** Русское склонение: plural(2, 'изделие', 'изделия', 'изделий') */
export function plural(n, one, few, many) {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}
