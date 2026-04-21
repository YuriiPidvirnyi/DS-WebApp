import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { captureException } from '@/utils/sentry'
import { logger } from '@/utils/logger'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

const CRON_SECRET = process.env.CRON_SECRET ?? ''

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ServiceClient = ReturnType<typeof createClient<any, 'public', any>>

function getServiceClient(): ServiceClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

async function startCronRun(
  supabase: ServiceClient,
  name: string
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('cron_runs')
      .insert({ name, status: 'running' })
      .select('id')
      .single()
    return (data as { id: string } | null)?.id ?? null
  } catch {
    return null
  }
}

async function finishCronRun(
  supabase: ServiceClient,
  runId: string | null,
  processed: number,
  error?: string
): Promise<void> {
  if (!runId) return
  try {
    await supabase
      .from('cron_runs')
      .update({
        status: error ? 'error' : 'ok',
        finished_at: new Date().toISOString(),
        processed,
        ...(error ? { error } : {}),
      })
      .eq('id', runId)
  } catch {
    // non-blocking
  }
}

// A patient qualifies for recall if their last appointment ended ≥ 165 days ago
const RECALL_THRESHOLD_DAYS = 165
// Three-touch sequence: touch 2 sent 14 days after touch 1, touch 3 at 28 days
const TOUCH_2_DELAY_DAYS = 14
const TOUCH_3_DELAY_DAYS = 28
// Suppress recall for 30 days after touch 3 (prevents re-triggering the sequence)
const RECALL_COOLDOWN_DAYS = 30

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/**
 * GET /api/cron/recall
 * Runs daily at 18:10 UTC. Three-touch recall sequence for patients
 * whose last visit was ≥ 5.5 months ago with no upcoming appointment.
 *
 * Touch 1 — "Time for your check-up"       (triggered immediately)
 * Touch 2 — "We have open slots"            (14 days later, if no booking)
 * Touch 3 — "We miss you"                   (28 days later, if still no booking)
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const supabase = getServiceClient()
  if (!supabase) {
    return NextResponse.json({
      success: true,
      message: 'Supabase service role not configured — skipping',
      scheduled: 0,
    })
  }

  const runId = await startCronRun(supabase, 'recall')

  const thresholdDate = daysAgo(RECALL_THRESHOLD_DAYS)
  const today = new Date().toISOString().slice(0, 10)

  // ── Step 1: find recall candidates ───────────────────────────────────────
  // Patients/guests whose most recent completed appointment was ≥ 165 days ago
  // and who have NO upcoming confirmed/pending appointment.
  const { data: candidates, error: candidatesErr } = await supabase.rpc(
    'get_recall_candidates',
    { threshold_date: thresholdDate }
  )

  if (candidatesErr) {
    // RPC may not exist yet on some envs — fall back gracefully
    logger.warn('[cron/recall] get_recall_candidates RPC failed', {
      error: candidatesErr.message,
    })
    captureException(new Error('[cron/recall] get_recall_candidates error'), {
      supabaseError: candidatesErr,
    })
    await finishCronRun(supabase, runId, 0, candidatesErr.message)
    return NextResponse.json(
      { success: false, error: 'Failed to query recall candidates' },
      { status: 500 }
    )
  }

  type Candidate = {
    patient_id: string | null
    guest_email: string | null
    patient_name: string | null
    last_visit_date: string
  }

  const recallCandidates: Candidate[] = (candidates ?? []).filter(
    (c: Candidate) => c.guest_email || c.patient_id
  )

  if (!recallCandidates.length) {
    await finishCronRun(supabase, runId, 0)
    return NextResponse.json({
      success: true,
      message: 'No recall candidates today',
      scheduled: 0,
    })
  }

  // ── Step 2: filter by existing recall events ──────────────────────────────
  // Skip anyone already in the cooldown window (touch_3 sent < 30 days ago)
  const { data: recentRecalls } = await supabase
    .from('notification_events')
    .select('details')
    .like('type', 'recall_touch_%')
    .gte(
      'created_at',
      new Date(Date.now() - RECALL_COOLDOWN_DAYS * 86400 * 1000).toISOString()
    )

  const recentRecallEmails = new Set(
    (recentRecalls ?? []).map(
      (r: { details: { recipient_email?: string } }) =>
        r.details?.recipient_email
    )
  )

  // ── Step 3: queue touch_1 for new candidates ──────────────────────────────
  const { data: existingTouch1 } = await supabase
    .from('notification_events')
    .select('details')
    .eq('type', 'recall_touch_1')
    .gte(
      'created_at',
      new Date(Date.now() - RECALL_COOLDOWN_DAYS * 86400 * 1000).toISOString()
    )

  const touch1Emails = new Set(
    (existingTouch1 ?? []).map(
      (r: { details: { recipient_email?: string } }) =>
        r.details?.recipient_email
    )
  )

  const touch1Events: Record<string, unknown>[] = []

  for (const c of recallCandidates) {
    const email = c.guest_email
    if (!email || recentRecallEmails.has(email) || touch1Emails.has(email))
      continue

    touch1Events.push({
      type: 'recall_touch_1',
      recipient_email: email,
      status: 'queued',
      scheduled_at: new Date().toISOString(),
      details: {
        recipient_email: email,
        patient_name: c.patient_name ?? 'Шановний пацієнт',
        touch: 1,
        last_visit_date: c.last_visit_date,
      },
    })
  }

  // ── Step 4: queue touch_2 for patients at the 14-day window ──────────────
  const touch2Window = daysAgo(TOUCH_2_DELAY_DAYS)
  const { data: touch1Eligible } = await supabase
    .from('notification_events')
    .select('details')
    .eq('type', 'recall_touch_1')
    .eq('status', 'sent')
    .gte('processed_at', touch2Window + 'T00:00:00Z')
    .lte('processed_at', touch2Window + 'T23:59:59Z')

  const { data: existingTouch2 } = await supabase
    .from('notification_events')
    .select('details')
    .eq('type', 'recall_touch_2')
    .gte(
      'created_at',
      new Date(Date.now() - RECALL_COOLDOWN_DAYS * 86400 * 1000).toISOString()
    )

  const touch2Emails = new Set(
    (existingTouch2 ?? []).map(
      (r: { details: { recipient_email?: string } }) =>
        r.details?.recipient_email
    )
  )

  const touch2Events: Record<string, unknown>[] = []
  for (const r of touch1Eligible ?? []) {
    const email = (r as { details: { recipient_email?: string } }).details
      ?.recipient_email
    if (!email || touch2Emails.has(email)) continue
    touch2Events.push({
      type: 'recall_touch_2',
      recipient_email: email,
      status: 'queued',
      scheduled_at: new Date().toISOString(),
      details: {
        recipient_email: email,
        patient_name:
          (r as { details: { patient_name?: string } }).details?.patient_name ??
          'Шановний пацієнт',
        touch: 2,
      },
    })
  }

  // ── Step 5: queue touch_3 for patients at the 28-day window ──────────────
  const touch3Window = daysAgo(TOUCH_3_DELAY_DAYS)
  const { data: touch1ForTouch3 } = await supabase
    .from('notification_events')
    .select('details')
    .eq('type', 'recall_touch_1')
    .eq('status', 'sent')
    .gte('processed_at', touch3Window + 'T00:00:00Z')
    .lte('processed_at', touch3Window + 'T23:59:59Z')

  const { data: existingTouch3 } = await supabase
    .from('notification_events')
    .select('details')
    .eq('type', 'recall_touch_3')
    .gte(
      'created_at',
      new Date(Date.now() - RECALL_COOLDOWN_DAYS * 86400 * 1000).toISOString()
    )

  const touch3Emails = new Set(
    (existingTouch3 ?? []).map(
      (r: { details: { recipient_email?: string } }) =>
        r.details?.recipient_email
    )
  )

  const touch3Events: Record<string, unknown>[] = []
  for (const r of touch1ForTouch3 ?? []) {
    const email = (r as { details: { recipient_email?: string } }).details
      ?.recipient_email
    if (!email || touch3Emails.has(email)) continue
    touch3Events.push({
      type: 'recall_touch_3',
      recipient_email: email,
      status: 'queued',
      scheduled_at: new Date().toISOString(),
      details: {
        recipient_email: email,
        patient_name:
          (r as { details: { patient_name?: string } }).details?.patient_name ??
          'Шановний пацієнт',
        touch: 3,
      },
    })
  }

  // ── Step 6: insert all events ─────────────────────────────────────────────
  const allEvents = [...touch1Events, ...touch2Events, ...touch3Events]

  let scheduled = 0
  if (allEvents.length) {
    const { error: insertErr } = await supabase
      .from('notification_events')
      .insert(allEvents)

    if (insertErr) {
      captureException(new Error('[cron/recall] insert error'), {
        supabaseError: insertErr,
      })
      await finishCronRun(supabase, runId, 0, insertErr.message)
    } else {
      scheduled = allEvents.length
      logger.info('[cron/recall] scheduled recall events', {
        date: today,
        touch1: touch1Events.length,
        touch2: touch2Events.length,
        touch3: touch3Events.length,
      })
      await finishCronRun(supabase, runId, scheduled)
    }
  } else {
    await finishCronRun(supabase, runId, 0)
  }

  return NextResponse.json({
    success: true,
    scheduled,
    date: today,
    touch1: touch1Events.length,
    touch2: touch2Events.length,
    touch3: touch3Events.length,
  })
}
