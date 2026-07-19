# Supabase Auth email templates

Some Supabase auth emails still live in the Supabase Dashboard
(**Authentication → Emails → Templates**). This folder is the canonical,
version-controlled source for those: edit here, then paste into the Dashboard.

They mirror the design of the in-app transactional templates in
`src/lib/email-templates.ts` (same brand colours, Lviv contacts, dark-mode-safe
header).

## Password recovery is NOT a Dashboard template anymore

As of the custom recovery flow (PR #367), the **password-reset email is sent
from the app code**, not from Supabase's built-in mailer:

- `app/auth/forgot-password` → `POST /api/auth/recover`
- the route mints the link with `admin.generateLink({ type: 'recovery' })` and
  sends a branded email via Resend using `passwordResetEmail()` in
  `src/lib/email-templates.ts` (which renders through `baseLayout`, so it gets
  the logo header + Lviv footer automatically).

So there is **nothing to paste into the Dashboard for password reset** — the
Supabase "Reset Password" template is bypassed. Edit the copy in
`src/lib/email-templates.ts` (and keep the Deno edge copy in sync — see the
drift-guard test `src/lib/__tests__/edge-template-parity.test.ts`).

The only template still managed in the Dashboard is **Confirm sign up**, which
still flows through Supabase's mailer.

## The logo

The header shows the white DentalStory logo
(`public/assets/images/logo/logo-email-white.png`, rasterised from
`logo-mark-tight.svg`) on a solid teal chip.

- **Why an image, not the SVG:** Gmail and most clients strip inline SVG.
- **Why white-on-teal:** clients force-invert white email backgrounds in dark
  mode; a solid teal chip is **not** inverted, so the white logo stays legible
  in both light and dark mode.
- **Deploy status:** the `<img>` loads from
  `https://dentalstory.ua/assets/images/logo/logo-email-white.png`. That PNG is
  **already live on prod** (shipped via the hotfix in #370), so the logo renders
  today — it's safe to paste `confirm-signup.html` into the Dashboard now.

## Why the button links to `/auth/confirm`

Mail scanners / link previewers pre-fetch links with a GET. The default
`{{ .ConfirmationURL }}` points at `/auth/v1/verify`, whose one-time token is
consumed by that prefetch — so the real click 403s ("Email link is invalid or
has expired"). `/auth/confirm` is a **click-gated** page: it only calls
`verifyOtp({ token_hash })` on an explicit button press, so a prefetch can't
burn the token. See `app/auth/confirm/page.tsx`.

## How to apply

Dashboard: https://supabase.com/dashboard/project/exgpwtyrkkhwqqdgqbkz/auth/templates

| Template        | Subject                                  | Body file             |
| --------------- | ---------------------------------------- | --------------------- |
| Confirm sign up | `Підтвердження реєстрації — DentalStory` | `confirm-signup.html` |

Paste the file contents into the template body, set the subject, Save.

## Contacts (single source of truth: `src/utils/constants.ts` → `CONTACT_INFO`)

- Phone: `+380 68 232 38 38`
- Address: вулиця Сумська, 10, Львів, 79034
- Email: info@dentalstory.ua · Site: https://dentalstory.ua
