# 🤖 V0 Integration Guide

Інструкція для роботи з Vercel v0 AI в цьому проекті.

## 📁 Структура проекту

```
DS-WebApp/
├── src/
│   ├── components/     # React компоненти
│   │   ├── ui/        # Базові UI компоненти (для v0)
│   │   ├── admin/     # Адмін компоненти
│   │   └── ...
│   ├── pages/         # Сторінки (React Router)
│   ├── hooks/         # Custom hooks
│   ├── services/      # API services
│   ├── utils/         # Утиліти
│   └── styles/        # CSS файли
├── public/            # Статичні файли
└── dist/             # Build output (не комітити)
```

## 🎨 Design System

### Кольори (Tailwind)

```js
dental-primary: #AECED3   // Основний блакитний
dental-secondary: #D1CAC0 // Бежевий
```

### Шрифти

```js
font-sans: 'Plus Jakarta Sans'     // Body text
font-heading: 'Plus Jakarta Sans'  // Headings
```

### Border Radius

```js
rounded: 12px    // Default
rounded-lg: 20px
rounded-xl: 24px
```

## 🔧 Технічний стек

- **Framework**: React 18 + Vite
- **Routing**: React Router v7
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form + Zod
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa

## 📝 Конвенції для v0

### 1. Компоненти

**Створюйте компоненти в:**

- `src/components/ui/` - базові UI (Button, Input, Card)
- `src/components/` - складні компоненти

**Шаблон:**

```tsx
interface ComponentProps {
  // Props
}

export const Component = ({}: ComponentProps) => {
  return <div className="...">{/* Content */}</div>
}
```

### 2. Стилізація

**Використовуйте Tailwind класи:**

```tsx
// ✅ Добре
<button className="rounded-lg bg-dental-primary px-4 py-2">

// ❌ Погано (inline styles)
<button style={{ borderRadius: '20px' }}>
```

### 3. TypeScript

**Завжди типізуйте:**

```tsx
// ✅ Добре
interface User {
  name: string
  email: string
}

// ❌ Погано
const user: any = {}
```

### 4. Imports

**Використовуйте alias @:**

```tsx
// ✅ Добре
import { Button } from '@/components/ui/Button'

// ❌ Погано
import { Button } from '../../../components/ui/Button'
```

## 🤖 Промпти для v0

### Створення UI компонента:

```
Create a [component name] component using:
- Tailwind CSS with dental-primary (#AECED3) color
- Plus Jakarta Sans font
- Rounded borders (rounded-lg)
- TypeScript interfaces
- Lucide React icons
```

### Створення форми:

```
Create a form with React Hook Form and Zod validation:
- Fields: [list fields]
- Dental Story design system
- Accessibility (ARIA labels)
- Error handling
```

### Створення сторінки:

```
Create a page component:
- React Router v7 compatible
- SEO with react-helmet-async
- Responsive design (mobile-first)
- Dental Story branding
```

## 🚀 Швидкий старт з v0

1. **Відкрийте v0**: https://v0.dev
2. **Підключіть проект**: Import from GitHub → DS-WebApp
3. **Генеруйте код**: Використовуйте промпти вище
4. **Копіюйте**: v0 згенерує компонент → копіюйте в проект
5. **Адаптуйте**: Додайте наш Design System якщо потрібно

## 📦 Додавання нових компонентів

```bash
# 1. Згенеруйте в v0
# 2. Збережіть у правильну папку
# 3. Експортуйте
echo "export { Component } from './Component'" >> src/components/index.ts

# 4. Використовуйте
import { Component } from '@/components'
```

## ⚙️ Environment Variables для v0

v0 працює з тими ж змінними що й Vercel.

**Перевірте:** `.env.production.example`

## 🎯 Best Practices

1. ✅ **Responsive first** - mobile → desktop
2. ✅ **Accessibility** - ARIA, keyboard navigation
3. ✅ **Performance** - lazy loading, code splitting
4. ✅ **TypeScript** - строга типізація
5. ✅ **Consistency** - дотримуйтесь Design System

## 📞 Підтримка

**Проблеми з v0?**

1. Перевірте цей гайд
2. Подивіться існуючі компоненти в `src/components/ui/`
3. Використовуйте Design System

**Готово!** 🚀 v0 тепер інтегрований!
