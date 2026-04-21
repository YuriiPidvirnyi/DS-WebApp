# DentalStory — Current Status

> Last updated: 2026-04-21 | Version: v3.0.1 (prod) / v3.3.x (develop)

## Phase progress

| Phase                    | Status         | Notes                                         |
| ------------------------ | -------------- | --------------------------------------------- |
| A — Critical fixes       | ✅ Done        | RLS, seed, CI, E2E, docs cleanup              |
| B — Production readiness | ✅ Done        | AI costs, i18n guard, cron, rate limits, perf |
| C — Polish & launch      | 🟡 In progress | C4/C6/C7 done; C1 a11y + legal review pending |
| D — Post-launch          | 🟡 Ongoing     | Logger, health page, Dependabot shipped       |

## Open blockers before launch

- [ ] WCAG 2.1 AA external audit (Phase C1)
- [ ] `/privacy-policy` + `/terms-of-service` reviewed by Ukrainian lawyer
- [ ] Supabase PITR add-on enabled (Dashboard → Settings → Add-ons)
- [ ] Payments decision: hide `/cabinet/payments` or wire PSP (A3)
- [ ] Lighthouse PWA ≥ 90 verified on prod URL
- [ ] DNS swing scheduled (see RUNBOOKS §1.2)

## Infrastructure

| Service       | Status                | Notes                                        |
| ------------- | --------------------- | -------------------------------------------- |
| Vercel        | ✅ Active             | fra1, Skew Protection enabled                |
| Supabase      | ✅ Active             | Pro plan (Vercel Marketplace), daily backups |
| Resend        | ⚠️ Unverified in prod | Needs real booking test                      |
| Upstash Redis | ✅ Active             | Free tier, 10k cmd/day                       |
| Sentry        | ✅ Active             | Client + server + edge                       |
| AI Gateway    | ✅ Active             | AI_GATEWAY_API_KEY set                       |
| CliniCards    | ⚠️ Unverified         | Live API key not proven                      |

## Key contacts

- Engineering: Yurii Pidvirnyi
- Supabase project: `exgpwtyrkkhwqqdgqbkz`
- Vercel project: `ds-web-app` (`prj_p2lODAVe4qvs1JHqVrR3HfBPYT3s`)
