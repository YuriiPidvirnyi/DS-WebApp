# Post-Launch Feature Backlog (D1)

**Owner:** Product · **Horizon:** 12 months from `v3.0.x` GA · **Last updated:** 2026-04-19

This document replaces the one-line `D1` bullet in `ROADMAP.md` with a prioritized, sized, defensible roadmap. Every item answers three questions: **what problem does it solve, how do we know it worked, and how big is it?**

Scoring uses **ICE** (Impact 1–10 · Confidence 1–10 · Ease 1–10 — higher is better). T-shirt sizing assumes one full-stack engineer pairing with the founding dentist for product validation: **S** ≤ 1 sprint, **M** = 1–2 sprints, **L** = 3+ sprints.

---

## Operating context

We are not building a generic SaaS. Decisions below are anchored in three realities that govern small-to-mid Ukrainian dental clinics:

1. **Recall is 50–65 % of mature-clinic revenue.** A patient who never returns is a one-time transaction; a patient on a 6-month cadence is an annuity. Most of the highest-impact features below are recall-adjacent.
2. **No-shows cost 15–25 % of bookable chair-time** in clinics without deposit or confirmation discipline. Every percentage point recovered is pure margin — the chair, the assistant, and the rent are already paid.
3. **Telegram / Viber dominate Ukrainian patient comms.** Email open rates sit around 25–30 %; Telegram messages hit 90 %+ within an hour. Email-only notification stacks systematically under-deliver.

These three facts drive Q1 priorities. Everything else is secondary until they are addressed.

---

## Q1 (months 1–3) — Revenue defense

These five items are non-negotiable. Each one either protects revenue we are already earning or unlocks revenue currently being lost.

### 1. Telegram + Viber notification channel — **ICE 9·9·6 = 486** · **M**

**Problem.** Booking confirmations, reminders, and admin alerts go via email only. Real open rates in our cohort will be ~25–30 %, meaning 70 % of patients do not see the reminder we already sent.

**Solution.** Add Telegram Bot API + Viber Business API as channels in `notification_events`. Patient onboarding asks "Where should we reach you?" (default: Telegram if phone is Ukrainian). Admin alerts go to a Telegram group chat. Email becomes the fallback, not the default.

**Success metric.** Reminder delivery rate (sent → seen) ≥ 80 %. No-show rate ↓ from baseline by ≥ 5 pp within 60 days.

**Why now.** Cheapest single intervention available. Telegram Bot API is free; Viber charges per message but cheaper than the cost of one no-show. No regulatory friction.

---

### 2. Six-month recall system — **ICE 10·8·7 = 560** · **M**

**Problem.** A treated patient who is not actively recalled returns at ~30 %. With a recall system, that climbs to 70–80 %. We have appointment data and email — we have everything we need except the scheduler.

**Solution.** _(Shipped: `run_recall_job()` producer on Supabase `pg_cron`, daily 18:10 UTC.)_ Nightly, for each patient whose last visit was ~5.5 months ago and who has no upcoming appointment, queue a recall message. Three-touch sequence: T-0 ("time for your checkup"), T+14 ("we have these slots open"), T+30 ("call us — we miss you"). Patient can opt out per visit.

**Success metric.** Recall conversion (recall sent → appointment booked within 45 days) ≥ 35 %. Active patient base growth ≥ 8 % MoM in months 2–6.

**Why now.** Higher long-term ROI than any acquisition spend. Compounds: every cohort recalled this quarter adds to next quarter's recall pool.

---

### 3. Deposit-on-booking + auto-fill waitlist — **ICE 9·7·5 = 315** · **L**

**Problem.** No-shows are 15–25 %. Cancellations within 24 h leave a chair empty and an idled assistant.

**Solution.** Two coupled features:

- **Refundable deposit** (suggested 200–500 UAH, configurable per service) collected at booking via LiqPay or Wayforpay. Refunded on attendance, forfeit on no-show, transferable on > 24 h reschedule.
- **Waitlist auto-fill.** Patients can join a waitlist for a specific doctor / week. When a slot frees < 24 h before, the waitlist is messaged automatically; first to confirm wins.

**Success metric.** No-show rate ≤ 8 %. Chair utilization (booked hours ÷ open hours) ≥ 85 %.

**Why now.** Operationally hard (payment integration, refund mechanics, dispute handling) but the highest-margin lever the clinic has. Pilot on the busiest doctor first.

---

### 4. Family accounts (parent-as-guardian) — **ICE 8·9·6 = 432** · **M**

**Problem.** A mother managing care for two children currently needs three separate logins or impersonation work-arounds. She becomes our chief no-show risk and chief support ticket source.

**Solution.** Patient cabinet supports linked sub-profiles. Adult patient adds dependents (name, DOB, no email required). Bookings, treatment history, and payments roll up to the guardian's view. Per-dependent privacy: dependents over 16 can claim their own login and revoke guardian access.

**Success metric.** ≥ 30 % of cabinet users link at least one dependent within 90 days. Reduction in admin time spent reconciling related-patient records.

**Why now.** Most-requested feature in user interviews of pediatric-heavy clinics. Pure UX — no third-party dependencies.

---

### 5. Treatment plan PDF + e-signature — **ICE 8·8·7 = 448** · **M**

**Problem.** Treatment quotes for anything beyond a checkup are verbal or scribbled on paper. Patients leave the consultation, lose the quote, and convert at ~30 %. With a written, itemized plan they sign, conversion is 55–65 %.

**Solution.** Doctor builds the plan in `/admin/treatments/[id]` (already has the data model). One click renders a branded PDF (line items, materials, doctor signature, validity 30 days). Patient receives it in the cabinet + via Telegram/email. Patient e-signs in cabinet; signature converts the plan into a confirmed booking commitment.

**Success metric.** Quote → booking conversion ≥ 55 %. Average revenue per treatment-plan patient ↑ vs. ad-hoc quotes.

**Why now.** Data model already exists (`treatment_records` + `treatment_record_items`). Renderer + signature flow is the only missing piece. Highest leverage on average ticket size.

---

## Q2 (months 4–6) — Growth & retention

### 6. Referral & loyalty program — **ICE 7·7·6 = 294** · **M**

Both parties get 5–10 % off the next visit (capped at one redemption per referrer per quarter). Surfaced in cabinet with a unique link. Tracked via UTM + booking attribution. Avoid points / punch-card mechanics — too operationally heavy for a clinic our size.

**Success metric.** ≥ 10 % of new patients in months 5–6 are attributed to a referral.

### 7. Photo triage at booking — **ICE 6·8·8 = 384** · **S**

Optional "send a photo of the problem area" upload at booking. Doctor reviews 30 minutes before the appointment, may upgrade slot length or pre-order materials. Reduces "I came in but the right tool / specialist isn't here" moments.

**Success metric.** ≥ 20 % of urgent bookings include a photo within 60 days.

### 8. Installment payments for treatment > 10 k UAH — **ICE 7·6·4 = 168** · **L**

3- or 6-month plans via Monobank / PrivatBank installment APIs. Increases conversion on implants, orthodontics, full-mouth rehab. Operationally heavy (failed-payment handling, late fees, treatment-pause policy) — pilot only after deposit/waitlist is stable.

**Success metric.** Installment-eligible quote conversion ↑ 15 pp.

### 9. Digital pre-treatment consent — **ICE 7·8·7 = 392** · **S**

Replace paper consent forms with cabinet-based templates per procedure (anesthesia, extraction, root canal, sedation). Patient signs in the waiting room on a tablet. Counter-signed by doctor. Immutably stored. Required for the clinic's medical-legal audit defense.

**Success metric.** 100 % of relevant procedures have a digital consent record by end of month 6.

### 10. Doctor utilization dashboard — **ICE 6·9·8 = 432** · **S**

Per-doctor view in `/admin/analytics`: booked vs. open hours, no-show rate, average treatment value, top services. Drives schedule optimization and surfaces under-performing time blocks. Builds on existing data.

**Success metric.** Director uses it weekly; demonstrable schedule changes within 60 days.

---

## Q3–Q4 (months 7–12) — Scale & sophistication

| #   | Feature                                                 | ICE   | Size | Trigger                              |
| --- | ------------------------------------------------------- | ----- | ---- | ------------------------------------ |
| 11  | Tele-dentistry for post-op follow-ups                   | 6·6·5 | M    | After patient base > 1 500           |
| 12  | `records_manager` role + audit log UI                   | 5·9·7 | S    | When clinic has ≥ 3 doctors          |
| 13  | Auto-reorder materials when stock < min for N days      | 5·7·8 | S    | After D1 #4 inventory data is mature |
| 14  | Multi-clinic support (heavy RLS rework)                 | 6·5·2 | XL   | Only on confirmed second location    |
| 15  | Patient education content (condition + procedure pages) | 5·7·5 | M    | After SEO baseline lifts in B-phase  |

---

## Backlog — explicitly **not** doing

These are common SaaS-y suggestions that we are **declining** for the foreseeable future, with the reasoning so it doesn't get re-litigated every quarter.

- **Insurance integration** — Ukraine's private dental insurance market is too small to justify the integration cost. Revisit if VHI penetration crosses 15 %.
- **Group booking flows** — extreme edge case; family accounts (Q1 #4) cover the realistic version.
- **Gift certificates** — low usage in dentistry vs. cosmetic. Re-open if a patient explicitly asks twice.
- **Loyalty points / tiers** — operationally heavy, low evidence of ROI in clinics our size. Referral discount (Q2 #6) is the simpler proxy.
- **In-app patient chat with doctor** — current LiveChat with the front desk handles the use case. Direct doctor chat creates an unmanageable response-SLA expectation.
- **Replacing CliniCards entirely** — keep CliniCards as the slot system of record. Building our own scheduler doubles surface area for zero patient-visible benefit.

---

## Decision-making cadence

- **Weekly** — engineering reviews active sprint, reports blockers.
- **Monthly** — product reviews ICE scores against actual results; promotes / demotes items.
- **Quarterly** — clinic director + product re-rank Q+1 against booked KPIs and any new clinic-floor feedback.

If a request doesn't fit this doc, it either becomes a backlog row with an ICE score or it's recorded in the "explicitly not doing" list with the reasoning. No third option.
