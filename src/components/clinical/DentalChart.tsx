'use client'

import { useState } from 'react'
import type { ToothCondition } from '@/types'

const ADULT_TEETH = [
  // Upper right
  [18, 17, 16, 15, 14, 13, 12, 11],
  // Upper left
  [21, 22, 23, 24, 25, 26, 27, 28],
  // Lower left
  [38, 37, 36, 35, 34, 33, 32, 31],
  // Lower right
  [41, 42, 43, 44, 45, 46, 47, 48],
]

const CONDITION_COLORS = {
  healthy: '#10b981',
  caries: '#ef4444',
  filled: '#3b82f6',
  crown: '#f59e0b',
  missing: '#9ca3af',
  implant: '#8b5cf6',
}

interface DentalChartProps {
  teeth: ToothCondition[]
  onToothClick?: (toothNumber: number) => void
  editable?: boolean
}

export default function DentalChart({
  teeth,
  onToothClick,
  editable = false,
}: DentalChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)

  const getToothColor = (toothNumber: number) => {
    const tooth = teeth.find(t => t.toothNumber === toothNumber)
    if (!tooth) return '#fff'
    return CONDITION_COLORS[tooth.condition]
  }

  const handleToothClick = (toothNumber: number) => {
    if (editable) {
      setSelectedTooth(toothNumber)
      onToothClick?.(toothNumber)
    }
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-4">Стоматологічна карта</h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6 text-sm">
        {Object.entries(CONDITION_COLORS).map(([condition, color]) => (
          <div key={condition} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize">
              {condition === 'healthy' && 'Здоровий'}
              {condition === 'caries' && 'Карієс'}
              {condition === 'filled' && 'Пломба'}
              {condition === 'crown' && 'Коронка'}
              {condition === 'missing' && 'Відсутній'}
              {condition === 'implant' && 'Імплант'}
            </span>
          </div>
        ))}
      </div>

      {/* Dental Chart */}
      <div className="space-y-8">
        {/* Upper jaw */}
        <div className="border-b-2 border-gray-300 pb-4">
          <p className="text-xs text-gray-500 mb-2 text-center">
            Верхня щелепа
          </p>
          <div className="grid grid-cols-2 gap-8">
            {/* Upper right */}
            <div className="flex justify-end gap-2">
              {ADULT_TEETH[0].map(num => (
                <Tooth
                  key={num}
                  number={num}
                  color={getToothColor(num)}
                  selected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                  editable={editable}
                />
              ))}
            </div>
            {/* Upper left */}
            <div className="flex justify-start gap-2">
              {ADULT_TEETH[1].map(num => (
                <Tooth
                  key={num}
                  number={num}
                  color={getToothColor(num)}
                  selected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                  editable={editable}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Lower jaw */}
        <div className="pt-4">
          <div className="grid grid-cols-2 gap-8">
            {/* Lower right */}
            <div className="flex justify-end gap-2">
              {ADULT_TEETH[3].map(num => (
                <Tooth
                  key={num}
                  number={num}
                  color={getToothColor(num)}
                  selected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                  editable={editable}
                />
              ))}
            </div>
            {/* Lower left */}
            <div className="flex justify-start gap-2">
              {ADULT_TEETH[2].map(num => (
                <Tooth
                  key={num}
                  number={num}
                  color={getToothColor(num)}
                  selected={selectedTooth === num}
                  onClick={() => handleToothClick(num)}
                  editable={editable}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">Нижня щелепа</p>
        </div>
      </div>

      {/* Tooth details */}
      {selectedTooth && (
        <ToothDetails
          tooth={teeth.find(t => t.toothNumber === selectedTooth)}
          onClose={() => setSelectedTooth(null)}
        />
      )}
    </div>
  )
}

function Tooth({
  number,
  color,
  selected,
  onClick,
  editable,
}: {
  number: number
  color: string
  selected: boolean
  onClick: () => void
  editable: boolean
}) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={onClick}
        disabled={!editable}
        className={`
          w-10 h-12 rounded-lg border-2 transition-all
          ${selected ? 'border-dental-teal ring-2 ring-dental-teal' : 'border-gray-300'}
          ${editable ? 'cursor-pointer hover:scale-110' : 'cursor-default'}
        `}
        style={{ backgroundColor: color }}
        title={`Зуб ${number}`}
      />
      <span className="text-xs text-gray-600 mt-1">{number}</span>
    </div>
  )
}

function ToothDetails({
  tooth,
  onClose,
}: {
  tooth?: ToothCondition
  onClose: () => void
}) {
  if (!tooth) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-md w-full m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold">Зуб #{tooth.toothNumber}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Стан</p>
            <p className="font-medium capitalize">{tooth.condition}</p>
          </div>

          {tooth.restorations.length > 0 && (
            <div>
              <p className="text-sm text-gray-500">Реставрації</p>
              <p className="font-medium">{tooth.restorations.join(', ')}</p>
            </div>
          )}

          {tooth.surfaces && (
            <div>
              <p className="text-sm text-gray-500">Поверхні</p>
              <div className="flex gap-2 mt-1">
                {Object.entries(tooth.surfaces).map(
                  ([surface, value]) =>
                    value && (
                      <span
                        key={surface}
                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                      >
                        {surface.toUpperCase()}
                      </span>
                    )
                )}
              </div>
            </div>
          )}

          {tooth.notes && (
            <div>
              <p className="text-sm text-gray-500">Примітки</p>
              <p className="text-sm">{tooth.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
