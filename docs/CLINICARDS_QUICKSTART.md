# CliniCards Integration - Quick Start

Швидкий посібник для запуску інтеграції CliniCards за 10 хвилин.

## 📋 Передумови

- [x] Node.js 18+ встановлено
- [x] Проект DS-WebApp клоновано
- [x] API ключ CliniCards отримано

## 🚀 Швидкий старт (10 хвилин)

### Крок 1: Конфігурація (2 хв)

```bash
# 1. Скопіюйте приклад env файлу
cp .env.example .env.local

# 2. Відкрийте .env.local і додайте ваш API ключ
# VITE_CLINICARDS_API_KEY=ваш_ключ_тут
```

### Крок 2: Ініціалізація API (3 хв)

Додайте в `src/main.tsx`:

```typescript
import { initCliniCardsApi } from './services/clinicardsApi'

// Після ReactDOM.render
if (import.meta.env.VITE_CLINICARDS_API_KEY) {
  initCliniCardsApi({
    apiKey: import.meta.env.VITE_CLINICARDS_API_KEY,
    baseUrl:
      import.meta.env.VITE_CLINICARDS_API_URL ||
      'https://api.cliniccards.com/v1',
  })
}
```

### Крок 3: Додайте компонент (5 хв)

#### Варіант А: Онлайн запис

```tsx
// src/pages/BookingPage.tsx
import { CliniCardsBooking } from '@/components/CliniCardsBooking'

export default function BookingPage() {
  return (
    <div className="container mx-auto py-8">
      <CliniCardsBooking
        onSuccess={id => alert(`Запис створено! ID: ${id}`)}
        onError={err => console.error(err)}
      />
    </div>
  )
}
```

#### Варіант Б: Прайс-лист

```tsx
// src/pages/PricesPage.tsx
import { PriceListDisplay } from '@/components/PriceListDisplay'

export default function PricesPage() {
  return (
    <div className="container mx-auto py-8">
      <PriceListDisplay />
    </div>
  )
}
```

#### Варіант В: Кабінет пацієнта

```tsx
// src/pages/CabinetPage.tsx
import { PatientPortal } from '@/components/PatientPortal'

export default function CabinetPage() {
  // Отримайте телефон з вашої системи авторизації
  const userPhone = '+380501234567'

  return <PatientPortal patientPhone={userPhone} />
}
```

### Крок 4: Перевірка роботи

```bash
# Запустіть dev сервер
npm run dev

# Відкрийте в браузері
# http://localhost:5173
```

## ✅ Чеклист перевірки

- [ ] API ключ в `.env.local` (не в `.env`!)
- [ ] Ініціалізація в `main.tsx` працює
- [ ] Компоненти імпортуються без помилок
- [ ] В консолі немає червоних помилок
- [ ] Тестовий запит до API успішний

## 🔍 Швидка діагностика

### Проблема: "API key not configured"

```typescript
// Перевірте в консолі браузера:
console.log(import.meta.env.VITE_CLINICARDS_API_KEY)

// Якщо undefined:
// 1. Перевірте .env.local
// 2. Перезапустіть npm run dev
// 3. Перевірте що змінна починається з VITE_
```

### Проблема: "Network Error"

```bash
# Перевірте доступність API:
curl https://api.cliniccards.com/v1/health

# Перевірте ваш ключ:
curl -H "Authorization: Bearer ВАШ_КЛЮЧ" \
  https://api.cliniccards.com/v1/patients
```

### Проблема: CORS помилки

- Переконайтеся що використовуєте правильний URL API
- Перевірте що ваш домен доданий в whitelist CliniCards
- В локальній розробці CORS не повинно бути проблемою

## 📦 Що встановлено

Після інтеграції у вас є:

### Компоненти (4 шт)

- ✅ **CliniCardsBooking** - Форма запису на прийом
- ✅ **PatientPortal** - Особистий кабінет
- ✅ **PriceListDisplay** - Прайс-лист
- ✅ **CliniCardsMonitoring** - Адмін панель

### Сервіси

- ✅ **clinicardsApi.ts** - API клієнт (473 рядки)
- ✅ **monitoring.ts** - Моніторинг і метрики

### Хуки

- ✅ **useCliniCardsPriceList** - Робота з прайсом

## 📚 Наступні кроки

1. **Прочитайте повну документацію**: `docs/CLINICARDS_INTEGRATION.md`
2. **Налаштуйте моніторинг**: Відкрийте `/admin/clinicards`
3. **Кастомізуйте компоненти**: Змініть стилі під ваш дизайн
4. **Додайте тести**: Напишіть тести для критичних функцій

## 🎯 Основні можливості API

```typescript
import { getCliniCardsApi } from '@/services/clinicardsApi'

const api = getCliniCardsApi()

// Розклад лікарів
const schedule = await api.getSchedule({
  startDate: '2024-01-01',
  endDate: '2024-01-31',
})

// Створити пацієнта
const patient = await api.createPatient({
  firstName: 'Іван',
  lastName: 'Петренко',
  phone: '+380501234567',
})

// Записати на прийом
const appointment = await api.createAppointment({
  patientId: patient.data.id,
  doctorId: 'doc_123',
  date: '2024-01-15',
  time: '10:00',
  duration: 60,
})

// Прайс-лист
const prices = await api.getPriceList()
```

## 💡 Корисні приклади

### Пошук пацієнта за телефоном

```typescript
const patient = await api.getPatientByPhone('+380501234567')

if (!patient.success) {
  // Пацієнт не знайдений - створити нового
  const newPatient = await api.createPatient({...})
}
```

### Отримання історії лікування

```typescript
const treatments = await api.getTreatmentPlans({
  patientId: 'pat_123',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
})

console.log(`Знайдено ${treatments.data.length} планів лікування`)
```

### Статистика платежів

```typescript
const payments = await api.getPatientPayments('pat_123')

const total = payments.data.reduce((sum, p) => sum + p.amount, 0)
console.log(`Всього сплачено: ${total} грн`)
```

## 🔒 Безпека

### ❌ НЕ РОБІТЬ ТАК:

```typescript
// ПОГАНО - ключ в коді
const API_KEY = 'sk_live_abc123...'

// ПОГАНО - ключ в репозиторії
// .env
VITE_CLINICARDS_API_KEY=sk_live_abc123...
```

### ✅ РОБІТЬ ТАК:

```typescript
// ДОБРЕ - ключ з env змінної
const apiKey = import.meta.env.VITE_CLINICARDS_API_KEY

// ДОБРЕ - локальний файл (не в Git)
// .env.local
VITE_CLINICARDS_API_KEY=sk_live_abc123...
```

**Важливо**: Додайте `.env.local` в `.gitignore`!

## 📊 Моніторинг

Відкрийте адмін панель для перевірки:

```
http://localhost:5173/admin/clinicards
```

Ви побачите:

- ✅ Статус здоров'я API (зелений/жовтий/червоний)
- ✅ Кількість успішних/неуспішних запитів
- ✅ Середній час відповіді
- ✅ Статистику по ендпоінтам
- ✅ Статус синхронізації даних

## 🐛 Дебаг

Увімкніть детальне логування:

```typescript
// .env.local
VITE_DEBUG_MODE = true
```

Тоді в консолі браузера ви побачите:

```
[CliniCards] Initializing API...
[CliniCards] Making request: GET /schedule
[CliniCards] Response time: 234ms
[CliniCards] Success: true
```

## 🎓 Навчальні приклади

### Приклад 1: Просте бронювання

```tsx
function SimpleBooking() {
  const [loading, setLoading] = useState(false)

  const handleBook = async () => {
    setLoading(true)
    try {
      const api = getCliniCardsApi()

      // 1. Створити пацієнта
      const patient = await api.createPatient({
        firstName: 'Тест',
        lastName: 'Тестович',
        phone: '+380501234567',
      })

      // 2. Створити запис
      const appointment = await api.createAppointment({
        patientId: patient.data.id,
        doctorId: 'doc_123',
        date: '2024-02-01',
        time: '10:00',
        duration: 60,
      })

      alert('Успішно записано!')
    } catch (error) {
      alert('Помилка: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleBook} disabled={loading}>
      {loading ? 'Завантаження...' : 'Записатися'}
    </button>
  )
}
```

### Приклад 2: Відображення прайсу

```tsx
function SimplePriceList() {
  const { categories, loading, error } = useCliniCardsPriceList()

  if (loading) return <div>Завантаження...</div>
  if (error) return <div>Помилка: {error}</div>

  return (
    <div>
      {categories.map(category => (
        <div key={category.id}>
          <h2>{category.name}</h2>
          <ul>
            {category.items.map(item => (
              <li key={item.id}>
                {item.name} - {item.price} грн
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
```

## 📞 Підтримка

- 📖 **Повна документація**: `docs/CLINICARDS_INTEGRATION.md`
- 🌐 **Офіційна документація**: https://cliniccards.com/ua/help/nalashtuvannya-ari
- 💬 **Техпідтримка CliniCards**: support@cliniccards.com

## ✨ Готово!

Інтеграція CliniCards успішно налаштована! 🎉

Тепер ви можете:

- ✅ Приймати онлайн записи
- ✅ Показувати прайс в реальному часі
- ✅ Надавати доступ до особистих кабінетів
- ✅ Моніторити роботу API

**Успіхів! 🚀**
