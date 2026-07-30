// Номера заказов, оформленных без входа в аккаунт.
// У гостя нет профиля, а письма с номером мы пока не шлём — если он закроет
// вкладку после оплаты, заказ будет не найти. Держим номера на его устройстве,
// чтобы страница отслеживания могла их подсказать.
// Это только подсказка: сами заказы всегда лежат на сервере.

const KEY = 'lobotomy_guest_orders'
const LIMIT = 20

export function getGuestOrders() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY))
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/** Запоминает номер заказа. Свежие — первыми, дубликаты не копятся. */
export function rememberGuestOrder(number) {
  if (!number) return
  const list = [number, ...getGuestOrders().filter((n) => n !== number)].slice(0, LIMIT)
  localStorage.setItem(KEY, JSON.stringify(list))
}
