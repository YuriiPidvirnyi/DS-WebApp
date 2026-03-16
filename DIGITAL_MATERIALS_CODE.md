# DENTAL STORY — DIGITAL MATERIALS & CODE TEMPLATES
**Production-Ready HTML, CSS, and Component Code**

---

## PART I: EMAIL TEMPLATES

### Email Template 1: Appointment Confirmation

```html
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Підтвердження запису</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Roboto', Arial, sans-serif;
            background-color: #F5F3F1;
            color: #4A5E63;
            line-height: 1.6;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #FFFFFF;
        }
        
        .header {
            background-color: #AECED3;
            padding: 30px;
            text-align: center;
            border-bottom: 4px solid #5A8A94;
        }
        
        .header h1 {
            font-family: 'Stolzl', Arial, sans-serif;
            font-size: 28px;
            color: #FFFFFF;
            margin: 0;
        }
        
        .content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 16px;
            margin-bottom: 20px;
            color: #2C3E42;
        }
        
        .appointment-details {
            background-color: #F5F3F1;
            border-left: 4px solid #5A8A94;
            padding: 20px;
            margin: 30px 0;
            border-radius: 6px;
        }
        
        .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid #AECED3;
        }
        
        .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .detail-label {
            font-weight: 600;
            color: #2C3E42;
        }
        
        .detail-value {
            color: #6B8388;
        }
        
        .cta-button {
            display: inline-block;
            background-color: #5A8A94;
            color: #FFFFFF;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-family: 'Stolzl', Arial, sans-serif;
            font-size: 16px;
            margin: 30px 0;
            text-align: center;
            border: 2px solid #5A8A94;
        }
        
        .cta-button:hover {
            background-color: #2C3E42;
            border-color: #2C3E42;
        }
        
        .reminder {
            background-color: #FFF8E8;
            border-left: 4px solid #E8A366;
            padding: 15px;
            margin: 20px 0;
            border-radius: 6px;
            font-size: 13px;
            color: #6B8388;
        }
        
        .footer {
            background-color: #1a2c30;
            padding: 30px;
            text-align: center;
            color: #AECED3;
            font-size: 12px;
        }
        
        .footer a {
            color: #AECED3;
            text-decoration: none;
        }
        
        .footer a:hover {
            color: #FFFFFF;
        }
        
        .location-info {
            background-color: #F5F3F1;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>Dental Story</h1>
            <p style="color: #FFFFFF; margin-top: 10px; font-size: 14px;">Підтвердження вашого запису</p>
        </div>
        
        <!-- Content -->
        <div class="content">
            <p class="greeting">Вітаємо, <strong>{{patient_name}}</strong>!</p>
            
            <p>Дякуємо, що записалися до нашої клініки. Ваш запис було успішно підтверджено. Детальну інформацію див. нижче:</p>
            
            <!-- Appointment Details -->
            <div class="appointment-details">
                <div class="detail-row">
                    <span class="detail-label">Дата прийому:</span>
                    <span class="detail-value">{{appointment_date}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Час:</span>
                    <span class="detail-value">{{appointment_time}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Послуга:</span>
                    <span class="detail-value">{{service_type}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Лікар:</span>
                    <span class="detail-value">{{doctor_name}}</span>
                </div>
            </div>
            
            <!-- Location Info -->
            <div class="location-info">
                <strong>Адреса клініки:</strong><br/>
                Вулиця Сумська, 10, Львів<br/>
                Телефон: +38 (0XX) XXX-XXXX<br/>
                <a href="https://maps.google.com" style="color: #5A8A94;">📍 Відкрити в Google Maps</a>
            </div>
            
            <!-- Reminder -->
            <div class="reminder">
                <strong>⏰ Напомена:</strong> Будь ласка, приїдьте на 10-15 хвилин раніше для заповнення документів. Якщо вам потрібно скасувати або перенести запис, звяжіться з нами якомога раніше.
            </div>
            
            <!-- CTA Button -->
            <p style="text-align: center;">
                <a href="{{patient_portal_link}}" class="cta-button">Управління записом</a>
            </p>
            
            <p>Якщо у вас є питання, зв'яжіться з нами:</p>
            <ul style="margin-left: 20px; margin-bottom: 20px;">
                <li>📞 Телефон: +38 (0XX) XXX-XXXX</li>
                <li>📧 Email: info@dentalstory.ua</li>
                <li>💬 Написати на WhatsApp: {{whatsapp_link}}</li>
            </ul>
            
            <p>З повагою,<br/>
            <strong>Команда Dental Story</strong><br/>
            Ваш партнер у здоровому посміхові</p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <p><strong>Dental Story</strong> | Вулиця Сумська, 10, Львів</p>
            <p>Телефон: +38 (0XX) XXX-XXXX | Email: info@dentalstory.ua</p>
            <p>
                <a href="https://facebook.com/dentalstory">Facebook</a> | 
                <a href="https://instagram.com/dentalstory">Instagram</a> | 
                <a href="https://www.dentalstory.ua">Вебсайт</a>
            </p>
            <p style="margin-top: 15px; font-size: 11px;">
                <a href="{{unsubscribe_link}}">Скасувати підписку</a> | 
                <a href="{{privacy_policy_link}}">Політика приватності</a>
            </p>
        </div>
    </div>
</body>
</html>
```

### Email Template 2: Post-Treatment Follow-Up

```html
<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Як вам пройшов прийом?</title>
    <style>
        /* Same base styles as above */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Roboto', Arial, sans-serif; background-color: #F5F3F1; }
        .container { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; }
        .header { background-color: #5A8A94; padding: 30px; text-align: center; color: #FFFFFF; }
        .content { padding: 40px 30px; }
        .success-box { background-color: #EFF9F6; border-left: 4px solid #7FBA9F; padding: 20px; margin: 20px 0; }
        .cta-button { display: inline-block; background-color: #5A8A94; color: #FFFFFF; padding: 14px 28px; text-decoration: none; border-radius: 6px; }
        .footer { background-color: #1a2c30; padding: 30px; text-align: center; color: #AECED3; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 style="font-family: 'Stolzl', Arial; font-size: 28px; margin: 0;">Дякуємо за вашу огляд!</h1>
        </div>
        
        <div class="content">
            <p>Привіт, <strong>{{patient_name}}</strong>,</p>
            
            <p>Ми сподіваємось, вам сподобався ваш недавній прийом у Dental Story. Ось кілька поради для оптимального результату:</p>
            
            <div class="success-box">
                <strong>✓ Поточні рекомендації:</strong>
                <ul style="margin-left: 20px; margin-top: 10px; line-height: 1.8;">
                    <li>Уникайте гарячої їжі та напитків протягом 2 годин</li>
                    <li>Не жуйте на оброблену сторону протягом 24 годин</li>
                    <li>Використовуйте м'яку зубну щітку протягом наступних 3 днів</li>
                    <li>При болі приймайте легкі знеболювальні засоби</li>
                </ul>
            </div>
            
            <p><strong>Наступні кроки:</strong></p>
            <p>Ваш наступний прийом заплановано на <strong>{{next_appointment_date}}</strong>. Это важливо для контролю результату лікування.</p>
            
            <p style="text-align: center;">
                <a href="{{review_link}}" class="cta-button">Поділитися своїм враженням</a>
            </p>
            
            <p style="background-color: #FFF8E8; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <strong>Залишили відгук?</strong> Ми дуже цінимо вашу думку! Поділіться враженнями на Google Reviews або Facebook — це допомагає іншим пацієнтам знайти якісну стоматологічну допомогу.
            </p>
            
            <p>З повагою,<br/>
            <strong>Команда Dental Story</strong></p>
        </div>
        
        <div class="footer">
            <p>Стоматологічна клініка "Dental Story" | Львів</p>
            <p><a href="{{unsubscribe_link}}" style="color: #AECED3;">Скасувати підписку</a></p>
        </div>
    </div>
</body>
</html>
```

---

## PART II: SOCIAL MEDIA TEMPLATES

### Instagram Post Template CSS (Figma Export)

```css
/* Instagram Post Container: 1200x1200px */
.instagram-post {
    width: 1200px;
    height: 1200px;
    background: linear-gradient(135deg, #AECED3 0%, #5A8A94 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    font-family: 'Stolzl', 'Roboto', sans-serif;
}

/* Content Area (Safe Zone) */
.instagram-post__content {
    width: 1080px;
    height: 1080px;
    background-color: #FFFFFF;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px;
    text-align: center;
    position: relative;
}

/* Service Highlight Variant */
.instagram-post--service {
    background-color: #AECED3;
}

.instagram-post--service__icon {
    width: 180px;
    height: 180px;
    margin-bottom: 40px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 120px;
}

.instagram-post--service__headline {
    font-size: 48px;
    font-weight: 700;
    color: #FFFFFF;
    font-family: 'Stolzl', sans-serif;
    margin-bottom: 20px;
    line-height: 1.2;
}

.instagram-post--service__description {
    font-size: 24px;
    color: #FFFFFF;
    font-family: 'Roboto', sans-serif;
    margin-bottom: 40px;
    opacity: 0.95;
}

.instagram-post--service__cta {
    font-size: 16px;
    color: #FFFFFF;
    font-family: 'Roboto', sans-serif;
    text-transform: uppercase;
    letter-spacing: 1px;
    opacity: 0.8;
}

/* Logo Placement (Top-Right) */
.instagram-post__logo {
    position: absolute;
    top: 30px;
    right: 30px;
    width: 48px;
    height: 48px;
    background-color: rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
}

/* Testimonial Variant */
.instagram-post--testimonial {
    background-color: #FFFFFF;
}

.instagram-post--testimonial__avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    margin-bottom: 30px;
    border: 4px solid #AECED3;
    background-size: cover;
    background-position: center;
}

.instagram-post--testimonial__quote {
    font-size: 32px;
    font-family: 'Roboto', sans-serif;
    font-style: italic;
    color: #2C3E42;
    margin-bottom: 20px;
    line-height: 1.4;
    max-width: 800px;
}

.instagram-post--testimonial__attribution {
    font-size: 18px;
    font-family: 'Stolzl', sans-serif;
    color: #2C3E42;
    margin-bottom: 10px;
}

.instagram-post--testimonial__rating {
    font-size: 20px;
    color: #FFB800;
}

/* Responsive Story Template (1080x1920px) */
.instagram-story {
    width: 1080px;
    height: 1920px;
    background-color: #AECED3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 60px;
    padding-bottom: 60px;
    position: relative;
    overflow: hidden;
}

.instagram-story__header {
    font-size: 48px;
    font-family: 'Stolzl', sans-serif;
    font-weight: 700;
    color: #FFFFFF;
    margin-bottom: 40px;
    text-align: center;
}

.instagram-story__content {
    background-color: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    padding: 40px;
    max-width: 900px;
    margin-bottom: 40px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.instagram-story__cta {
    position: absolute;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #E8A366;
    color: #FFFFFF;
    padding: 16px 32px;
    border-radius: 30px;
    font-size: 16px;
    font-family: 'Stolzl', sans-serif;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
}
```

### Instagram Post Template HTML Example

```html
<div class="instagram-post instagram-post--service">
    <div class="instagram-post__content">
        <div class="instagram-post__logo">🦷</div>
        
        <div class="instagram-post--service__icon">🪥</div>
        
        <h1 class="instagram-post--service__headline">
            Professional Cleaning
        </h1>
        
        <p class="instagram-post--service__description">
            Fresh, healthy smile starts here
        </p>
        
        <p class="instagram-post--service__cta">
            Link in bio to book 💙
        </p>
    </div>
</div>
```

---

## PART III: UI COMPONENTS (React/TypeScript)

### Button Component

```typescript
// components/Button.tsx
import React from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  className?: string
  children: React.ReactNode
  type?: 'button' | 'submit' | 'reset'
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  children,
  type = 'button',
}) => {
  const baseStyles = 'font-stolzl font-medium rounded-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer'
  
  const variantStyles = {
    primary: 'bg-[#5A8A94] text-white hover:bg-[#2C3E42] disabled:bg-gray-400',
    secondary: 'border-2 border-[#5A8A94] text-[#5A8A94] bg-white hover:bg-[#F5F3F1] disabled:border-gray-400 disabled:text-gray-400',
    tertiary: 'text-[#5A8A94] hover:text-[#2C3E42] hover:underline disabled:text-gray-400',
  }
  
  const sizeStyles = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-7 py-3 text-base',
    large: 'px-8 py-4 text-lg',
  }
  
  const disabledStyles = disabled ? 'opacity-60 cursor-not-allowed' : ''
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
    >
      {loading && <span className="animate-spin">⏳</span>}
      {children}
    </button>
  )
}
```

### Form Input Component

```typescript
// components/FormInput.tsx
import React from 'react'

interface FormInputProps {
  label?: string
  placeholder?: string
  type?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
  autocomplete?: string
}

export const FormInput: React.FC<FormInputProps> = ({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  className = '',
  autocomplete,
}) => {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-[#2C3E42]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        autoComplete={autocomplete}
        className={`
          px-3 py-2 rounded-md border text-sm font-roboto
          transition-all duration-200
          ${error ? 'border-[#D97760] bg-red-50' : 'border-[#AECED3] hover:border-[#5A8A94]'}
          focus:outline-none focus:border-[#5A8A94] focus:ring-2 focus:ring-[#5A8A94] focus:ring-opacity-20
          disabled:bg-gray-100 disabled:cursor-not-allowed
          placeholder-gray-400
        `}
      />
      
      {error && <p className="text-xs text-[#D97760] flex items-center gap-1">⚠ {error}</p>}
    </div>
  )
}
```

### Appointment Calendar Component

```typescript
// components/AppointmentCalendar.tsx
import React, { useState } from 'react'

interface TimeSlot {
  time: string
  available: boolean
}

interface CalendarProps {
  onDateTimeSelect: (date: Date, time: string) => void
  availableSlots: TimeSlot[]
}

export const AppointmentCalendar: React.FC<CalendarProps> = ({
  onDateTimeSelect,
  availableSlots,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }
  
  const handleDateSelect = (day: number) => {
    const newDate = new Date(new Date().getFullYear(), new Date().getMonth(), day)
    setSelectedDate(newDate)
    setSelectedTime(null)
  }
  
  const handleTimeSelect = (time: string) => {
    setSelectedTime(time)
    if (selectedDate) {
      onDateTimeSelect(selectedDate, time)
    }
  }
  
  const today = new Date()
  const daysInMonth = getDaysInMonth(today)
  const firstDay = getFirstDayOfMonth(today)
  
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  
  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg border border-[#AECED3]">
      <h3 className="text-xl font-bold text-[#2C3E42] mb-6">Виберіть дату</h3>
      
      {/* Calendar Grid */}
      <div className="mb-8">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-[#6B8388] py-2">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`}></div>
          ))}
          
          {calendarDays.map(day => (
            <button
              key={day}
              onClick={() => handleDateSelect(day)}
              className={`
                py-2 px-1 rounded text-sm font-medium transition-all
                ${selectedDate?.getDate() === day
                  ? 'bg-[#5A8A94] text-white'
                  : 'bg-white text-[#2C3E42] border border-[#AECED3] hover:border-[#5A8A94]'
                }
              `}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      
      {/* Time Slots */}
      {selectedDate && (
        <div>
          <h4 className="text-sm font-medium text-[#2C3E42] mb-3">Виберіть час</h4>
          <div className="grid grid-cols-3 gap-2">
            {availableSlots.map(slot => (
              <button
                key={slot.time}
                onClick={() => slot.available && handleTimeSelect(slot.time)}
                disabled={!slot.available}
                className={`
                  py-2 px-1 rounded text-xs font-medium transition-all
                  ${!slot.available
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : selectedTime === slot.time
                    ? 'bg-[#5A8A94] text-white'
                    : 'bg-white text-[#2C3E42] border border-[#AECED3] hover:border-[#5A8A94]'
                  }
                `}
              >
                {slot.time}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
```

### Appointment Form Component

```typescript
// components/AppointmentForm.tsx
import React, { useState } from 'react'
import { FormInput } from './FormInput'
import { Button } from './Button'

interface FormData {
  firstName: string
  lastName: string
  email: string
  phone: string
  serviceType: string
  reason: string
}

interface AppointmentFormProps {
  onSubmit: (data: FormData, dateTime: { date: Date; time: string }) => void
  isLoading?: boolean
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    serviceType: '',
    reason: '',
  })
  
  const [errors, setErrors] = useState<Partial<FormData>>({})
  const [selectedDateTime, setSelectedDateTime] = useState<{ date: Date; time: string } | null>(null)
  
  const validateForm = () => {
    const newErrors: Partial<FormData> = {}
    
    if (!formData.firstName.trim()) newErrors.firstName = 'Ім\'я обов\'язкове'
    if (!formData.lastName.trim()) newErrors.lastName = 'Прізвище обов\'язкове'
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = 'Невірна адреса email'
    if (!formData.phone.match(/^\+?[\d\s\-()]{10,}$/)) newErrors.phone = 'Невірний номер телефону'
    if (!formData.serviceType) newErrors.serviceType = 'Виберіть послугу'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm() && selectedDateTime) {
      onSubmit(formData, selectedDateTime)
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg mx-auto p-6 bg-white rounded-lg border border-[#AECED3]">
      <h2 className="text-2xl font-bold text-[#2C3E42] mb-6">Запис на прийом</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <FormInput
          label="Ім\'я"
          placeholder="Іван"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          error={errors.firstName}
          required
          autocomplete="given-name"
        />
        <FormInput
          label="Прізвище"
          placeholder="Петренко"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          error={errors.lastName}
          required
          autocomplete="family-name"
        />
      </div>
      
      <FormInput
        label="Email"
        type="email"
        placeholder="ivan@example.com"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        required
        autocomplete="email"
        className="mb-4"
      />
      
      <FormInput
        label="Телефон"
        type="tel"
        placeholder="+38 (0XX) XXX-XXXX"
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        required
        autocomplete="tel"
        className="mb-4"
      />
      
      <div className="mb-4">
        <label className="text-sm font-medium text-[#2C3E42] block mb-2">
          Послуга <span className="text-red-500">*</span>
        </label>
        <select
          name="serviceType"
          value={formData.serviceType}
          onChange={handleChange}
          className="w-full px-3 py-2 rounded-md border border-[#AECED3] text-sm focus:border-[#5A8A94] focus:ring-2 focus:ring-[#5A8A94] focus:ring-opacity-20"
        >
          <option value="">Виберіть послугу...</option>
          <option value="cleaning">Професійна чистка</option>
          <option value="whitening">Відбілювання</option>
          <option value="filling">Пломбування</option>
          <option value="root-canal">Лікування каналу</option>
          <option value="orthodontics">Ортодонтія</option>
        </select>
      </div>
      
      <div className="mb-6">
        <label className="text-sm font-medium text-[#2C3E42] block mb-2">
          Причина візиту
        </label>
        <textarea
          name="reason"
          placeholder="Розкажіть про вашу проблему..."
          value={formData.reason}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 rounded-md border border-[#AECED3] text-sm font-roboto focus:border-[#5A8A94] focus:ring-2 focus:ring-[#5A8A94] focus:ring-opacity-20"
        />
      </div>
      
      <div className="flex gap-3">
        <Button type="submit" loading={isLoading}>
          Завершити запис
        </Button>
        <Button type="button" variant="secondary">
          Скасувати
        </Button>
      </div>
    </form>
  )
}
```

---

## PART IV: TAILWIND CSS CONFIGURATION

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dental: {
          primary: '#AECED3',
          'primary-dark': '#5A8A94',
          'primary-darker': '#2C3E42',
          secondary: '#D1CAC0',
          dark: '#1a2c30',
          text: '#4A5E63',
          'text-light': '#6B8388',
          success: '#7FBA9F',
          warning: '#E8A366',
          error: '#D97760',
          background: '#F5F3F1',
        },
      },
      fontFamily: {
        stolzl: ['Stolzl', 'sans-serif'],
        roboto: ['Roboto', 'sans-serif'],
        sans: ['Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '6px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
    },
  },
  plugins: [],
}
```

---

## PRODUCTION CHECKLIST

### Email Templates
- [ ] Test in Outlook, Gmail, Apple Mail, iOS Mail, Gmail Mobile
- [ ] Verify all links work (calendar, patient portal, social media)
- [ ] Confirm template variables ({{patient_name}}, etc.) are set up in email service
- [ ] Test unsubscribe link functionality
- [ ] Check image alt text on all images

### Social Media Templates
- [ ] Create 4 template variations (Service, Testimonial, Tip, Behind-scenes)
- [ ] Test rendering at full size (1200x1200) and in feed preview
- [ ] Verify all CTAs work (link in bio, swipe up, etc.)
- [ ] Create posting schedule (3x/week recommended)
- [ ] Set up Instagram Insights tracking

### React Components
- [ ] Test all components on mobile, tablet, desktop
- [ ] Verify form validation works correctly
- [ ] Test form submission with backend API
- [ ] Ensure accessibility (keyboard navigation, screen reader)
- [ ] Test loading and error states
- [ ] Performance test (render performance in dev tools)

### Integration
- [ ] Connect forms to appointment booking backend
- [ ] Set up email notifications
- [ ] Configure calendar to pull available slots from backend
- [ ] Test end-to-end booking flow
- [ ] Set up analytics tracking on all conversions

---

**Templates ready for development handoff. Next: Task #5 — Launch recommendations and growth plan**
