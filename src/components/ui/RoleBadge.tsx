import clsx from 'clsx'
import {
  Crown,
  SlidersHorizontal,
  Stethoscope,
  Users,
  IdCard,
  Receipt,
  BarChart3,
  Package,
  User,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { AdminRole } from '@/lib/permissions'

export interface RoleBadgeProps {
  role: AdminRole | 'staff' | (string & {})
  className?: string
}

/*
 * Бейджі ролей (макет 1i): одна формула на всі ролі — tier-tint фон +
 * tier-ink текст + Lucide-іконка. Тон кодує рівень доступу (темніший →
 * вища влада), іконка несе ідентичність ролі. Жодних сторонніх палітр.
 */
const roleStyles: Record<string, { classes: string; icon: LucideIcon }> = {
  // Керівництво — суцільна темна заливка
  superadmin: { classes: 'bg-dental-dark text-white', icon: Crown },
  admin: {
    classes: 'bg-dental-primary-600 text-white',
    icon: SlidersHorizontal,
  },
  // Клінічні — teal-тінти
  doctor: {
    classes: 'bg-role-clinical-100 text-role-clinical-700',
    icon: Stethoscope,
  },
  assistant: {
    classes: 'bg-role-clinical-soft-100 text-role-clinical-soft-700',
    icon: Users,
  },
  // Операційні — теплі нейтральні тінти
  receptionist: { classes: 'bg-role-ops-100 text-role-ops-700', icon: IdCard },
  billing_manager: {
    classes: 'bg-role-ops-200 text-role-ops-700',
    icon: Receipt,
  },
  analyst: { classes: 'bg-role-ops-200 text-role-ops-700', icon: BarChart3 },
  inventory_manager: {
    classes: 'bg-status-neutral-100 text-status-neutral-700',
    icon: Package,
  },
  // Легасі-рядки (grandfathered `staff`) і невідомі ролі — нейтральний тінт
  staff: {
    classes: 'bg-status-neutral-100 text-status-neutral-700',
    icon: User,
  },
}

const fallbackStyle = {
  classes: 'bg-status-neutral-100 text-status-neutral-700',
  icon: User,
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useTranslation()
  const { classes, icon: Icon } = roleStyles[role] ?? fallbackStyle
  const label = t(`admin.roles.${role}`, { defaultValue: role })

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap',
        classes,
        className
      )}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {label}
    </span>
  )
}
