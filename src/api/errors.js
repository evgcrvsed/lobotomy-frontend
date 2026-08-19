// Разбор тела ошибки от бэкенда в текст для человека.
//
// У HTTPException `detail` — строка, а у ошибки валидации (422) — список объектов
// { type, loc, msg, input, ctx }, по одному на каждое непрошедшее поле. Раньше этот
// список приклеивали к строке через + и получали «[object Object]», а на страницах,
// где detail уходил прямо в JSX (вход, отслеживание), он ронял всю страницу:
// «Objects are not valid as a React child».
//
// Бэкенд добавляет к ответу request_id — короткий код обращения. Дописываем его
// к тексту: человеку достаточно назвать код, чтобы ошибку нашли в логе сервера.

const FIELD_LABELS = {
  email: 'Почта',
  full_name: 'ФИО',
  phone: 'Телефон',
  delivery_method: 'Способ доставки',
  country: 'Страна',
  city: 'Город',
  address: 'Адрес',
  postal_code: 'Индекс',
  pickup_point: 'Пункт выдачи',
  items: 'Состав заказа',
  new_items: 'Добавленные позиции',
  product_id: 'Товар',
  size: 'Размер',
  qty: 'Количество',
  price: 'Цена',
  code: 'Код',
  discount_percent: 'Скидка',
  max_activations: 'Количество активаций',
  expires_at: 'Срок годности',
  name: 'Название',
  slug: 'Адрес страницы',
  tracking_number: 'Трек-номер',
  note: 'Комментарий',
  value: 'Значение',
}

/** Имя поля из loc: ["body","items",0,"product_id"] → «Товар (позиция 1)». */
function fieldLabel(loc) {
  // первый элемент — источник (body / query / path / header), человеку он не нужен
  const path = Array.isArray(loc) ? loc.slice(1) : []
  const names = path.filter((part) => typeof part === 'string')
  const index = path.find((part) => typeof part === 'number')
  const last = names[names.length - 1]
  if (!last) return 'Запрос'

  const label = FIELD_LABELS[last] ?? last
  return index === undefined ? label : `${label} (позиция ${index + 1})`
}

/** Причина отказа по машинному коду Pydantic: msg приходит английским текстом. */
function reasonText(item) {
  const ctx = item.ctx ?? {}
  switch (item.type) {
    case 'missing':
      return 'не заполнено'
    case 'string_too_short':
      return ctx.min_length > 1 ? `минимум ${ctx.min_length} символов` : 'не заполнено'
    case 'string_too_long':
      return `максимум ${ctx.max_length} символов`
    case 'string_pattern_mismatch':
      // единственный шаблон в API — код промокода; расшифровку regex человеку не покажешь
      return 'недопустимые символы'
    case 'too_short':
      return ctx.min_length > 1 ? `минимум ${ctx.min_length} шт.` : 'пусто'
    case 'too_long':
      return `максимум ${ctx.max_length} шт.`
    case 'greater_than_equal':
      return `не меньше ${ctx.ge}`
    case 'less_than_equal':
      return `не больше ${ctx.le}`
    case 'int_parsing':
    case 'int_type':
      return 'должно быть целым числом'
    case 'value_error':
      // так приходит отказ EmailStr — английский текст покупателю ничего не объясняет
      return String(item.msg ?? '').includes('email') ? 'похоже на опечатку в адресе' : 'неверное значение'
    default:
      return item.msg ?? 'неверное значение'
  }
}

/** Текст ошибки из разобранного тела ответа. */
export function errorText(body, fallback = 'что-то пошло не так') {
  const detail = body?.detail
  let text = fallback

  if (typeof detail === 'string' && detail) {
    text = detail
  } else if (Array.isArray(detail) && detail.length) {
    text = detail.map((item) => `${fieldLabel(item.loc)} — ${reasonText(item)}`).join('; ')
  }

  // код обращения нужен только когда причина непонятна: к «Заказ не найден» он лишний
  return body?.request_id && text === fallback ? `${text} (код обращения ${body.request_id})` : text
}

/** То же, но сразу из неудачного ответа: тело бывает и не JSON — например, 502 от прокси. */
export async function errorTextFrom(res, fallback) {
  const body = await res.json().catch(() => null)
  return errorText(body, fallback)
}
