'use client'

import { useState } from 'react'
import {
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react'
import type { TreatmentPlan, TreatmentPhase } from '@/types'
import { Button } from '@/components/ui'

interface TreatmentPlanViewProps {
  plan: TreatmentPlan
  onAccept?: () => void
  onReject?: () => void
  showActions?: boolean
}

export default function TreatmentPlanView({
  plan,
  onAccept,
  onReject,
  showActions = false,
}: TreatmentPlanViewProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null)

  const completedProcedures = plan.phases
    .flatMap(p => p.procedures)
    .filter(pr => pr.completed).length
  const totalProcedures = plan.phases.flatMap(p => p.procedures).length
  const progress =
    totalProcedures > 0 ? (completedProcedures / totalProcedures) * 100 : 0

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    presented: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }

  const priorityColors = {
    urgent: 'text-red-600',
    recommended: 'text-yellow-600',
    optional: 'text-gray-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-dental-blue to-dental-teal p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold mb-2">{plan.title}</h2>
            {plan.description && (
              <p className="text-blue-100">{plan.description}</p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[plan.status]}`}
          >
            {plan.status === 'draft' && 'Чернетка'}
            {plan.status === 'presented' && 'Презентовано'}
            {plan.status === 'accepted' && 'Прийнято'}
            {plan.status === 'in-progress' && 'Виконується'}
            {plan.status === 'completed' && 'Завершено'}
            {plan.status === 'cancelled' && 'Скасовано'}
          </span>
        </div>

        {/* Key Info */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            <div>
              <p className="text-xs text-blue-100">Загальна вартість</p>
              <p className="text-lg font-bold">
                {plan.totalCost.toLocaleString()} грн
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <div>
              <p className="text-xs text-blue-100">Тривалість</p>
              <p className="text-lg font-bold">
                {plan.estimatedDuration} тижнів
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <div>
              <p className="text-xs text-blue-100">Фаз лікування</p>
              <p className="text-lg font-bold">{plan.phases.length}</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        {plan.status === 'in-progress' && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Прогрес</span>
              <span>
                {completedProcedures}/{totalProcedures} процедур
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Phases */}
      <div className="p-6">
        <div className="space-y-4">
          {plan.phases.map((phase, idx) => (
            <PhaseCard
              key={phase.id}
              phase={phase}
              phaseNumber={idx + 1}
              expanded={expandedPhase === phase.id}
              onToggle={() =>
                setExpandedPhase(expandedPhase === phase.id ? null : phase.id)
              }
            />
          ))}
        </div>

        {/* Priority Badge */}
        <div
          className={`mt-6 p-4 border-l-4 ${plan.priority === 'urgent' ? 'border-red-500 bg-red-50' : plan.priority === 'recommended' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-300 bg-gray-50'}`}
        >
          <p className={`font-semibold ${priorityColors[plan.priority]}`}>
            {plan.priority === 'urgent' && '⚠️ Термінове лікування'}
            {plan.priority === 'recommended' && '✓ Рекомендоване лікування'}
            {plan.priority === 'optional' && "ℹ️ Необов'язкове лікування"}
          </p>
        </div>

        {/* Actions */}
        {showActions && plan.status === 'presented' && (
          <div className="flex gap-3 mt-6">
            <Button onClick={onAccept} size="lg" fullWidth>
              ✓ Прийняти план лікування
            </Button>
            <Button onClick={onReject} variant="outline" size="lg" fullWidth>
              ✕ Відхилити
            </Button>
          </div>
        )}

        {/* Timeline */}
        <div className="mt-6 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>
              Створено: {new Date(plan.createdAt).toLocaleDateString('uk')}
            </span>
            {plan.presentedAt && (
              <span>
                Презентовано:{' '}
                {new Date(plan.presentedAt).toLocaleDateString('uk')}
              </span>
            )}
            {plan.acceptedAt && (
              <span>
                Прийнято: {new Date(plan.acceptedAt).toLocaleDateString('uk')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PhaseCard({
  phase,
  phaseNumber,
  expanded,
  onToggle,
}: {
  phase: TreatmentPhase
  phaseNumber: number
  expanded: boolean
  onToggle: () => void
}) {
  const completedCount = phase.procedures.filter(p => p.completed).length
  const phaseProgress =
    phase.procedures.length > 0
      ? (completedCount / phase.procedures.length) * 100
      : 0

  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${phase.status === 'completed' ? 'bg-green-500 text-white' : phase.status === 'in-progress' ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            {phaseNumber}
          </div>
          <div className="text-left">
            <h4 className="font-semibold">{phase.title}</h4>
            <p className="text-sm text-gray-600">
              {phase.procedures.length} процедур •{' '}
              {phase.estimatedCost.toLocaleString()} грн
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {phase.status === 'completed' && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          {phase.status === 'in-progress' && (
            <Clock className="w-5 h-5 text-yellow-600" />
          )}
          <span className="text-gray-400">{expanded ? '▼' : '▶'}</span>
        </div>
      </button>

      {expanded && (
        <div className="p-4 bg-gray-50 border-t">
          {phase.description && (
            <p className="text-sm text-gray-700 mb-4">{phase.description}</p>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Виконано</span>
              <span>
                {completedCount}/{phase.procedures.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-dental-teal h-2 rounded-full transition-all"
                style={{ width: `${phaseProgress}%` }}
              />
            </div>
          </div>

          {/* Procedures List */}
          <div className="space-y-2">
            {phase.procedures.map(proc => (
              <div
                key={proc.id}
                className="flex items-start gap-3 p-3 bg-white rounded border"
              >
                {proc.completed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{proc.name}</p>
                      <p className="text-xs text-gray-500">Код: {proc.code}</p>
                      {proc.toothNumbers && proc.toothNumbers.length > 0 && (
                        <p className="text-xs text-gray-500">
                          Зуби: {proc.toothNumbers.join(', ')}
                        </p>
                      )}
                      {proc.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {proc.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-dental-blue">
                        {proc.totalCost.toLocaleString()} грн
                      </p>
                      {proc.quantity > 1 && (
                        <p className="text-xs text-gray-500">
                          x{proc.quantity}
                        </p>
                      )}
                    </div>
                  </div>
                  {proc.completed && proc.completedDate && (
                    <p className="text-xs text-green-600 mt-1">
                      Виконано:{' '}
                      {new Date(proc.completedDate).toLocaleDateString('uk')}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Phase dates */}
          <div className="mt-4 flex justify-between text-xs text-gray-500">
            {phase.startDate && (
              <span>
                Початок: {new Date(phase.startDate).toLocaleDateString('uk')}
              </span>
            )}
            {phase.completedDate && (
              <span>
                Завершено:{' '}
                {new Date(phase.completedDate).toLocaleDateString('uk')}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
