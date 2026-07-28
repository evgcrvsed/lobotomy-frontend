// Общие константы и хелперы витрины.
// Здесь единый источник правды: цены доставки, подписи, формат цены.
// Раньше это дублировалось в CheckoutPage / OrderPage / OrderView.

// Способы доставки живут в БД и грузятся с /api/delivery.
// Хелперы ниже собирают из них то, что раньше лежало захардкоженным.

/** Из списка методов -> { code: label } */
export const deliveryLabels = (methods) =>
  Object.fromEntries(methods.map((m) => [m.code, m.label]))

/** Подписи полей адреса для выбранного способа */
export const deliveryTexts = (methods, code) => {
  const m = methods.find((x) => x.code === code)
  return { index: m?.index_label ?? 'Индекс', point: m?.point_label ?? 'Адрес' }
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
