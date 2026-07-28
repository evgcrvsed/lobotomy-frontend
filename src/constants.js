// Общие константы и хелперы витрины.
// Здесь единый источник правды: цены доставки, подписи, формат цены.
// Раньше это дублировалось в CheckoutPage / OrderPage / OrderView.

export const DELIVERY_OPTIONS = [
  { id: 'cdek', label: 'СДЭК', price: 450 },
  { id: 'post', label: 'Почта России', price: 350 },
  { id: 'cis', label: 'Страны СНГ', price: 750 },
]

export const DELIVERY_LABELS = Object.fromEntries(DELIVERY_OPTIONS.map((d) => [d.id, d.label]))

// Подписи полей адреса меняются вместе со способом доставки
export const DELIVERY_TEXTS = {
  cdek: { index: 'Индекс СДЭК', point: 'Адрес пункта СДЭК' },
  post: { index: 'Индекс Почты России', point: 'Адрес отделения Почты России' },
  cis: { index: 'Индекс', point: 'Адрес' },
}

export const ORDER_STATUS_LABELS = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  shipped: 'Отправлен',
  cancelled: 'Отменён',
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
