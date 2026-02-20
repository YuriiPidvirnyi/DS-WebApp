'use client'

import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Building2, Plus, Trash2 } from 'lucide-react'
import { Button, Input, Select } from '@/components/ui'
import {
  getPaymentMethods,
  addPaymentMethod,
  processPayment,
  deletePaymentMethod,
} from '@/services/billing'
import { withToast } from '@/utils/toast'
import type { PaymentMethod } from '@/types'

export default function PaymentPortal({
  patientId,
  amount,
  onSuccess,
}: {
  patientId: string
  amount: number
  onSuccess?: () => void
}) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [selectedMethod, setSelectedMethod] = useState<string>('')
  const [adding, setAdding] = useState(false)
  const [processing, setProcessing] = useState(false)

  const loadMethods = useCallback(async () => {
    const res = await getPaymentMethods(patientId)
    if (res.success && res.data) {
      setMethods(res.data)
      if (res.data.length > 0) {
        setSelectedMethod(
          res.data.find((m: PaymentMethod) => m.isDefault)?.id || res.data[0].id
        )
      }
    }
  }, [patientId])

  useEffect(() => {
    loadMethods()
  }, [loadMethods])

  const handlePayment = async () => {
    if (!selectedMethod) return

    setProcessing(true)
    await withToast(async () => {
      const res = await processPayment({
        patientId,
        amount,
        paymentMethodId: selectedMethod,
        description: 'Оплата послуг',
      })
      if (res.success) {
        onSuccess?.()
      }
    }, {})
    setProcessing(false)
  }

  const handleDelete = async (methodId: string) => {
    await withToast(async () => {
      await deletePaymentMethod(patientId, methodId)
      await loadMethods()
    }, {})
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Оплата</h2>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-gray-600">До сплати</p>
        <p className="text-3xl font-bold text-blue-900">
          {amount.toFixed(2)} грн
        </p>
      </div>

      {methods.length > 0 && !adding ? (
        <div className="space-y-4">
          <h3 className="font-semibold">Виберіть спосіб оплати</h3>
          {methods.map(method => (
            <label
              key={method.id}
              className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="payment-method"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={e => setSelectedMethod(e.target.value)}
              />
              {method.type === 'card' ? (
                <CreditCard className="w-6 h-6 text-gray-600" />
              ) : (
                <Building2 className="w-6 h-6 text-gray-600" />
              )}
              <div className="flex-1">
                <p className="font-medium">
                  {method.type === 'card'
                    ? `${method.cardBrand?.toUpperCase()} •••• ${method.cardLast4}`
                    : `${method.bankName} •••• ${method.accountLast4}`}
                </p>
                {method.isDefault && (
                  <span className="text-sm text-green-600">
                    За замовчуванням
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={e => {
                  e.preventDefault()
                  handleDelete(method.id)
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </label>
          ))}

          <button
            onClick={() => setAdding(true)}
            className="w-full p-4 border-2 border-dashed rounded-lg text-gray-600 hover:border-dental-teal hover:text-dental-teal"
          >
            <Plus className="w-6 h-6 inline mr-2" />
            Додати спосіб оплати
          </button>

          <Button
            onClick={handlePayment}
            isLoading={processing}
            disabled={!selectedMethod}
            size="lg"
            fullWidth
          >
            Оплатити {amount.toFixed(2)} грн
          </Button>
        </div>
      ) : (
        <AddPaymentMethodForm
          patientId={patientId}
          onAdded={() => {
            setAdding(false)
            loadMethods()
          }}
          onCancel={() => setAdding(false)}
        />
      )}
    </div>
  )
}

function AddPaymentMethodForm({
  patientId,
  onAdded,
  onCancel,
}: {
  patientId: string
  onAdded: () => void
  onCancel: () => void
}) {
  const [type, setType] = useState<'card' | 'bank'>('card')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const method =
      type === 'card'
        ? {
            type: 'card' as const,
            isDefault: false,
            cardLast4: formData.get('cardNumber')?.toString().slice(-4) || '',
            cardBrand: 'visa' as const,
            cardExpiry: formData.get('expiry')?.toString() || '',
            createdAt: new Date(),
          }
        : {
            type: 'bank' as const,
            isDefault: false,
            bankName: formData.get('bankName')?.toString() || '',
            accountLast4:
              formData.get('accountNumber')?.toString().slice(-4) || '',
            createdAt: new Date(),
          }

    setSubmitting(true)
    await withToast(async () => {
      await addPaymentMethod(patientId, method)
      onAdded()
    }, {})
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Select
        label="Тип"
        value={type}
        onChange={e => setType(e.target.value as 'card' | 'bank')}
      >
        <option value="card">Банківська картка</option>
        <option value="bank">Банківський рахунок</option>
      </Select>

      {type === 'card' ? (
        <>
          <Input
            label="Номер картки"
            name="cardNumber"
            placeholder="1234 5678 9012 3456"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Термін дії"
              name="expiry"
              placeholder="MM/YY"
              required
            />
            <Input
              label="CVV"
              name="cvv"
              type="password"
              placeholder="123"
              maxLength={3}
              required
            />
          </div>
        </>
      ) : (
        <>
          <Input label="Назва банку" name="bankName" required />
          <Input label="Номер рахунку" name="accountNumber" required />
        </>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} fullWidth>
          Скасувати
        </Button>
        <Button type="submit" isLoading={submitting} fullWidth>
          Додати
        </Button>
      </div>
    </form>
  )
}
