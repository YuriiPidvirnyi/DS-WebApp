# CliniCards API Integration

Повна документація інтеграції з системою CliniCards для стоматологічної клініки Dental Story.

## Зміст

- [Огляд](#огляд)
- [Налаштування](#налаштування)
- [Архітектура](#архітектура)
- [API Сервіс](#api-сервіс)
- [Компоненти](#компоненти)
- [Безпека](#безпека)
- [Моніторинг](#моніторинг)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Огляд

CliniCards - це CRM система для медичних закладів. Наша інтеграція забезпечує:

- ✅ Онлайн запис на прийом через веб-сайт
- ✅ Особистий кабінет пацієнта з історією лікування
- ✅ Синхронізація прайс-листа
- ✅ Відображення планів лікування та платежів
- ✅ Автоматичне створення пацієнтів
- ✅ Моніторинг роботи API

### Можливості API CliniCards

Згідно з [офіційною документацією](https://cliniccards.com/ua/help/nalashtuvannya-ari):

- Отримання даних про розклад для онлайн запису
- Створення нових пацієнтів та отримання списку пацієнтів
- Експорт планів лікування за певний період
- Отримання інформації про виконані роботи
- Отримання всіх платежів
- Експорт прайсу

## Налаштування

### 1. Отримання API ключа

1. Зайдіть в панель адміністрації CliniCards
2. Перейдіть в розділ "Налаштування" → "API"
3. Створіть новий API ключ з необхідними правами доступу
4. Збережіть ключ в безпечному місці

### 2. Конфігурація проекту

Створіть файл `.env.local` в корені проекту:

```env
VITE_CLINICARDS_API_KEY=your_api_key_here
VITE_CLINICARDS_API_URL=https://api.cliniccards.com/v1
```

**Важливо**: Ніколи не комітьте `.env.local` в Git!

### 3. Ініціалізація API

У файлі `src/main.tsx` ініціалізуйте API при старті:

```typescript
import { initCliniCardsApi } from './services/clinicardsApi'

// Initialize CliniCards API
if (import.meta.env.VITE_CLINICARDS_API_KEY) {
  initCliniCardsApi({
    apiKey: import.meta.env.VITE_CLINICARDS_API_KEY,
    baseUrl: import.meta.env.VITE_CLINICARDS_API_URL,
    timeout: 10000,
    retries: 3,
  })
} else {
  console.warn('CliniCards API key not configured')
}
```

### 4. Перевірка підключення

Відкрийте адмін панель моніторингу (`/admin/clinicards`) та переконайтеся, що статус API "Працює нормально".

## Архітектура

### Структура файлів

```
src/
├── services/
│   ├── clinicardsApi.ts         # API клієнт з усіма методами
│   └── monitoring.ts            # Сервіс моніторингу
├── hooks/
│   └── useCliniCardsPriceList.ts  # Hook для роботи з прайсом
├── components/
│   ├── CliniCardsBooking.tsx    # Форма запису на прийом
│   ├── PatientPortal.tsx        # Особистий кабінет пацієнта
│   ├── PriceListDisplay.tsx     # Відображення прайсу
│   └── admin/
│       └── CliniCardsMonitoring.tsx  # Адмін панель
└── docs/
    └── CLINICARDS_INTEGRATION.md  # Ця документація
```

### Діаграма потоку даних

```
┌─────────────────┐
│  Frontend UI    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  API Service    │ ← Retry logic, caching, error handling
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  CliniCards     │
│      API        │
└─────────────────┘
```

## API Сервіс

### Основні можливості

Файл `src/services/clinicardsApi.ts` надає:

- **Retry механізм**: 3 спроби з експоненційним backoff
- **Кешування**: 5-хвилинний TTL для GET запитів
- **Timeout**: 10 секунд за замовчуванням
- **Типізація**: Повна підтримка TypeScript
- **Singleton**: Один екземпляр на додаток

### Методи API

#### Schedule (Розклад)

```typescript
// Отримання розкладу лікарів
const response = await api.getSchedule({
  doctorId: 'doc_123', // необов'язково
  startDate: '2024-01-01',
  endDate: '2024-01-31',
})
```

#### Patients (Пацієнти)

```typescript
// Пошук пацієнта за телефоном
const patient = await api.getPatientByPhone('+380501234567')

// Отримання всіх пацієнтів
const patients = await api.getPatients({
  page: 1,
  limit: 50,
  search: 'Іван', // необов'язково
})

// Створення нового пацієнта
const newPatient = await api.createPatient({
  firstName: 'Іван',
  lastName: 'Петренко',
  phone: '+380501234567',
  email: 'ivan@example.com',
  birthDate: '1990-01-15',
})
```

#### Appointments (Візити)

```typescript
// Створення запису на прийом
const appointment = await api.createAppointment({
  patientId: 'pat_123',
  doctorId: 'doc_456',
  date: '2024-01-15',
  time: '10:00',
  duration: 60,
  notes: 'Первинна консультація',
})

// Оновлення статусу
await api.updateAppointmentStatus('apt_789', 'confirmed')

// Скасування
await api.cancelAppointment('apt_789')
```

#### Treatment Plans (Плани лікування)

```typescript
// Отримання планів за період
const plans = await api.getTreatmentPlans({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
  patientId: 'pat_123', // необов'язково
  status: 'active', // необов'язково
})

// Отримання деталей плану
const plan = await api.getTreatmentPlan('plan_456')
```

#### Payments (Платежі)

```typescript
// Платежі пацієнта
const payments = await api.getPatientPayments('pat_123')

// Всі платежі за період
const allPayments = await api.getPayments({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
})
```

#### Price List (Прайс)

```typescript
// Отримання прайс-листа
const priceList = await api.getPriceList()

// Результат: масив об'єктів
// [{
//   id: 'price_1',
//   categoryId: 'cat_1',
//   categoryName: 'Терапія',
//   name: 'Лікування карієсу',
//   price: 1200,
//   duration: 60,
//   description: '...'
// }]
```

### Обробка помилок

```typescript
const response = await api.getSchedule({ ... })

if (!response.success) {
  console.error('API Error:', response.error)
  // response.error містить текст помилки
}

// Або з try/catch
try {
  const data = await api.createPatient({ ... })
  if (data.success) {
    // Успіх
  }
} catch (error) {
  // Мережева помилка
}
```

## Компоненти

### CliniCardsBooking

Форма онлайн запису на прийом.

**Використання:**

```tsx
import { CliniCardsBooking } from './components/CliniCardsBooking'

function BookingPage() {
  return (
    <CliniCardsBooking
      onSuccess={appointmentId => {
        console.log('Appointment created:', appointmentId)
        // Redirect or show confirmation
      }}
      onError={error => {
        console.error('Booking failed:', error)
      }}
    />
  )
}
```

**Функціонал:**

- Multi-step wizard (5 кроків)
- Вибір лікаря зі спеціалізацією
- Інтерактивний календар
- Доступні слоти в реальному часі
- Автоматичне створення пацієнта
- Підтвердження запису

### PatientPortal

Особистий кабінет пацієнта.

**Використання:**

```tsx
import { PatientPortal } from './components/PatientPortal'

function CabinetPage() {
  const { phone } = useAuth() // Ваша система авторизації

  return <PatientPortal patientPhone={phone} />
}
```

**Функціонал:**

- 4 вкладки: Дані, Візити, Лікування, Платежі
- Історія лікування з прогресом
- Деталі планів лікування
- Таблиця платежів
- Dashboard з статистикою

### PriceListDisplay

Відображення прайс-листа з пошуком.

**Використання:**

```tsx
import { PriceListDisplay } from './components/PriceListDisplay'

function PricingPage() {
  return (
    <PriceListDisplay
      showSearch={true}
      showFilters={true}
      showStatistics={true}
      allowDownload={true}
      onItemClick={itemId => {
        // Показати деталі або записатися
      }}
    />
  )
}
```

**Функціонал:**

- Пошук по назві та опису
- Фільтрація по категоріях
- Сортування (за назвою/ціною)
- Статистика цін
- Експорт в CSV
- Автоматичне кешування

### CliniCardsMonitoring

Адмін панель моніторингу.

**Використання:**

```tsx
import { CliniCardsMonitoring } from './components/admin/CliniCardsMonitoring'

function AdminDashboard() {
  return (
    <div>
      <h1>Адмін панель</h1>
      <CliniCardsMonitoring />
    </div>
  )
}
```

**Функціонал:**

- Статус здоров'я API
- Метрики продуктивності
- Статистика ендпоінтів
- Статус синхронізації
- Історія помилок
- Авто-оновлення (30 сек)

## Хуки

### useCliniCardsPriceList

Hook для роботи з прайсом.

```tsx
import { useCliniCardsPriceList } from './hooks/useCliniCardsPriceList'

function PriceComponent() {
  const {
    categories, // Прайс згруповано по категоріях
    loading, // Стан завантаження
    error, // Помилка
    lastUpdated, // Час останнього оновлення
    refresh, // Примусове оновлення
    search, // Пошук: (query: string) => PriceItem[]
    getItemsByCategory, // Фільтр по категорії
    getItemById, // Пошук по ID
    getStatistics, // Статистика цін
  } = useCliniCardsPriceList({
    autoRefresh: true, // Авто-оновлення
    refreshInterval: 3600000, // 1 година
    cacheKey: 'my_price_list', // Ключ кешу
  })

  return (
    <div>
      {loading && <Spinner />}
      {error && <Error message={error} />}

      {categories.map(category => (
        <div key={category.id}>
          <h2>{category.name}</h2>
          {category.items.map(item => (
            <div key={item.id}>
              {item.name} - {item.price} грн
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
```

## Безпека

### Захист API ключа

**❌ НІКОЛИ не робіть так:**

```typescript
// ПОГАНО - ключ в коді
const api = new CliniCardsApi({
  apiKey: 'sk_live_abc123...',
})
```

**✅ Правильний підхід:**

```typescript
// ДОБРЕ - ключ з env змінних
const api = new CliniCardsApi({
  apiKey: import.meta.env.VITE_CLINICARDS_API_KEY,
})
```

### Rate Limiting

API має обмеження:

- **Лімт запитів**: 100 запитів/хвилину
- **Burst**: До 20 одночасних запитів
- **Timeout**: 30 секунд на запит

Наш клієнт автоматично:

- Повторює запити при помилках (3 спроби)
- Кешує GET запити (5 хвилин)
- Використовує exponential backoff

### CORS

Якщо виникають CORS помилки, переконайтеся що:

1. API URL правильний
2. Ваш домен додано в whitelist CliniCards
3. Використовується HTTPS в продакшені

## Моніторинг

### Метрики

Система автоматично збирає:

- ✅ Час відповіді API
- ✅ Кількість успішних/неуспішних запитів
- ✅ Частота помилок
- ✅ Cache hit rate
- ✅ Статистика по ендпоінтам

### Доступ до метрик

```typescript
import { monitoring } from './services/monitoring'

// Отримати метрики за останню годину
const metrics = monitoring.getMetrics({
  name: 'timing.api',
  since: Date.now() - 3600000,
})

// Отримати помилки
const errors = monitoring.getErrors({
  level: 'error',
  since: Date.now() - 86400000, // 24 години
})

// Експортувати всі дані
const data = monitoring.exportData()
console.log(data)
```

### Alerts

Рекомендуємо налаштувати сповіщення при:

- Час відповіді > 2 секунд
- Частота помилок > 5%
- Будь-які 5xx помилки від API

## Troubleshooting

### Проблема: "API key not configured"

**Причина**: Відсутня env змінна

**Рішення**:

```bash
# Створіть .env.local
echo "VITE_CLINICARDS_API_KEY=your_key" > .env.local

# Перезапустіть dev сервер
npm run dev
```

### Проблема: "Network Error" або timeouts

**Можливі причини**:

1. Немає інтернет-з'єднання
2. API CliniCards недоступний
3. Firewall блокує запити

**Рішення**:

```bash
# Перевірте доступність API
curl https://api.cliniccards.com/v1/health

# Перевірте ключ
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.cliniccards.com/v1/patients
```

### Проблема: "429 Too Many Requests"

**Причина**: Перевищено rate limit

**Рішення**:

- Збільште інтервал між запитами
- Використовуйте кешування
- Зменшіть кількість одночасних запитів

### Проблема: Старі дані в прайсі

**Причина**: Кеш не оновився

**Рішення**:

```typescript
// Примусово оновити прайс
const { refresh } = useCliniCardsPriceList()
await refresh()

// Або очистити кеш вручну
localStorage.removeItem('clinicards_price_list')
```

### Проблема: TypeScript помилки

**Причина**: Неправильні типи даних

**Рішення**:

```typescript
// Імпортуйте типи з API
import type {
  Patient,
  Appointment,
  TreatmentPlan,
  Payment,
  PriceItem
} from './services/clinicardsApi'

// Використовуйте для ваших змінних
const patient: Patient = { ... }
```

## Best Practices

### 1. Використовуйте типи TypeScript

```typescript
import type { Patient } from './services/clinicardsApi'

function handlePatient(patient: Patient) {
  // TypeScript підкаже доступні поля
}
```

### 2. Обробляйте помилки

```typescript
try {
  const response = await api.createAppointment(data)
  if (!response.success) {
    showError(response.error)
    return
  }
  showSuccess()
} catch (error) {
  showError('Мережева помилка')
  logError(error)
}
```

### 3. Використовуйте кешування

```typescript
// Хук автоматично кешує
const { categories } = useCliniCardsPriceList({
  autoRefresh: true,
  refreshInterval: 3600000, // Оновлюється раз на годину
})
```

### 4. Моніторьте продуктивність

```typescript
import { monitoring } from './services/monitoring'

// Трекайте важливі події
monitoring.trackMetric('booking.completed', 1, {
  doctorId: 'doc_123',
  duration: appointmentDuration,
})
```

### 5. Тестуйте інтеграцію

```typescript
describe('CliniCards API', () => {
  it('should create appointment', async () => {
    const api = getCliniCardsApi()
    const response = await api.createAppointment({
      patientId: 'test_patient',
      doctorId: 'test_doctor',
      date: '2024-01-15',
      time: '10:00',
      duration: 60,
    })

    expect(response.success).toBe(true)
    expect(response.data?.id).toBeDefined()
  })
})
```

## Підтримка

При виникненні проблем:

1. Перевірте [офіційну документацію CliniCards](https://cliniccards.com/ua/help/nalashtuvannya-ari)
2. Подивіться логи в консолі браузера
3. Перевірте адмін панель моніторингу
4. Зверніться до техпідтримки CliniCards

## Changelog

### v1.0.0 (2024-01)

- ✅ Базова інтеграція з API
- ✅ Онлайн запис на прийом
- ✅ Особистий кабінет пацієнта
- ✅ Прайс-лист з пошуком
- ✅ Адмін панель моніторингу
- ✅ Повна документація

## License

Внутрішня документація Dental Story. Всі права захищено.
