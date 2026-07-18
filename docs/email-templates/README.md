# Supabase Auth email templates

Supabase auth emails (Reset password, Confirm sign up, …) are **not** managed by
this repo's code — they live in the Supabase Dashboard
(**Authentication → Emails → Templates**). These files are the canonical,
version-controlled source: edit here, then paste into the Dashboard.

They mirror the design of the in-app transactional templates in
`src/lib/email-templates.ts` (same brand colours, Lviv contacts, dark-mode-safe
header chip).

## Why the header is a solid teal chip

Gmail (and other clients) force-invert white email backgrounds in dark mode.
A plain dark-navy wordmark then disappears against the inverted dark card. A
solid teal chip is **not** inverted, so the white "Dental" + light-blue "Story"
stay legible in both light and dark mode.

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
| Reset Password  | `Відновлення пароля — DentalStory`       | `reset-password.html` |
| Confirm sign up | `Підтвердження реєстрації — DentalStory` | `confirm-signup.html` |

Paste the file contents into the template body, set the subject, Save.

## Contacts (single source of truth: `src/utils/constants.ts` → `CONTACT_INFO`)

- Phone: `+380 68 232 38 38`
- Address: вулиця Сумська, 10, Львів, 79034
- Email: info@dentalstory.ua · Site: https://dentalstory.ua
