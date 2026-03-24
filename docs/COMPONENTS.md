# Component Library Documentation

**DentalStory Component Library** - Reusable React components with TypeScript, accessibility, and best practices.

> **52 components** across UI primitives, forms, layout, booking, chat, AI, and admin.

## Quick Links

- [UI Components](#ui-components)
- [Form Components](#form-components)
- [Layout Components](#layout-components)
- [Utility Components](#utility-components)
- [Best Practices](#best-practices)

---

## UI Components

### Button

**Location**: `src/components/ui/Button.tsx`

**Description**: Accessible button component with multiple variants and sizes.

**Props**:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}
```

**Usage**:

```tsx
import { Button } from '@/components/ui'

// Primary button
<Button variant="primary" size="lg">
  Записатися
</Button>

// With loading state
<Button isLoading disabled>
  Завантаження...
</Button>

// With icons
<Button leftIcon={<Send />}>
  Надіслати
</Button>

// Full width
<Button fullWidth variant="secondary">
  Скасувати
</Button>
```

**Accessibility**:

- ✅ Keyboard accessible (Enter, Space)
- ✅ Focus indicators
- ✅ Disabled state with `aria-disabled`
- ✅ Loading state with `aria-busy`

**Performance**: Lightweight, no heavy dependencies

---

### Input

**Location**: `src/components/ui/Input.tsx`

**Description**: Form input with validation, error display, and helper text.

**Props**:

```typescript
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}
```

**Usage**:

```tsx
import { Input } from '@/components/ui'

// Basic input
<Input
  label="Ім'я"
  placeholder="Введіть ваше ім'я"
  required
/>

// With error
<Input
  label="Email"
  type="email"
  error="Невірний формат email"
/>

// With helper text
<Input
  label="Телефон"
  helperText="+380 XX XXX XX XX"
/>

// Full width
<Input fullWidth label="Коментар" />
```

**Accessibility**:

- ✅ Associated labels (`htmlFor` + `id`)
- ✅ Error messages with `role="alert"`
- ✅ `aria-invalid` on errors
- ✅ `aria-describedby` for helper text

**Best Practices**:

- Always provide labels
- Use semantic input types (`email`, `tel`, `url`)
- Show errors near the field

---

### Textarea

**Location**: `src/components/ui/Input.tsx`

**Props**:

```typescript
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}
```

**Usage**:

```tsx
<Textarea
  label="Повідомлення"
  rows={4}
  placeholder="Опишіть ваше питання"
  maxLength={500}
/>
```

---

### Select

**Location**: `src/components/ui/Input.tsx`

**Props**:

```typescript
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  children: React.ReactNode
}
```

**Usage**:

```tsx
<Select label="Послуга" required>
  <option value="">Оберіть послугу</option>
  <option value="consultation">Консультація</option>
  <option value="cleaning">Чистка</option>
</Select>
```

---

### Card

**Location**: `src/components/ui/Card.tsx`

**Description**: Container component for grouping related content.

**Props**:

```typescript
interface CardProps {
  children: React.ReactNode
  variant?: 'default' | 'bordered' | 'elevated'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  className?: string
}
```

**Usage**:

```tsx
import { Card } from '@/components/ui'
;<Card variant="elevated" padding="lg">
  <h3>Наші послуги</h3>
  <p>Професійна стоматологія</p>
</Card>
```

**Best Practices**:

- Use for content grouping
- Maintain consistent spacing
- Don't nest cards too deeply

---

### Spinner

**Location**: `src/components/ui/Spinner.tsx`

**Description**: Loading spinner with accessibility support.

**Props**:

```typescript
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
  label?: string
}
```

**Usage**:

```tsx
<Spinner size="lg" label="Завантаження даних..." />
```

**Accessibility**:

- ✅ `role="status"`
- ✅ `aria-label` for screen readers
- ✅ Hidden label text (`sr-only`)

---

### LazyImage

**Location**: `src/components/ui/LazyImage.tsx`

**Description**: Optimized image with lazy loading and placeholder.

**Props**:

```typescript
interface LazyImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
  className?: string
}
```

**Usage**:

```tsx
<LazyImage
  src="/images/clinic.webp"
  alt="Dental Story Clinic"
  width={800}
  height={600}
  placeholder="data:image/svg+xml..."
/>
```

**Performance**:

- ✅ Native lazy loading (`loading="lazy"`)
- ✅ Intersection Observer fallback
- ✅ Blur-up placeholder effect
- ✅ Automatic WebP detection

**Best Practices**:

- Always provide `alt` text
- Specify dimensions to prevent layout shift
- Use optimized image formats (WebP, AVIF)

---

### ResponsiveImage

**Location**: `src/components/ui/ResponsiveImage.tsx`

**Description**: Picture element with multiple sources for responsive images.

**Props**:

```typescript
interface ResponsiveImageProps {
  src: string
  alt: string
  sources?: Array<{
    srcSet: string
    media?: string
    type?: string
  }>
  loading?: 'lazy' | 'eager'
}
```

**Usage**:

```tsx
<ResponsiveImage
  src="/images/hero.jpg"
  alt="Hero image"
  sources={[
    {
      srcSet: '/images/hero-mobile.webp',
      media: '(max-width: 768px)',
      type: 'image/webp',
    },
    { srcSet: '/images/hero-desktop.webp', type: 'image/webp' },
  ]}
  loading="eager"
/>
```

---

### LoadingOverlay

**Location**: `src/components/ui/LoadingOverlay.tsx`

**Description**: Full-screen or container overlay with loading state.

**Props**:

```typescript
interface LoadingOverlayProps {
  show: boolean
  message?: string
  blur?: boolean
}
```

**Usage**:

```tsx
<div className="relative">
  <MyContent />
  <LoadingOverlay show={isLoading} message="Завантажуємо вільні години..." />
</div>
```

**Accessibility**:

- ✅ `aria-live="polite"` for status updates
- ✅ Focus trap when active
- ✅ Escape key to cancel (if dismissible)

---

### ProgressBar

**Location**: `src/components/ui/ProgressBar.tsx`

**Description**: Progress indicator for multi-step forms or loading.

**Props**:

```typescript
interface ProgressBarProps {
  current: number
  total: number
  label?: string
  variant?: 'linear' | 'circular'
}
```

**Usage**:

```tsx
<ProgressBar current={2} total={3} label="Крок 2 з 3" />
```

**Accessibility**:

- ✅ `role="progressbar"`
- ✅ `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- ✅ `aria-label` for context

---

### FocusTrap

**Location**: `src/components/ui/FocusTrap.tsx`

**Description**: Traps keyboard focus within a container (for modals, dialogs).

**Props**:

```typescript
interface FocusTrapProps {
  children: React.ReactNode
  active?: boolean
  onEscape?: () => void
}
```

**Usage**:

```tsx
<FocusTrap active={isModalOpen} onEscape={closeModal}>
  <Dialog>
    <h2>Підтвердження</h2>
    <Button onClick={closeModal}>Закрити</Button>
  </Dialog>
</FocusTrap>
```

**Accessibility**:

- ✅ Keyboard navigation (Tab, Shift+Tab)
- ✅ Escape key handling
- ✅ Focus return to trigger element

---

### LiveRegion

**Location**: `src/components/ui/LiveRegion.tsx`

**Description**: Announces dynamic content changes to screen readers.

**Props**:

```typescript
interface LiveRegionProps {
  message?: string
  politeness?: 'polite' | 'assertive' | 'off'
}
```

**Usage**:

```tsx
// Global live region (in App.tsx)
;<LiveRegion />

// Announce message programmatically
liveRegionManager.announce('Form submitted successfully!')
```

**Accessibility**:

- ✅ `aria-live="polite"` by default
- ✅ `role="status"` for updates
- ✅ Auto-clear after announcement

---

### Logo

**Location**: `src/components/ui/Logo.tsx`

**Description**: Application logo with link to home.

**Props**:

```typescript
interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon'
  className?: string
}
```

**Usage**:

```tsx
<Logo size="lg" variant="full" />
```

---

## Form Components

### ContactForm

**Location**: `src/components/ContactForm.tsx`

**Description**: Contact inquiry form with Turnstile verification.

**Features**:

- React Hook Form + Zod validation
- Turnstile CAPTCHA
- Submission cooldown (30s)
- Auto phone formatting
- Success feedback with MicroFeedback

**Usage**:

```tsx
<ContactForm onSuccess={() => console.log('Sent!')} />
```

**Best Practices**:

- Pre-fill known user data
- Show clear success/error messages
- Maintain form state during submission

---

### BookingForm

**Location**: `src/components/BookingForm.tsx`

**Description**: Multi-step appointment booking wizard.

**Features**:

- 3-step wizard: DateTime → Personal → Confirmation
- Inline editing in confirmation step
- Available slots API integration
- Form state persistence
- Progress indicator

**Usage**:

```tsx
<BookingForm onSuccess={appointment => router.push('/booking/success')} />
```

**Steps**:

1. **Step 1**: Service, Doctor, Date, Time
2. **Step 2**: Name, Phone, Email, DOB
3. **Step 3**: Review & Submit

---

### CallbackRequest

**Location**: `src/components/CallbackRequest.tsx`

**Description**: Quick callback request form (minimal fields).

**Usage**:

```tsx
<CallbackRequest defaultService="Консультація" onSuccess={handleSuccess} />
```

---

## Layout Components

### Header

**Location**: `src/components/Header.tsx`

**Description**: Main navigation header with mobile menu.

**Features**:

- Responsive burger menu
- Sticky positioning
- Active link highlighting
- Accessibility shortcuts
- Phone/emergency links

**Best Practices**:

- Keep navigation items focused
- Highlight current page
- Provide skip links

---

### Footer

**Location**: `src/components/Footer.tsx`

**Description**: Site footer with links, contact info, social media.

**Features**:

- Contact information
- Working hours
- Social media links
- Legal links (Privacy, Terms)
- Newsletter subscription

---

### AccessibilityProvider

**Location**: `src/components/AccessibilityProvider.tsx`

**Description**: Context provider for accessibility preferences.

**Features**:

- High contrast mode
- Larger text
- Reduced motion
- Keyboard navigation
- Screen reader optimizations

**Usage**:

```tsx
// Already wrapped in App.tsx
import { useAccessibility } from '@/hooks/useAccessibility'

function MyComponent() {
  const { highContrast, largerText } = useAccessibility()

  return <div className={highContrast ? 'high-contrast' : ''}>Content</div>
}
```

---

### AccessibilityPanel

**Location**: `src/components/AccessibilityPanel.tsx`

**Description**: Floating panel for accessibility controls.

**Usage**:

```tsx
// Already in App.tsx
<AccessibilityPanel />
```

---

## Utility Components

### ErrorBoundary

**Location**: `src/components/ErrorBoundary.tsx`

**Description**: Catches JavaScript errors and shows fallback UI.

**Usage**:

```tsx
<ErrorBoundary>
  <MyComponent />
</ErrorBoundary>
```

**Features**:

- Error logging to Sentry
- User-friendly fallback UI
- Reset functionality
- Dev mode stack trace

---

### PerformanceMetrics

**Location**: `src/components/PerformanceMetrics.tsx`

**Description**: Monitors and reports Core Web Vitals.

**Metrics**:

- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)
- FCP (First Contentful Paint)
- TTFB (Time to First Byte)

**Usage**:

```tsx
// Already in App.tsx
<PerformanceMetrics />
```

---

### ResourcePreloader

**Location**: `src/components/ResourcePreloader.tsx`

**Description**: Preloads critical resources (fonts, images).

**Usage**:

```tsx
<ResourcePreloader
  fonts={['/fonts/inter.woff2']}
  images={['/images/hero.webp']}
/>
```

---

### StructuredData

**Location**: `src/components/StructuredData.tsx`

**Description**: Adds JSON-LD structured data for SEO.

**Types**:

- Organization
- LocalBusiness
- Service
- Review

**Usage**:

```tsx
<StructuredData type="organization" />
<StructuredData type="localBusiness" />
```

---

### MicroFeedback

**Location**: `src/components/MicroFeedback.tsx`

**Description**: Collects quick user feedback after form submission.

**Usage**:

```tsx
<MicroFeedback form="contact" />
```

**UI**: 😊 Добре | 😐 Норм | 😞 Погано

---

### Turnstile

**Location**: `src/components/Turnstile.tsx`

**Description**: Cloudflare Turnstile CAPTCHA widget.

**Usage**:

```tsx
const turnstileRef = useRef<TurnstileRef>(null)

<Turnstile
  ref={turnstileRef}
  onVerify={(token) => setToken(token)}
/>

// Get token
const token = turnstileRef.current?.getToken()
```

---

## Best Practices

### Component Design

1. **Single Responsibility** - One component, one purpose
2. **Composability** - Build complex UIs from simple components
3. **Props Over State** - Prefer controlled components
4. **TypeScript** - Always type props and state
5. **Accessibility First** - WCAG 2.1 AA compliance

### Naming Conventions

```typescript
// Components: PascalCase
Button.tsx
ContactForm.tsx

// Hooks: camelCase with 'use' prefix
useAccessibility.ts
useSubmissionCooldown.ts

// Utils: camelCase
validation.ts
formatPhoneNumber.ts

// Types: PascalCase
interface ButtonProps {}
type ServiceCategory = 'therapeutic' | 'surgical'
```

### File Structure

```
src/components/
├── ui/                  # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── __tests__/
├── ContactForm.tsx      # Feature components
├── BookingForm.tsx
└── __tests__/
```

### Props Interface

```typescript
// ✅ Good - extends HTML props
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  isLoading?: boolean
}

// ❌ Bad - missing HTML props
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
}
```

### Accessibility Checklist

- [ ] Semantic HTML (`<button>`, `<nav>`, `<main>`)
- [ ] ARIA labels where needed
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Focus indicators
- [ ] Color contrast (4.5:1)
- [ ] Screen reader tested
- [ ] Error messages linked to inputs
- [ ] Loading states announced

### Performance

1. **Code Splitting** - Use `React.lazy()` for routes
2. **Memoization** - `React.memo()` for expensive renders
3. **Image Optimization** - WebP, lazy loading, dimensions
4. **Bundle Analysis** - Keep chunks < 250KB
5. **Tree Shaking** - Import only what you need

### Testing

```typescript
// Test user behavior, not implementation
describe('Button', () => {
  it('calls onClick when clicked', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)

    await userEvent.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
```

---

## Component Checklist

Use this checklist when creating new components:

- [ ] TypeScript props interface defined
- [ ] Accessibility attributes added
- [ ] Responsive design (mobile-first)
- [ ] Error states handled
- [ ] Loading states handled
- [ ] Unit tests written
- [ ] Documented in this file
- [ ] Performance tested
- [ ] Browser tested (Chrome, Firefox, Safari)

---

## Full Component Inventory

Components not individually documented above:

| Component               | Location                                         | Purpose                                          |
| ----------------------- | ------------------------------------------------ | ------------------------------------------------ |
| `SVGFilters`            | `src/components/SVGFilters.tsx`                  | SVG filter definitions for visual effects        |
| `ResourcePreloader`     | `src/components/ResourcePreloader.tsx`           | Preloads critical fonts, images, and scripts     |
| `PerformanceMetrics`    | `src/components/PerformanceMetrics.tsx`          | Web Vitals reporting component                   |
| `MicroFeedback`         | `src/components/MicroFeedback.tsx`               | Thumbs up/down feedback widget for forms         |
| `SmartRecommendations`  | `src/components/SmartRecommendations.tsx`        | AI-powered service recommendations               |
| `VideoTestimonials`     | `src/components/VideoTestimonials.tsx`           | Video testimonial carousel                       |
| `ReminderSettings`      | `src/components/ReminderSettings.tsx`            | Appointment reminder preferences                 |
| `PriceCalculator`       | `src/components/PriceCalculator.tsx`             | Interactive price calculator                     |
| `RadialMenu`            | `src/components/RadialMenu.tsx`                  | Floating radial action menu                      |
| `ClientFloatingButtons` | `src/components/ClientFloatingButtons.tsx`       | Container for RadialMenu + AccessibilityPanel    |
| `LiveChat`              | `src/components/LiveChat.tsx`                    | Patient live chat widget                         |
| `AIAssistant`           | `src/components/AIAssistant.tsx`                 | AI chat assistant component                      |
| `Turnstile`             | `src/components/Turnstile.tsx`                   | Cloudflare Turnstile CAPTCHA wrapper             |
| `BookingStepPersonal`   | `src/components/booking/BookingStepPersonal.tsx` | Booking form personal info step                  |
| `BookingStepService`    | `src/components/booking/BookingStepService.tsx`  | Booking form service selection step              |
| `BookingSummary`        | `src/components/booking/BookingSummary.tsx`      | Booking confirmation summary                     |
| `EditableField`         | `src/components/booking/EditableField.tsx`       | Inline-editable field in booking review          |
| `useBookingForm`        | `src/components/booking/useBookingForm.ts`       | Booking form state management hook               |
| `AsyncState`            | `src/components/ui/AsyncState.tsx`               | Loading / error / empty state wrapper            |
| `LiveRegion`            | `src/components/ui/LiveRegion.tsx`               | ARIA live region for screen reader announcements |
| `LoadingOverlay`        | `src/components/ui/LoadingOverlay.tsx`           | Full-screen loading indicator                    |
| `CustomSelect`          | `src/components/ui/CustomSelect.tsx`             | Accessible custom dropdown (combobox pattern)    |

---

## Resources

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [React Hook Form](https://react-hook-form.com/)

---

**Component Count**: 52 reusable components  
**Framework**: React 18 + TypeScript + Tailwind CSS
