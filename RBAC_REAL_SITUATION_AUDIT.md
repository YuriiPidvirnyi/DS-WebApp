# RBAC Real Situation Audit - DentalStory v3.0.1

**Date**: 2026-04-09  
**Basis**: Direct analysis of `src/lib/permissions.ts` and existing admin pages

---

## ЧАСТЬ 1: Які ролі реально існують (10 ролей)

| №   | Роль                  | Локація в системі | Описання                                                          |
| --- | --------------------- | ----------------- | ----------------------------------------------------------------- |
| 1   | **superadmin**        | Практично власник | Повний доступ до всього                                           |
| 2   | **admin**             | Менеджер клініки  | Управління, но БЕЗ видалення пацієнтів і управління користувачами |
| 3   | **receptionist**      | Фронт-дек/розклад | Записи, контакти, пацієнти, лікування                             |
| 4   | **doctor**            | Стоматолог        | Тільки свої записи та пацієнти                                    |
| 5   | **senior_assistant**  | Старший асистент  | Матеріали, замовлення (МОЖУТЬ затверджувати)                      |
| 6   | **assistant**         | Асистент          | Матеріали, замовлення (не можуть затверджувати)                   |
| 7   | **staff**             | Асистент (legacy) | **Як assistant** (старий alias)                                   |
| 8   | **billing_manager**   | Фінансист         | Аналітика, витрати, цини                                          |
| 9   | **inventory_manager** | Менеджер складу   | Матеріали та замовлення ТІЛЬКИ                                    |
| 10  | **analyst**           | Аналітик          | Тільки читання: аналітика, записи, пацієнти, лікування            |

---

## ЧАСТИНА 2: Які фічі існують в адмін панелі (13 сторінок)

| №   | Сторінка               | URL                   | Вимагає дозволу                                     | Кого маємо в коді     |
| --- | ---------------------- | --------------------- | --------------------------------------------------- | --------------------- |
| 1   | Дашборд                | `/admin`              | `dashboard:view`                                    | ✅ Є в 10 ролей       |
| 2   | Записи                 | `/admin/appointments` | `appointments:view_all` ИЛИ `appointments:view_own` | ✅ Є в 7 ролей        |
| 3   | Пацієнти               | `/admin/patients`     | `patients:view`                                     | ✅ Є в 8 ролей        |
| 4   | Лікарі                 | `/admin/doctors`      | `settings:view`                                     | ✅ Є в 4 ролей        |
| 5   | Послуги                | `/admin/services`     | `settings:view`                                     | ✅ Є в 4 ролей        |
| 6   | Відгуки                | `/admin/reviews`      | `settings:view`                                     | ✅ Є в 4 ролей        |
| 7   | Звернення              | `/admin/contacts`     | `appointments:view_all`                             | ✅ Є в 6 ролей        |
| 8   | Чат                    | `/admin/chat`         | `chat:view`                                         | ✅ Є в 10 ролей       |
| 9   | Акти робіт (Лікування) | `/admin/treatments`   | `treatments:view_all` ИЛИ `treatments:view_own`     | ✅ Є в 6 ролей        |
| 10  | Матеріали              | `/admin/materials`    | `inventory:view`                                    | ✅ Є в 6 ролей        |
| 11  | Замовлення матеріалів  | `/admin/orders`       | `orders:view`                                       | ✅ Є в 8 ролей        |
| 12  | **Аналітика**          | `/admin/analytics`    | `analytics:view`                                    | ❌ Є ТІЛЬКИ в 3 ролей |
| 13  | **Користувачі**        | `/admin/users`        | `users:view`                                        | ❌ Є ТІЛЬКИ в 2 ролей |
| 14  | Налаштування           | `/admin/settings`     | `settings:view`                                     | ✅ Є в 4 ролей        |

---

## ЧАСТИНА 3: Матриця доступу - ХТО ЩО БАЧИТЬ

### ✅ Ролі, які БАЧАТЬ більш-менш нормально

#### 🟣 **SUPERADMIN** (11 дозволів)

**Бачить ВСЕ (14/14 сторінок)**

- ✅ Дашборд
- ✅ Записи (view_all)
- ✅ Пацієнти (view+edit+delete)
- ✅ Лікарі (manage)
- ✅ Послуги (manage)
- ✅ Відгуки (manage)
- ✅ Звернення
- ✅ Чат (reply)
- ✅ Акти робіт (create+sign+edit_draft)
- ✅ Матеріали (view+edit)
- ✅ Замовлення (view+create+approve+delete)
- ✅ **АНАЛІТИКА**
- ✅ **КОРИСТУВАЧІ** (manage)
- ✅ Налаштування (edit)

#### 🟠 **ADMIN** (11 дозволів)

**Бачить 13/14 сторінок (БЕЗ /admin/users)**

- ✅ Дашборд
- ✅ Записи (view_all)
- ✅ Пацієнти (view+edit, БЕЗ delete)
- ✅ Лікарі (manage)
- ✅ Послуги (manage)
- ✅ Відгуки (manage)
- ✅ Звернення
- ✅ Чат (reply)
- ✅ Акти робіт (create+sign+edit_draft)
- ✅ Матеріали (view+edit)
- ✅ Замовлення (view+create+approve+delete)
- ✅ **АНАЛІТИКА**
- ❌ **КОРИСТУВАЧІ** (БЕЗ доступу - немає users:view)
- ✅ Налаштування (edit)

#### 🔵 **RECEPTIONIST** (6 дозволів)

**Бачить 6/14 сторінок**

- ✅ Дашборд
- ✅ Записи (view_all + edit+cancel)
- ✅ Пацієнти (view+edit)
- ✅ Звернення (appointments:view_all)
- ✅ Чат (reply)
- ✅ Акти робіт (view_all тільки)
- ❌ Лікарі
- ❌ Послуги
- ❌ Матеріали
- ❌ Замовлення
- ❌ Аналітика
- ❌ Користувачі

#### 🟢 **DOCTOR** (6 дозволів)

**Бачить 5/14 сторінок (SCOPED - тільки свої)**

- ✅ Дашборд
- ✅ Записи (view_own - тільки свої)
- ✅ Пацієнти (view - своїх пацієнтів)
- ✅ Чат (reply)
- ✅ Акти робіт (view_own+create+sign+edit_draft - своїх пацієнтів)
- ✅ Матеріали (view тільки)
- ✅ Замовлення (view+create)
- ❌ Звернення
- ❌ Лікарі
- ❌ Послуги
- ❌ Налаштування
- ❌ Аналітика
- ❌ Користувачі

#### 🟡 **SENIOR_ASSISTANT** (8 дозволів)

**Бачить 5/14 сторінок**

- ✅ Дашборд
- ✅ Записи (view_all)
- ✅ Пацієнти (view)
- ✅ Чат (reply)
- ✅ Акти робіт (view_all + edit_draft, НЕ create/sign)
- ✅ Матеріали (view+**edit**)
- ✅ Замовлення (view+create+**approve** - ХОД ЦЕ ЗНА́ЧИМО)
- ❌ Звернення
- ❌ Лікарі
- ❌ Послуги
- ❌ Налаштування
- ❌ Аналітика
- ❌ Користувачі

#### 🟠 **ASSISTANT/STAFF** (8 дозволів)

**Бачить 5/14 сторінок**

- ✅ Дашборд
- ✅ Записи (view_all)
- ✅ Пацієнти (view)
- ✅ Чат (reply)
- ✅ Акти робіт (view_all + edit_draft, НЕ create/sign)
- ✅ Матеріали (view тільки)
- ✅ Замовлення (view+create, БЕЗ approve)
- ❌ Звернення
- ❌ Лікарі
- ❌ Послуги
- ❌ Налаштування
- ❌ Аналітика
- ❌ Користувачі

### ⚠️ Спеціалізовані ролі

#### 🟢 **BILLING_MANAGER** (5 дозволів)

**Бачить 6/14 сторінок (ТІЛЬКИ READ аналіз)**

- ✅ Дашборд
- ✅ **АНАЛІТИКА** (view)
- ✅ Записи (view_all - для біллінгу)
- ✅ Пацієнти (view - рахунки)
- ✅ Акти робіт (view_all - вартість)
- ✅ Матеріали (view - вартість)
- ✅ Замовлення (view - витрати)
- ✅ Чат (reply)
- ❌ Управління (edit) чимось

#### 🔵 **INVENTORY_MANAGER** (4 дозволи)

**Бачить 2/14 сторінок (ВУЗЬКЕ призначення)**

- ✅ Дашборд
- ✅ Матеріали (**view+edit** - власне управління)
- ✅ Замовлення (view+create)
- ✅ Чат (reply)
- ❌ ВСЕ ІНШЕ

#### 🟣 **ANALYST** (5 дозволів)

**Бачить 6/14 сторінок (READ-ONLY аналіз)**

- ✅ Дашборд
- ✅ **АНАЛІТИКА** (view)
- ✅ Записи (view_all - для звітів)
- ✅ Пацієнти (view - демографія)
- ✅ Акти робіт (view_all - результати)
- ✅ Матеріали (view - запаси)
- ✅ Замовлення (view - постачання)
- ✅ Чат (reply - обговорення)
- ❌ РЕДАГУВАННЯ чогось

---

## ЧАСТИНА 4: ПРОБЛЕМИ - ХТО БАЧИТЬ / НЕ БАЧИТЬ

### 🔴 КРИТИЧНА ПРОБЛЕМА #1: **ASSISTANT не видить /admin/orders в навігації**

**Стан коду:**

- URL `/admin/orders` потребує дозволу: `orders:view` (строка 289)
- ASSISTANT **HAS** `orders:view` (строка 193)
- BUT: `/admin/orders` не видна в сайдбарі для assistant!

**ПРИЧИНА:** AdminLayoutClient (строка 135) фільтрує навігацію через `canAccessNavItem()`, який працює з `ROLE_NAV_PERMISSIONS`.

**Результат:** Assistant МОЖЕ перейти на `/admin/orders` прямо через URL (БЕЗ редагування URL), але не БАЧИТЬ в меню 🤯

---

### 🔴 КРИТИЧНА ПРОБЛЕМА #2: **АНАЛІТИКА видна ТІЛЬКИ 3 ролям**

| Роль              | Бачить /admin/analytics? |
| ----------------- | ------------------------ |
| superadmin        | ✅ YES (analytics:view)  |
| admin             | ✅ YES (analytics:view)  |
| billing_manager   | ✅ YES (analytics:view)  |
| receptionist      | ❌ NO                    |
| doctor            | ❌ NO                    |
| senior_assistant  | ❌ NO                    |
| assistant         | ❌ NO                    |
| analyst           | ✅ YES! (analytics:view) |
| inventory_manager | ❌ NO                    |

**ЦЕ ЛОГІЧНО:** Аналітика - це для управління та аналітиків. ✅ НОРМ.

---

### 🔴 КРИТИЧНА ПРОБЛЕМА #3: **КОРИСТУВАЧІ видна ТІЛЬКИ 2 ролям**

| Роль              | Бачить /admin/users?                  |
| ----------------- | ------------------------------------- |
| superadmin        | ✅ YES (users:view)                   |
| admin             | ❌ NO (БІЛИЙ ЛИСТ - немає users:view) |
| receptionist      | ❌ NO                                 |
| doctor            | ❌ NO                                 |
| senior_assistant  | ❌ NO                                 |
| assistant         | ❌ NO                                 |
| analyst           | ❌ NO                                 |
| billing_manager   | ❌ NO                                 |
| inventory_manager | ❌ NO                                 |

**ПРОБЛЕМА:** Admin НЕ МОЖЕ управляти користувачами, хоча це має бути його роль!

**ПРИЧИНА:**

```typescript
admin: [
  // ... інші дозволи...
  'users:view', // ❌ ВІДСУТНІЙ!
  // НЕ має users:manage
]
```

---

### 🔴 ПРОБЛЕМА #4: **Сторінки Лікарів/Послуг/Відгуків видні ТІЛЬКИ для 4 ролей**

| Сторінка          | Вимагає         | Хто має?                                        |
| ----------------- | --------------- | ----------------------------------------------- |
| `/admin/doctors`  | `settings:view` | superadmin, admin, receptionist (N), doctor (N) |
| `/admin/services` | `settings:view` | superadmin, admin, receptionist (N), doctor (N) |
| `/admin/reviews`  | `settings:view` | superadmin, admin, receptionist (N), doctor (N) |

**ПРОБЛЕМА:** Receptionist НЕ потребує бачити це, але БАЧИТЬ (через наявність `settings:view`).

---

## ВИСНОВОК

### ✅ ЩО ПРАЦЮЄ ДОБРЕ:

1. **Superadmin** - повний доступ ✅
2. **Doctor** - scoped доступ до своїх пацієнтів ✅
3. **Billing Manager** - аналітика вартостей ✅
4. **Inventory Manager** - управління матеріалами ✅
5. **Analyst** - read-only аналіз ✅

### ❌ ЩО ПОТРЕБУЄ ВИПРАВЛЕННЯ:

1. **ADMIN потребує `users:view` і `users:manage`** - мати управляти користувачами
2. **Assistant не бачить замовлення в меню** - хоча має доступ
3. **Receptionist бачить Лікарів/Послуг/Відгуків** - неповинна (потребує `settings:view`)
4. **Senior Assistant не може crear лікування** - але може edit_draft (це дивне)

---

## РЕКОМЕНДАЦІЯ

Потрібно виправити `admin` роль у permissions.ts:

```typescript
admin: [
  // ... існуючі ...
  'users:view', // ❌ ДОДАТИ
  'users:manage', // ❌ ДОДАТИ - для управління користувачами
  // ...
]
```

А також можна очистити навігацію - Receptionist не повинна бачити management-сторінки.
