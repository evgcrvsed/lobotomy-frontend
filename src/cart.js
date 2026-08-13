// Корзина в localStorage. Позиция: товар + размер.
// Об изменениях сообщает событием 'cart-changed' (для счётчика в шапке).
const CART_KEY = 'lobotomy_cart'

// Совпадает с ограничением схемы заказа на бэкенде (qty: le=100). Без потолка
// здесь кнопка «+» доводила корзину до количества, которое сервер отвергает
// валидацией, — уже на этапе оплаты и без внятного объяснения
export const MAX_QTY = 100

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) ?? []
  } catch {
    return []
  }
}

function save(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-changed'))
}

export function addToCart({ productId, slug, name, price, size, qty = 1, image }) {
  const items = getCart()
  const existing = items.find((i) => i.productId === productId && i.size === size)
  if (existing) {
    existing.qty = Math.min(MAX_QTY, existing.qty + qty)
  } else {
    items.push({ productId, slug, name, price, size, qty, image })
  }
  save(items)
}

export function removeFromCart(productId, size) {
  save(getCart().filter((i) => !(i.productId === productId && i.size === size)))
}

export function setCartQty(productId, size, qty) {
  const items = getCart()
  const item = items.find((i) => i.productId === productId && i.size === size)
  if (!item) return
  item.qty = Math.min(MAX_QTY, Math.max(1, qty))
  save(items)
}

export function changeCartSize(productId, oldSize, newSize) {
  if (oldSize === newSize) return
  const items = getCart()
  const item = items.find((i) => i.productId === productId && i.size === oldSize)
  if (!item) return

  const target = items.find((i) => i.productId === productId && i.size === newSize)
  if (target) {
    // такой размер уже лежит в корзине — склеиваем позиции
    target.qty = Math.min(MAX_QTY, target.qty + item.qty)
    save(items.filter((i) => i !== item))
  } else {
    item.size = newSize
    save(items)
  }
}

export function clearCart() {
  save([])
}

export function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0)
}
