export const CARD_VARIANT_CLASSES = {
  default: 'bg-white shadow-xs',
  elevated: 'bg-white shadow-lg',
  outlined: 'bg-white border-2 border-dental-secondary-200',
  filled: 'bg-dental-secondary-50',
  dark: 'bg-dental-primary-800 text-white',
  brand: 'bg-dental-primary-50 border border-dental-primary-200',
  selected:
    'bg-white border-2 border-dental-primary-600 shadow-md ring-2 ring-dental-primary-200',
  ghost: 'bg-transparent border border-dental-secondary-200',
} as const

export type CardVariant = keyof typeof CARD_VARIANT_CLASSES
