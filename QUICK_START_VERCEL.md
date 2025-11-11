# ⚡ Швидкий старт: Deploy на Vercel за 5 хвилин

## 🚀 Крок 1: Створіть проєкт на Vercel (2 хв)

1. Відкрийте: https://vercel.com/new
2. Підключіть GitHub
3. Оберіть репозиторій `DS-WebApp`
4. **Import** → Vercel автоматично визначить Vite

✅ Готово! Перший деплой почнеться автоматично.

---

## 🔐 Крок 2: Додайте Environment Variables (3 хв)

У Vercel Dashboard:

**Settings** → **Environment Variables** → **Add**

### Мінімально необхідні:

```env
VITE_SITE_URL=https://your-project.vercel.app
VITE_ENVIRONMENT=production
VITE_PHONE_NUMBER=+380682323838
VITE_EMAIL=info@dentalstory.ua
```

### Опціонально (але рекомендовано):

```env
VITE_GOOGLE_MAPS_API_KEY=your_key
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=your_sentry_dsn
```

💡 **Tip**: Скопіюйте всі з `.env.production.example`

---

## ✅ Крок 3: Redeploy

**Deployments** → **...** → **Redeploy**

Готово! 🎉

---

## 🌍 Додати свій домен (опціонально)

**Settings** → **Domains** → **Add**

Введіть: `dentalstory.com.ua`

Vercel покаже DNS записи для налаштування.

---

## 📊 Моніторинг

**Analytics** → **Enable** (безкоштовно)

Отримаєте:

- Web Vitals
- Page views
- Performance metrics

---

## 🔄 Автоматичні деплої

Після налаштування:

- **Push to `develop`** → Preview URL
- **Merge to `main`** → Production

---

## ❓ Проблеми?

Перегляньте повний гайд: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

**Готово!** 🚀 Ваш сайт live!
