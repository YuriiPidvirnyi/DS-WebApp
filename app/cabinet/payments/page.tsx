import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CabinetPaymentsPage, {
  type Payment,
} from '@/views/cabinet/CabinetPaymentsPage'
import { type WalletCard } from '@/components/cabinet/WalletCards'

// Server component: auth + data fetch only. All presentation (and its copy)
// lives in the CabinetPaymentsPage client view so it goes through i18n — the
// page itself carries no user-facing strings (Ф-2).
export default async function PaymentsPage() {
  const supabase = await createClient()

  if (!supabase) {
    redirect('/auth/login')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const [{ data: payments }, { data: walletCards }] = await Promise.all([
    supabase
      .from('payments')
      .select(
        'id, invoice_id, amount_kopecks, payment_mode, status, created_at, paid_at, appointments(appointment_date, appointment_time, services(name_uk, name_en, name_pl))'
      )
      .order('created_at', { ascending: false }),
    supabase
      .from('patient_wallet_cards')
      .select('id, card_token, masked_pan, country, created_at, last_used_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const list = (payments ?? []) as unknown as Payment[]
  const cards = (walletCards ?? []) as WalletCard[]

  return <CabinetPaymentsPage payments={list} cards={cards} />
}
