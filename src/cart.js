// Корзина в localStorage. Позиция: товар + размер.
// Об изменениях сообщает событием 'cart-changed' (для счётчика в шапке).
const CART_KEY = 'lobotomy_cart'

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
    existing.qty += qty
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
  item.qty = Math.max(1, qty)
  save(items)
}

export function clearCart() {
  save([])
}

export function cartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0)
}
