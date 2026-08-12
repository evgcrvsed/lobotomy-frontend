import { useState } from 'react'

// Готовые промежутки отчётов. days — сколько дней захватываем, считая сегодняшний:
// «месяц» — это последние 30 дней, а не календарный август
export const PRESETS = [
  { id: 'week', label: 'Неделя', days: 7 },
  { id: 'month', label: 'Месяц', days: 30 },
  { id: 'quarter', label: 'Квартал', days: 90 },
  { id: 'halfyear', label: 'Полгода', days: 182 },
  { id: 'year', label: 'Год', days: 365 },
]
const DEFAULT_PRESET = 'month'

/** Дата в YYYY-MM-DD по местному времени — именно её ждёт бэкенд.
 *  toISOString() тут не годится: он переводит в UTC и вечером сдвигает день назад. */
export function toInputDate(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

/** «2026-08-12» -> Date на местную полночь. new Date(строка) разобрал бы её как UTC,
 *  и в минусовых поясах подпись уехала бы на день назад. */
export function parseDate(iso) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function rangeForPreset(days) {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (days - 1))
  return { from: toInputDate(from), to: toInputDate(to) }
}

/**
 * Выбранный промежуток отчёта — общий для всех страниц статистики, чтобы
 * «за месяц» везде означало одно и то же. Рисует его PeriodPicker.
 */
export default function usePeriod() {
  const [preset, setPreset] = useState(DEFAULT_PRESET)
  const [range, setRange] = useState(() => rangeForPreset(PRESETS.find((p) => p.id === DEFAULT_PRESET).days))

  function applyPreset(p) {
    setPreset(p.id)
    setRange(rangeForPreset(p.days))
  }

  function editRange(field, value) {
    if (!value) return // очищенное поле дат — промежуток остаётся прежним
    setPreset(null) // даты правили руками, готовый промежуток больше не выбран
    setRange((r) => ({ ...r, [field]: value }))
  }

  // конец раньше начала получается прямо во время правки поля — страницы
  // на это смотрят сами, чтобы не ходить с такими датами на бэкенд
  return { preset, range, applyPreset, editRange, invalid: range.from > range.to }
}
