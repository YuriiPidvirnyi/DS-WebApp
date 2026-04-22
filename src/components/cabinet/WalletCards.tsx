'use client'

import { useState } from 'react'
import { CreditCard, Trash2 } from 'lucide-react'

export interface WalletCard {
  id: string
  card_token: string
  masked_pan: string
  country?: string | null
  created_at: string
}

interface Props {
  initialCards: WalletCard[]
}

export function WalletCards({ initialCards }: Props) {
  const [cards, setCards] = useState<WalletCard[]>(initialCards)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(cardToken: string) {
    setDeleting(cardToken)
    setError(null)
    try {
      const res = await fetch(
        `/api/payments/wallet?cardToken=${encodeURIComponent(cardToken)}`,
        { method: 'DELETE' }
      )
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? 'Не вдалося видалити картку')
        return
      }
      setCards(prev => prev.filter(c => c.card_token !== cardToken))
    } catch {
      setError('Не вдалося видалити картку')
    } finally {
      setDeleting(null)
    }
  }

  if (cards.length === 0) return null

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-dental-dark mb-3">
        Збережені картки
      </h2>
      <div className="bg-white rounded-2xl shadow-sm border border-dental-secondary-100 divide-y divide-dental-secondary-100">
        {cards.map(card => (
          <div
            key={card.id}
            className="flex items-center justify-between px-5 py-4 gap-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CreditCard className="w-5 h-5 text-dental-primary-600 shrink-0" />
              <span className="font-mono text-sm text-dental-dark truncate">
                {card.masked_pan !== 'unknown'
                  ? card.masked_pan
                  : '•••• •••• •••• ••••'}
              </span>
            </div>
            <button
              onClick={() => handleDelete(card.card_token)}
              disabled={deleting === card.card_token}
              aria-label="Видалити картку"
              className="shrink-0 p-2 rounded-lg text-dental-muted hover:text-red-600 hover:bg-red-50 disabled:opacity-40 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  )
}
