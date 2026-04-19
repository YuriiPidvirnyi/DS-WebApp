# A/B Testing Playbook (D6)

**Owner:** Marketing + Engineering · **Cadence:** one live test at a time, ~3-week cycle · **Last updated:** 2026-04-19

This document replaces the one-line `D6` bullet in `ROADMAP.md`. It defines **how** we run experiments, **what** we test first, and the **bar** a winning variant must clear before we ship it.

We don't have data scientists on staff and we don't need them. The clinic gets a steady ~6 000 unique homepage visitors / month at launch projection; that's enough power for the tests below if we run them disciplined and one at a time.

---

## Principles (the boring stuff that makes the rest work)

1. **One test at a time.** Concurrent tests interact and the math becomes a mess. Queue, don't parallelise.
2. **Minimum runtime two full weeks**, even if "significant" earlier. Patient behavior has a strong day-of-week pattern (Mon/Tue spike, weekends dead) and a 2-week floor smooths it.
3. **Pre-register the hypothesis, the metric, and the minimum detectable effect** before traffic hits the variant. Written down in `docs/ab-tests/<YYYY-MM-DD>-<slug>.md`. No retrofitting.
4. **No peeking.** Decision happens at the pre-declared end date. Looking daily and stopping when you like the number is how teams ship the loser.
5. **Ship the winner only if lift > 5 % AND p < 0.05** (or Bayesian P(B>A) > 95 %). Smaller lifts aren't worth the codepath complexity of keeping a variant.
6. **Document the loser.** Half the value of a test is knowing what _doesn't_ move the needle. Failed tests get the same write-up as winners.

---

## Tooling — minimal stack, ship in one sprint

We don't need a vendor. Three primitives we already have or can add cheaply:

- **Variant assignment** → cookie `ds_ab_<test-id>` set on first hit, sticky for 90 days. Hashed `visitor_id + test_id` so the same visitor lands in the same arm even cross-device once they sign in.
- **Variant flag delivery** → **Vercel Edge Config** for the active-test list (which test is live, traffic split, kill switch). Edge-cache reads, ms-level updates from the dashboard, free tier covers our scale.
- **Measurement** → existing analytics events (Phase C5) tagged with `ab_test_id` and `ab_variant`. We already emit `booking_started`, `booking_completed`, `symptom_checker_started`, etc. — wrap them.

Sketch of the wiring (one-time engineering cost ≈ 2 dev-days):

```ts
// src/lib/ab-test.ts
import { get } from '@vercel/edge-config'
import { cookies } from 'next/headers'

type Test = { id: string; variants: string[]; split: number[]; active: boolean }

export async function getVariant(testId: string): Promise<string | null> {
  const test = await get<Test>(`ab_${testId}`)
  if (!test?.active) return null

  const jar = await cookies()
  const cookieKey = `ds_ab_${testId}`
  const existing = jar.get(cookieKey)?.value
  if (existing && test.variants.includes(existing)) return existing

  const pick = weightedPick(test.variants, test.split)
  jar.set(cookieKey, pick, { maxAge: 60 * 60 * 24 * 90, path: '/' })
  return pick
}
```

Server Components read `getVariant('hero-cta')` and render conditionally. Analytics events grab the cookie value and tag the event. That is the entire framework.

---

## Sample-size reality check

For a binary conversion metric (clicked / didn't click, booked / didn't book) at α = 0.05 and 80 % power:

| Baseline conversion | MDE we want to detect      | Visitors per arm |
| ------------------- | -------------------------- | ---------------- |
| 4 %                 | +25 % relative (→ 5 %)     | ~2 350           |
| 8 %                 | +20 % relative (→ 9.6 %)   | ~1 600           |
| 25 %                | +15 % relative (→ 28.75 %) | ~700             |

Translation: at our projected 6 k uniques / month, we can power one homepage-CTA test per ~3-week window. Booking-funnel tests further down the funnel reach significance faster because the baseline conversion is higher.

Don't fight the math by inventing custom metrics with smaller samples. Pick one primary metric per test and accept the runtime.

---

## Test queue — first 5, in order

These are not brainstorm bullets. Each is a specific hypothesis the clinic team and I would defend in a Monday standup.

---

### Test #1 — Hero CTA copy

**Hypothesis.** Action-specific copy that signals immediacy converts better than the generic "Book appointment" we ship today, because dental visits are usually triggered by a specific concern, not aspirational planning.

**Variants.**

- **A (control).** "Записатись на прийом" (Book an appointment)
- **B.** "Підібрати зручний час" (Find a time that works for you)
- **C.** "Безкоштовна консультація" (Free consultation)

**Primary metric.** Clicks on hero CTA → `/booking` page-view conversion.
**Secondary.** Booking-form completion rate (catches the case where C draws clicks but lower-intent visitors).
**MDE.** +20 % relative on the primary metric.
**Sample size.** ~2 000 visitors per arm; ~3 weeks.
**Decision rule.** Ship the winner if it clears the bar AND the secondary metric is not statistically worse.

**Why this test first.** The hero is the single highest-traffic surface. Even a small win compounds across every other downstream test.

---

### Test #2 — Pricing visibility on service pages

**Hypothesis.** Showing an entry-level price ("from 800 UAH") on each service page reduces drop-off, because the dominant fear Ukrainian patients voice in surveys is "they'll quote me a number I can't afford only after I've already taken time off work."

**Variants.**

- **A (control).** No price shown; "ціна за консультацією" placeholder.
- **B.** "from 800 UAH" displayed prominently in service-card header.

**Primary metric.** Service page → booking-form-started conversion.
**Secondary.** Booking-form completion rate (does the price-aware visitor complete more often?).
**MDE.** +15 % relative.
**Sample size.** ~2 500 per arm.

**Why now.** Reverses a defensive doctor-driven default. Worst case we revert and we have data to settle the internal argument once.

---

### Test #3 — Booking form structure

**Hypothesis.** A 3-step progressive form (problem → time-slot → contact details) reduces abandonment vs. the current single-page form, because each step builds commitment and the visitor doesn't see the contact-fields wall up front.

**Variants.**

- **A (control).** Current single-page form.
- **B.** 3-step form with progress indicator. Same fields, same backend.

**Primary metric.** Booking-form-started → booking-completed.
**Secondary.** Time-on-page; field-error rate.
**MDE.** +10 % relative (current funnel ~25 % through-rate, so MDE is achievable in ~1 600 visits per arm).
**Sample size.** ~1 600 per arm; ~2 weeks.

**Why this matters.** Of all the funnels in the app, the booking form is where conversion is most fragile. A 10 % lift here compounds with every upstream test.

---

### Test #4 — Trust signals adjacent to CTA

**Hypothesis.** Surfacing concrete proof-of-credibility next to the booking CTA — "12 doctors · 4.9★ from 847 reviews · since 2014" — converts better than a clean CTA because dental decisions are high-trust purchases.

**Variants.**

- **A (control).** Hero CTA alone.
- **B.** Hero CTA with trust strip below it (doctor count, rating, year founded).

**Primary metric.** Hero CTA click-through rate.
**Secondary.** Reviews page traffic (do people click through to verify? — if yes, we may consider a stronger trust pattern).
**MDE.** +15 % relative.
**Sample size.** ~1 800 per arm.

---

### Test #5 — Symptom checker promotion

**Hypothesis.** Featuring the AI symptom checker on the homepage as a primary entry point (not buried in the menu) drives 3× usage and yields **higher-intent** booking leads, because patients who triage their symptom first arrive at booking with stronger commitment.

**Variants.**

- **A (control).** Symptom checker linked from main nav only.
- **B.** Symptom checker rendered as a distinct homepage card below the hero, with a "What's bothering you? Find out in 60 seconds" prompt.

**Primary metric.** Symptom-checker-completed → booking-completed conversion (within same session or 24 h).
**Secondary.** Total symptom-checker starts.
**MDE.** +50 % relative on primary (high MDE because we expect the effect to be large _if_ the hypothesis holds).
**Sample size.** ~1 200 per arm.

**Why this is the most interesting test.** It's the only one where a "no" result is genuinely useful — if the symptom checker doesn't drive bookings even when prominently placed, we have a clear product signal to either re-scope or sunset the feature post-launch.

---

## Anti-patterns we will refuse

- **Testing button colors.** Sub-2 % effect, eats a sprint of statistical power for nothing.
- **"Let's add a banner!"** Banners almost always hurt because they push the CTA below the fold.
- **Testing five microcopy tweaks at once.** Ship one. Learn. Move on.
- **Running tests during the December–January slow season.** Weird traffic patterns invalidate inferences. Pause testing 20 Dec–10 Jan.
- **A/B testing without a write-up.** A test that's not documented didn't happen — we will repeat it in 18 months.

---

## Marketing-side companion plays (not strictly A/B tests, but adjacent)

These are the highest-leverage _non-experiment_ marketing moves the clinic should run in parallel during the testing window. They feed traffic and intent into the funnel so the experiments above have data to chew on:

1. **Google Business Profile fully verified, with weekly post + monthly photo upload.** GBP signal strength is the single biggest factor for "стоматологія + район" searches in Ukrainian.
2. **15 reviews from existing patients in the first 30 days.** Each treated patient who completes a paid visit gets a 24-hour-later Telegram message with a one-tap Google review link. Aim for 30 % response rate.
3. **One condition-page per top-5 pain point** (зубний біль, кровоточивість ясен, чутливість, дитяча стоматологія, перед протезуванням). Each ranks for long-tail intent and feeds the symptom checker test.
4. **Telegram channel for the clinic** with educational mini-posts twice a week. Becomes the warm audience for retargeting and recall.
5. **Local-press partnership** with one parenting blog and one wellness account in the city. One-off paid post each, measure attributed bookings via UTM. Cheap, repeatable.

---

## Cadence & reporting

- **Friday weekly** — engineering posts current-test status (visits per arm, conversion delta, days remaining) in `#growth`.
- **End of test** — owner posts the write-up: hypothesis, result, decision, lessons. Archive in `docs/ab-tests/`.
- **Monthly** — marketing + product look at the running scorecard: tests run, win rate, cumulative lift.

The win rate target across a year is **30–40 %**. Anything dramatically above that means we're testing things we already know the answer to (no learning); anything dramatically below means our hypotheses aren't well-formed (we're guessing).
