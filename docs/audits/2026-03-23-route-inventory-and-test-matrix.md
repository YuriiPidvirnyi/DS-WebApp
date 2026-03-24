# DentalStory WebApp Route Inventory and Test Matrix

Date: 2026-03-23
Environment scope: local + production (`www.dentalstory.ua`)

## A. Public Routes

| Route               | Page file                       | Main view/component            | Primary scenarios                        | States to verify                                         |
| ------------------- | ------------------------------- | ------------------------------ | ---------------------------------------- | -------------------------------------------------------- |
| `/`                 | `app/page.tsx`                  | `src/views/Home.tsx`           | hero CTA, navigation, content sections   | default, loading placeholders, broken media              |
| `/about`            | `app/about/page.tsx`            | `src/views/About.tsx`          | informational content, internal links    | default, responsive wrap                                 |
| `/services`         | `app/services/page.tsx`         | `src/views/Services.tsx`       | service cards, CTA transitions           | default, empty content fallback                          |
| `/gallery`          | `app/gallery/page.tsx`          | `src/views/Gallery.tsx`        | image gallery, modal/image open          | loading images, broken image fallback                    |
| `/reviews`          | `app/reviews/page.tsx`          | `src/views/Reviews.tsx`        | review list readability and trust blocks | empty list, long text overflow                           |
| `/contact`          | `app/contact/page.tsx`          | `src/views/Contact.tsx`        | contact channels, map/links/actions      | missing data fallback                                    |
| `/booking`          | `app/booking/page.tsx`          | `src/views/Booking.tsx`        | multi-step booking flow                  | loading slots, validation errors, submit success/failure |
| `/booking/success`  | `app/booking/success/page.tsx`  | `src/views/BookingSuccess.tsx` | confirmation messaging and next steps    | direct open without context                              |
| `/symptom-checker`  | `app/symptom-checker/page.tsx`  | route-level UI                 | questionnaire and recommendation flow    | validation, timeout/error from backend                   |
| `/privacy-policy`   | `app/privacy-policy/page.tsx`   | `src/views/PrivacyPolicy.tsx`  | legal text readability                   | long page scrolling                                      |
| `/terms-of-service` | `app/terms-of-service/page.tsx` | `src/views/TermsOfService.tsx` | legal text readability                   | long page scrolling                                      |
| `/api-docs`         | `app/api-docs/page.tsx`         | route-level UI                 | docs rendering and nav                   | not configured state                                     |

## B. Authentication & Patient Routes

| Route                   | Page file                           | Main view/component                      | Primary scenarios               | States to verify                           |
| ----------------------- | ----------------------------------- | ---------------------------------------- | ------------------------------- | ------------------------------------------ |
| `/auth/login`           | `app/auth/login/page.tsx`           | auth form UI                             | login success/failure, redirect | invalid creds, rate limit, disabled button |
| `/auth/sign-up`         | `app/auth/sign-up/page.tsx`         | auth form UI                             | registration and email flow     | duplicate email, weak password             |
| `/auth/sign-up-success` | `app/auth/sign-up-success/page.tsx` | confirmation UI                          | post-sign-up instructions       | direct open                                |
| `/auth/forgot-password` | `app/auth/forgot-password/page.tsx` | reset request form                       | submit reset request            | unknown email messaging                    |
| `/auth/reset-password`  | `app/auth/reset-password/page.tsx`  | reset form UI                            | password reset completion       | invalid/expired token                      |
| `/auth/callback`        | `app/auth/callback/page.tsx`        | callback handler UI                      | token exchange and redirect     | callback error path                        |
| `/cabinet`              | `app/cabinet/page.tsx`              | route-level cabinet entry                | auth guard and dashboard entry  | unauthorized redirect                      |
| `/cabinet/appointments` | `app/cabinet/appointments/page.tsx` | route-level appointments UI              | list appointments, actions      | empty list, fetch error                    |
| `/cabinet/profile`      | `app/cabinet/profile/page.tsx`      | route-level profile UI                   | edit profile and save           | validation/save failure                    |
| `/cabinet/treatments`   | `app/cabinet/treatments/page.tsx`   | route-level treatment history UI         | view treatment records          | empty list, partial data                   |
| `/patient/[id]`         | `app/patient/[id]/page.tsx`         | `src/views/patient/PatientDashboard.tsx` | patient deep-link access        | invalid ID, unauthorized access            |

## C. Admin Routes

| Route                 | Page file                         | Main view/component                         | Primary scenarios             | States to verify                     |
| --------------------- | --------------------------------- | ------------------------------------------- | ----------------------------- | ------------------------------------ |
| `/admin/login`        | `app/admin/login/page.tsx`        | admin auth UI                               | admin sign-in                 | invalid creds, lockout/guard         |
| `/admin`              | `app/admin/page.tsx`              | admin dashboard UI                          | widgets and quick actions     | empty stats, load errors             |
| `/admin/analytics`    | `app/admin/analytics/page.tsx`    | `src/views/admin/AdminAnalyticsPage.tsx`    | analytics charts/filtering    | no data, chart render errors         |
| `/admin/appointments` | `app/admin/appointments/page.tsx` | `src/views/admin/AdminAppointmentsPage.tsx` | appointments CRUD/status flow | pagination/filter edge cases         |
| `/admin/chat`         | `app/admin/chat/page.tsx`         | admin chat UI                               | live session handling         | disconnected realtime, empty state   |
| `/admin/contacts`     | `app/admin/contacts/page.tsx`     | `src/views/admin/AdminContactsPage.tsx`     | contact requests processing   | missing contact data                 |
| `/admin/doctors`      | `app/admin/doctors/page.tsx`      | `src/views/admin/AdminDoctorsPage.tsx`      | doctor CRUD                   | validation and duplicate constraints |
| `/admin/materials`    | `app/admin/materials/page.tsx`    | `src/views/admin/AdminMaterialsPage.tsx`    | inventory CRUD and low-stock  | quantity edge cases                  |
| `/admin/orders`       | `app/admin/orders/page.tsx`       | `src/views/admin/AdminOrdersPage.tsx`       | order lifecycle transitions   | invalid status transitions           |
| `/admin/patients`     | `app/admin/patients/page.tsx`     | `src/views/admin/PatientManagement.tsx`     | patient lookup and edits      | large list performance               |
| `/admin/reviews`      | `app/admin/reviews/page.tsx`      | `src/views/admin/AdminReviewsPage.tsx`      | moderation flow               | empty queue                          |
| `/admin/services`     | `app/admin/services/page.tsx`     | `src/views/admin/AdminServicesPage.tsx`     | service catalog CRUD          | pricing validation                   |
| `/admin/settings`     | `app/admin/settings/page.tsx`     | `src/views/admin/AdminSettingsPage.tsx`     | configuration changes         | invalid config save                  |
| `/admin/treatments`   | `app/admin/treatments/page.tsx`   | `src/views/admin/AdminTreatmentsPage.tsx`   | treatment records lifecycle   | draft/signed/completed transitions   |

## D. Cross-cutting Error/Boundary Surfaces

| Surface                | File                    | What to test                  |
| ---------------------- | ----------------------- | ----------------------------- |
| Global error boundary  | `app/error.tsx`         | crash recovery and retry      |
| Global not found       | `app/not-found.tsx`     | invalid URL behavior          |
| Admin scoped error     | `app/admin/error.tsx`   | admin-specific fallback UX    |
| Booking scoped error   | `app/booking/error.tsx` | booking failure resilience    |
| App-level global error | `app/global-error.tsx`  | hard rendering failure output |

## E. Shared component audit targets (canonical files)

Це **не** список «поглянути на header», а **джерело правди** для візуальної/UX консистентності. Будь-який «повний аудит» повинен явно пройти **кожен** рядок нижче (див. §G–§H).

| Area                | File(s)                                                               | Що перевіряти прискіпливо                                                          |
| ------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Global chrome       | `SiteHeader.tsx`, `Footer.tsx`                                        | навігація, wrap, overflow, мова, focus order                                       |
| Forms (native)      | `ui/Input.tsx`, `ui/Button.tsx`, `Textarea` у `Input.tsx`             | кути, touch 44px, error/helper, `aria-*`                                           |
| Native select       | `Select` у `ui/Input.tsx`                                             | єдиний вигляд: `appearance-none`, chevron, `selectSize`: default / compact / dense |
| Custom combobox     | `ui/CustomSelect.tsx`                                                 | trigger + listbox, клавіатура, мобільна висота списку                              |
| Language UI         | `LanguageSwitcher.tsx`                                                | dropdown vs inline, ширина на вузькому екрані                                      |
| Floating / overlays | `ClientFloatingButtons.tsx`, `LiveChat.tsx`, `AccessibilityPanel.tsx` | safe-area, z-index, не перекривати основний контент                                |
| Cards / layout      | `ui/Card.tsx`                                                         | padding, heading hierarchy                                                         |
| Admin pages         | `src/views/admin/*.tsx`                                               | усі селекти через `Select`, не сирі `<select>`                                     |

## F. UI primitives matrix (обов’язковий другий шар аудиту)

**Шар 1** — маршрути з таблиць A–D (функціонал, стани, регресії).  
**Шар 2** — матриця примітивів нижче. Без нього формулювання «перевірив усе» **некоректне**.

| Primitive             | Де шукати в коді                   | Критерії «готово»                                                                                                                               |
| --------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Text inputs**       | `Input`, сирі `<input` у legacy    | `rounded-2xl`, `min-h-[44px]`, контраст placeholder, `aria-invalid` при помилці                                                                 |
| **Textarea**          | `Textarea`                         | те саме + `resize` адекватний довгим формам                                                                                                     |
| **Native `<select>`** | **лише** `Select` з `Input.tsx`    | Жодних сирих `<select>` у `src/` (крім самого примітива). Розміри: default (публічні форми), `compact` (admin-фільтри), `dense` (рядки таблиць) |
| **Custom dropdown**   | `CustomSelect`, `LanguageSwitcher` | М’які кути, тінь, обмеження `max-h` / `min` viewport на мобільному                                                                              |
| **Buttons**           | `Button`                           | стани loading/disabled, контраст WCAG на `dental-*`                                                                                             |
| **Modals / drawers**  | `AdminModal`, тощо                 | фокус, Escape, скрол усередині                                                                                                                  |
| **Tables**            | admin list pages                   | dense controls, горизонтальний скрол, bulk-бар                                                                                                  |
| **Toasts**            | `withToast`, hot-toast             | не перекривають критичні CTA                                                                                                                    |
| **i18n**              | `locales/*`, `useTranslation`      | немає сирих ключів; aria-рядки для селектів де потрібно                                                                                         |

## G. Definition of Done — коли можна казати «детальний аудит»

1. Пройдені **всі** релевантні рядки таблиць A–D для scope (public / auth / cabinet / admin).
2. Пройдена **матриця примітивів §F** (глобальні компоненти + типові контроли, не лише «головна сторінка»).
3. Для **кожного** інтерактивного типу з §F зафіксовано: мінімум один **шлях у браузері** або автоматичний тест / скрипт.
4. У звіті є **явний список виключень** (наприклад: «Lighthouse не ганявся»), а не загальні слова «повний аудит».
5. Для **select/dropdown**: підтверджено використання **`Select` / `CustomSelect`** або задокументована причина винятку.

## H. Canonical controls (шпаргалка для розробників)

| Потреба                                                      | Компонент                    | Примітки                                                                                  |
| ------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------- |
| Поле тексту                                                  | `Input`                      | Не дублювати «свої» класи `border rounded-lg` на сирих input                              |
| Параметр з переліку (нативний ОС-стиль з кастомною стрілкою) | `Select` з `@/components/ui` | `selectSize` за контекстом; `fullWidth` у сітках                                          |
| Складний вибір / accessibility                               | `CustomSelect`               | Не плутати з `Select`                                                                     |
| Мова сайту                                                   | `LanguageSwitcher`           | Перевірити `dropdown` на 320px ширини; **авто:** `npm run test:e2e:ui-smoke` (перехід EN) |

## I. Mandatory state checklist (кожен інтерактив)

- Visible and readable on brand surfaces (див. CLAUDE: не білий текст на `dental.primary`).
- Keyboard: focus видимий, порядок логічний; для списків — стрілки/Escape де застосовно.
- Hover, active, disabled, loading, success, error.
- Labels / `aria-label` / helper / error — зв’язок і зрозумілість (особливо **icon-only** та **filters**).
- Mobile: **tap target** (мінімум ~44px для публічних форм; admin — `compact`/`dense` свідомо).
- Повільна мережа: повторні сабміти, дублікати toast.
