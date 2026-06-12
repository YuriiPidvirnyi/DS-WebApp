# Повний аналіз системи DentalStory — 2026-06-12

> Глибокий аудит усієї веб-системи на всіх гілках: логіка, функціонал, безпека, UI/UX.
> Фокус: кабінет пацієнта, лікарський досвід, адмін-портал.
> Базова гілка аналізу: `develop` (найактуальніша). Попередній знімок: `docs/ANALYSIS_2026-06-01.md`.

---

## 1. Резюме

| Область           | Оцінка  | Коментар                                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------------------------- |
| Архітектура       | 🟢 9/10 | Next.js 16 App Router, чисте розшарування app/ → views/ → components/                       |
| RBAC та безпека   | 🟢 8/10 | 8 ролей, перевірки на 3 рівнях (client/API/RLS); IDOR `/patient/[id]` виправлено в цьому PR |
| Кабінет пацієнта  | 🟢 8/10 | Повний життєвий цикл запису, платежі з картками, GDPR-експорт/видалення                     |
| Лікарський досвід | 🟡 7/10 | Скоупінг працює, дашборд тепер doctor-aware; немає календаря/розкладу                       |
| Бронювання        | 🟢 8/10 | Зайнятість слотів тепер реальна (виправлено в цьому PR); лишається race на рівні БД         |
| UI/UX             | 🟢 8/10 | Зріла дизайн-система, card-редизайн, skeleton/empty states; немає dark mode                 |
| i18n              | 🟢 9/10 | uk/en/pl, 3150+ ключів, parity-тести в CI                                                   |
| Доступність       | 🟢 8/10 | axe-аудит у CI, панель доступності, фокус-стани, 44px touch targets                         |
| Тести/CI          | 🟡 7/10 | 210 юніт-тестів, 13 e2e-спеків; full-flow e2e лишилися на окремій гілці                     |
| Документація      | 🟢 8/10 | ADR, ROADMAP, CHANGELOG, аналітичні знімки                                                  |

**Загальна готовність до масштабування: ~8/10** (було 6.5/10 у ROADMAP v1.4; основні блокери закриті на develop та в цьому PR).

---

## 2. Стан гілок (на 2026-06-12)

| Гілка                                                                        | Стан                                                                                                                                                            | Рекомендація                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `develop`                                                                    | **+39 комітів попереду `main`**: inventory v2 (9 фаз), card-based UI-редизайн (6 фаз), платежі Monobank (wallet, hold, refund), KPI-дашборд, 0 npm-вразливостей | **Змерджити в `main`** — main відстає, а серед 39 комітів є security-фікси (зокрема оновлення Next.js)                                                                                                                     |
| `feature/payments-lockdown`                                                  | +2 коміти (`b2cf5a4` RBAC лікарів, `32baf2e` monobank hardening)                                                                                                | **Безпечно видалити**: обидва фікси вже повністю інкорпоровані в develop (path-based `useAdminPageAccess`, регресійний тест у `permissions.test.ts:252`, idempotency-guard вебхука, rate limit 30/min на status-ендпоінті) |
| `test/e2e-full-flow-specs`                                                   | Full-flow e2e (admin/cabinet/chat/orders/treatments) + live-конфіг                                                                                              | **Ребейзнути на develop і змерджити** — цінне покриття, якого немає на develop                                                                                                                                             |
| `feat/monobank-payments`                                                     | Застаріла (−425 комітів)                                                                                                                                        | Видалити — повністю заміщена роботою на develop                                                                                                                                                                            |
| `fix/a11y-bypass-trim`, `dependabot/*`, `copilot/*`, `docs/architecture-map` | Влиті або службові                                                                                                                                              | Видалити після перевірки                                                                                                                                                                                                   |

⚠️ **Процесна проблема**: `main` не отримував мерджів з develop з квітня. CLAUDE.md декларує flow `feature → develop → main`, але реліз у main не виконується. Це означає, що продакшн (якщо він з main) не має фіксів безпеки залежностей.

---

## 3. Кабінет пацієнта (`/cabinet`)

### Що працює добре

- **Дашборд** (`app/cabinet/page.tsx`): привітання за часом доби, статистика, найближчий візит, віджет повноти профілю, skeleton зі `role="status"`.
- **Записи** (`app/cabinet/appointments/page.tsx`): фільтри (всі/майбутні/минулі), скасування з підтвердженням, перенесення з міні-календарем і слотами, експорт .ics, toast-нотифікації з `aria-live`. Ownership-перевірки (`patient_id === user.id`) на cancel/reschedule + CSRF.
- **Лікування** (`app/cabinet/treatments/page.tsx`): розгортувані картки актів, статуси (draft/signed/completed), статуси оплати, позиції з зубами та цінами, EmptyState.
- **Платежі** (`app/cabinet/payments/page.tsx`): історія платежів + збережені картки (`WalletCards`), Monobank-флоу з деපозитом на booking-success.
- **Профіль/Налаштування**: редагування ПІБ/телефону/дати народження, GDPR-експорт даних (rate limit 5/min, defense-in-depth `.eq('id', user.id)` на кожному запиті), видалення акаунта з 2-кроковим підтвердженням.

### Виправлено в цьому PR

1. 🔴 **Видалення акаунта було повністю зламане**: route оновлював неіснуючі колонки `patients.full_name` і `patients.deleted_at` → кожна спроба видалення падала з 500 до видалення auth-користувача. Додано міграцію `20260612_patients_deleted_at.sql`, анонімізація переписана на реальні колонки (first/last/patronymic, address, medical_notes, date_of_birth), скасування майбутніх записів виправлено з `scheduled_at` (не існує) на `appointment_date` і прибрано неіснуючий статус `'scheduled'`.
2. 🟡 Reschedule-модалка: тихий catch при помилці завантаження слотів → тепер alert з кнопкою «Спробувати ще раз».
3. 🟡 Пагінація «Показати ще» (20/сторінка) для записів і лікувань — раніше фетчилось все без ліміту.

### Лишається (roadmap)

- Optimistic updates у формі профілю (зараз відчутна затримка).
- Налаштування нагадувань/нотифікацій у кабінеті (преференс зберігається лише в localStorage при бронюванні).
- Друк/PDF-експорт окремого акта лікування; візуалізація зубної формули (tooth chart).
- Подання відгуку з кабінету (публічна форма видалена, авторизованої немає).

---

## 4. Бронювання

### Стан

- 3-кроковий майстер (послуга → дані → підтвердження) з доступною навігацією (#296), draft-автозбереження в localStorage, Turnstile CAPTCHA, санітизація вводу, cooldown 60с, Zod-валідація на клієнті та сервері.
- POST `/api/appointments` — публічний (гостьові бронювання), валідація лікаря (активний) і послуги, черга email-нотифікацій (пацієнт + адмін).

### Виправлено в цьому PR

4. 🔴 **Слоти були заглушкою**: `/api/appointments/slots` повертав статичну сітку, ігноруючи `doctorId` і реальні записи → овербукінг був можливим, а «сьогоднішні» минулі години пропонувалися. Тепер:
   - виключаються слоти, перекриті активними записами (pending/confirmed) з урахуванням `duration_minutes`;
   - `doctorId` враховується (+валідація UUID); без нього слот доступний, поки вільний хоч один активний лікар;
   - минулі години відсікаються за київським часом (`Europe/Kyiv`), а не UTC;
   - graceful degradation до статичної сітки без env/при збої; 9 юніт-тестів.

### Лишається (roadmap)

- **Race condition на рівні БД**: два одночасні POST можуть створити записи на один слот. Рішення — частковий унікальний індекс `(doctor_id, appointment_date, appointment_time) WHERE status IN ('pending','confirmed')`; перед застосуванням треба почистити наявні дублікати в проді.
- Гостьові бронювання не мають patient_id — немає шляху «приєднати» їх до акаунта при подальшій реєстрації за email/телефоном.
- Реальний графік роботи лікарів (зараз одна сітка на всіх; `doctors` не має робочих годин).

---

## 5. Адмін-портал і лікарський досвід

### RBAC (`src/lib/permissions.ts`)

8 ролей (superadmin, admin, receptionist, doctor, assistant, billing_manager, inventory_manager, analyst), 25 пермішенів, OR-логіка `view_all`/`view_own` для лікарів. Перевірки на трьох рівнях: `useAdminPageAccess` (client), `requireAdmin()`+`hasPermission()` (API), RLS (`current_doctor_id()` міст auth.uid → admin_users.doctor_id → doctors.id, міграція `20260417_fix_doctor_scope_rls_v2.sql`). 34+ тестів у `permissions.test.ts`, включно з регресійним на path-based перевірку для лікарів.

### Модулі

- **Записи/Пацієнти/Лікарі/Послуги** — CRUD з фільтрами, пагінацією, TableSkeleton; видалення пацієнтів лише superadmin.
- **Акти лікування** — draft→signed→completed, оплата (unpaid/partial/paid/waived/refunded), списання матеріалів через RPC `deduct_inventory` (з реверсом при редагуванні).
- **Склад v2 (stock)** — 21 маршрут, 48 API-ендпоінтів: мультисклад (main/cabinet/doctor), 5 типів документів з posting primitive (draft→posted→void), FIFO-лоти, інвентаризації, калькуляційні картки норм на послугу, 5 звітів, штрих-коди, per-warehouse права (14 прапорів). За фіче-флагом `inventory_v2`, є pgTAP-тести міграцій.
- **Чат** — Realtime, role-based RLS (лікар бачить лише сесії своїх пацієнтів), unread-лічильники.
- **Cron** (`/api/cron/*`) — нотифікації, нагадування, low-stock, recall, stock-метрики; Bearer `CRON_SECRET`, idempotency, таблиця `cron_runs` для обзервабіліті.

### Покращено в цьому PR (доктор-персона)

5. Дашборд `/admin`: статистика і список «на сьогодні» тепер явно скоупляться за `doctor_id` (раніше — лише неявно через RLS), заголовок «Мої записи на сьогодні», список розширено до 10; приховано картки/лінки, на які роль не має прав (контакти, відгуки, лікарі, діаграма категорій), додано ярлики «Завершені візити» та «Мої акти».

### Лишається (roadmap)

- **Календар лікаря**: тижневий/денний розклад, iCal-експорт, друк.
- Перевірка достатності залишку перед `deduct_inventory` (зараз залишок може піти в мінус) — у stock v2 це вирішено, лишилося зняти v1.
- Export CSV/PDF для таблиць; глобальний пошук по модулях.
- Soft-delete + аудит-трейл для видалення admin-користувачів.

---

## 6. Безпека

### Виправлено в цьому PR

6. 🔴 **IDOR `/patient/[id]`**: staff-дашборд пацієнта був доступний будь-кому (middleware захищав лише `/cabinet` і `/admin`) — будь-який автентифікований пацієнт міг відкрити дашборд іншого пацієнта за UUID. Тепер `/patient/*` вимагає membership в `admin_users` (як `/admin`).

### Сильні сторони (без змін)

- CSP з nonce + повний набір security-заголовків (`proxy.ts`), HSTS, COOP.
- CSRF-валідація на всіх мутаціях, rate limiting (Redis + fallback) на всіх публічних ендпоінтах, Turnstile на бронюванні.
- Monobank: верифікація підпису вебхука, idempotency-guard терм. станів, інвалідація інвойса при скасуванні запису, обрізані фінансові поля у публічному status-ендпоінті.
- Admin-перевірка в middleware за таблицею `admin_users` (не JWT-клеймом).

### Лишається (roadmap)

- Унікальний індекс проти подвійного бронювання (див. §4).
- Кешування admin-перевірки middleware (зараз DB-запит на кожен `/admin|/patient` request; Redis 1–5 хв).
- `notification_events` у GDPR-експорті фільтруються за email (не за patient_id) — за спільного email можливий перетік чужих подій.
- RLS-перфоманс: загорнути `auth.uid()` в `(select auth.uid())` (initplan), додати відсутні FK-індекси (зафіксовано в ANALYSIS_2026-06-01).

---

## 7. UI/UX і дизайн-система

### Стан (після card-редизайну на develop)

- **Токени**: 13-кольорова семантична палітра з 10-рівневою шкалою primary, функціональні кольори, Nunito/Rubik з кирилицею, шкала радіусів/тіней. Правило контрасту: ніколи білий текст на #AECED3.
- **Примітиви** (`src/components/ui/`): Button/Input/Textarea/Select/Card(+variants)/AnimatedCard/Skeleton/TableSkeleton/EmptyState/ErrorState/LazyImage/CustomSelect/SidebarNavItem/UserSidebarCard — фокус-кільця, aria-атрибути, min-h 44px.
- **Картки** (`src/components/cards/`): StatCard, ReviewCard, ServiceDetailCard, TeamMemberCard.
- Skeleton/EmptyState вже використовуються у всіх сторінках кабінету та ключових адмін-таблицях.

### Покращено в цьому PR

7. Live-чат: **typing-індикатор** (broadcast-канал `chat-typing:{sessionId}`, throttle 1.5с, анімовані крапки) і **reconnect** з перезавантаженням історії після відновлення каналу — в пацієнтському віджеті та адмін-чаті.
8. Auth: кнопка «Надіслати лист підтвердження ще раз» при помилці непідтвердженого email на логіні.
9. Hardcoded телефон у symptom checker → `CONTACT_INFO.emergencyPhoneRaw`.

### Лишається (roadmap)

- **Dark mode** (Tailwind `dark:` + `prefers-color-scheme`) — зараз лише high-contrast у панелі доступності.
- CustomSelect → повний ARIA combobox-патерн.
- Декомпозиція в'ю >800 рядків (AdminSettingsPage та ін.).
- Storybook у CI (Chromatic/Vercel preview).
- Floating labels, активний стан кнопок (`active:scale-95`), прогрес-бар у майстрі бронювання.

---

## 8. Публічний сайт, SEO, PWA

- Сторінки: Home (A/B-тест hero CTA), Services (редизайн + inline AI-finder), About, Gallery (before/after з лайтбоксом), Contact, Booking; 4–5 точок входу в бронювання на сторінку; плаваюче радіальне меню (телефон/WhatsApp/Viber/Telegram/чат/доступність).
- SEO: metadata на кожній сторінці, JSON-LD (Organization, LocalBusiness з рейтингом, Breadcrumb, FAQ), динамічний sitemap, robots (disallow `/admin/`, `/api/`, `/patient/`), OG-зображення.
- PWA: manifest із шорткатами, Workbox-кешування (fonts 1р, зображення 30д, API NetworkFirst).
- Перфоманс: next/image + LazyImage, next/font зі swap, бандл-аналізатор, Vercel Speed Insights, Sentry RUM.
- Symptom checker — **евристичний** (lookup-таблиця симптомів), не LLM; маркетинговий текст не має називати його «AI-діагностикою».

---

## 9. i18n та доступність

- 3 локалі (uk дефолт, en/pl lazy), ~3160 рядків на локаль, parity/drift-тести в CI — у цьому PR усі нові рядки додані одразу в 3 локалі.
- A11y: `scripts/a11y-audit.mjs` (axe, WCAG 2A/AA, 8 публічних + admin/cabinet скоупи), щотижневий GitHub Action, skip-link, LiveRegion, панель доступності (шрифт/контраст/reduced motion/дальтонізм-фільтри).

---

## 10. Тести та CI

- **Юніт**: 25 файлів, 210 тестів (після цього PR: +9 для slots route), Vitest.
- **E2E**: 13 спеків (smoke, auth mocked/live, booking, contact, cabinet, admin-rbac, cron, мова). Full-flow спеки — на гілці `test/e2e-full-flow-specs`, не влиті.
- **CI**: lint+typecheck, unit, e2e smoke/auth, build+a11y-аудит, schema-validate, security audit (`npm audit` без continue-on-error), secret-scan (gitleaks), Dependabot auto-merge, weekly a11y.
- Прогалини: немає інтеграційних тестів treatment-флоу та платіжного флоу (create→webhook→status), немає Lighthouse-гейта.

---

## 11. Зміни в цьому PR (зведення)

| #   | Тип         | Зміна                                           | Файли                                                                                                             |
| --- | ----------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| 1   | 🔴 security | IDOR: `/patient/*` за admin-membership          | `src/lib/supabase/middleware.ts`                                                                                  |
| 2   | 🔴 fix      | Зламане видалення акаунта (неіснуючі колонки)   | `app/api/cabinet/delete-account/route.ts`, `supabase/migrations/20260612_patients_deleted_at.sql`                 |
| 3   | 🔴 feat     | Реальна зайнятість слотів + Kyiv TZ + 9 тестів  | `app/api/appointments/slots/route.ts`, `src/lib/__tests__/slots-route.test.ts`                                    |
| 4   | 🟡 fix      | Телефон symptom checker з констант              | `app/symptom-checker/page.tsx`                                                                                    |
| 5   | 🟡 ux       | Typing-індикатор + reconnect у чаті             | `src/hooks/useLiveChat.ts`, `src/hooks/useAdminChat.ts`, `src/components/LiveChat.tsx`, `app/admin/chat/page.tsx` |
| 6   | 🟡 ux       | Пагінація кабінету, помилка слотів у reschedule | `app/cabinet/appointments/page.tsx`, `app/cabinet/treatments/page.tsx`                                            |
| 7   | 🟡 ux       | Doctor-aware дашборд                            | `app/admin/page.tsx`                                                                                              |
| 8   | 🟡 ux       | Resend confirmation на логіні                   | `app/auth/login/page.tsx`                                                                                         |
| 9   | i18n        | Усі нові рядки uk/en/pl                         | `src/locales/*.json`                                                                                              |

**Примітка**: фікси гілки `feature/payments-lockdown` НЕ переносилися — перевірено, що обидва коміти вже інкорпоровані в develop.

---

## 12. Пріоритезований roadmap

### P0 — перед наступним релізом

1. **Merge develop → main** (security-оновлення залежностей у проді).
2. Застосувати міграцію `20260612_patients_deleted_at.sql` на live-БД.
3. Ребейз + мердж `test/e2e-full-flow-specs`; видалити стейл-гілки (`feature/payments-lockdown`, `feat/monobank-payments`).

### P1 — найближчий місяць

4. Унікальний індекс проти подвійного бронювання (після чистки дублікатів).
5. Кеш admin-перевірки middleware (Redis, TTL 1–5 хв).
6. RLS-перфоманс: initplan-обгортки + FK-індекси; переїзд БД в EU-регіон (з ANALYSIS_2026-06-01).
7. Інтеграційні тести: treatment-флоу, платіжний флоу.
8. PITR add-on у Supabase; юридична перевірка privacy/terms (блокери з CLAUDE.md).

### P2 — квартал

9. Календар лікаря (день/тиждень, iCal, друк) — найбільша прогалина доктор-персони.
10. Налаштування нагадувань у кабінеті пацієнта + керування згодами.
11. Графіки роботи лікарів → точні слоти на лікаря.
12. Зняття inventory v1 на користь stock v2 (вирішує мінусові залишки).
13. Прив'язка гостьових бронювань до акаунта за верифікованим email/телефоном.

### P3 — побажання

14. Dark mode; ARIA-combobox; floating labels; прогрес-бар бронювання.
15. PDF/друк акта лікування + tooth chart у кабінеті.
16. Export CSV/PDF в адмін-таблицях; глобальний пошук.
17. Storybook у CI; Lighthouse-гейт; декомпозиція великих в'ю.
