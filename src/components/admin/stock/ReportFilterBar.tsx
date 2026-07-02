'use client'

interface PeriodFilterProps {
  from: string
  to: string
  onFromChange: (v: string) => void
  onToChange: (v: string) => void
}

export function PeriodFilter({
  from,
  to,
  onFromChange,
  onToChange,
}: PeriodFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <label className="text-sm text-dental-text">Від</label>
      <input
        type="date"
        value={from}
        onChange={e => onFromChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
      />
      <label className="text-sm text-dental-text">До</label>
      <input
        type="date"
        value={to}
        onChange={e => onToChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600"
      />
    </div>
  )
}

interface SelectFilterProps {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (v: string) => void
}

export function SelectFilter({
  label,
  value,
  options,
  onChange,
}: SelectFilterProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-dental-text shrink-0">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-hidden focus:ring-2 focus:ring-dental-primary-600 bg-white"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
