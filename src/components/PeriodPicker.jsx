import { PRESETS } from '../usePeriod'

/** Выбор промежутка отчёта: готовые кнопки плюс свои даты. Состояние — в usePeriod. */
export default function PeriodPicker({ period }) {
  const { preset, range, applyPreset, editRange } = period

  return (
    <>
      <div className="admin-filters">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            className={`admin-filter${preset === p.id ? ' admin-filter--active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="stats-range">
        <label className="stats-range__field">
          <span>С</span>
          <input
            type="date"
            className="modal__input"
            value={range.from}
            max={range.to}
            onChange={(e) => editRange('from', e.target.value)}
          />
        </label>
        <label className="stats-range__field">
          <span>По</span>
          <input
            type="date"
            className="modal__input"
            value={range.to}
            min={range.from}
            onChange={(e) => editRange('to', e.target.value)}
          />
        </label>
      </div>
    </>
  )
}
