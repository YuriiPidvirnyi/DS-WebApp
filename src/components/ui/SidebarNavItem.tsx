'use client'

import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'

interface SidebarNavItemProps {
  href: string
  icon: ReactNode
  label: ReactNode
  active: boolean
  /** Optional badge (e.g. "soon"). When present, suppresses the active chevron. */
  badge?: ReactNode
  onClick?: () => void
  tabIndex?: number
}

/**
 * Canonical sidebar navigation link used by both admin and cabinet shells.
 * Active state: brand-primary fill + soft brand shadow. Idle: dental-text with secondary hover.
 * Always includes a visible focus ring for keyboard users.
 */
export default function SidebarNavItem({
  href,
  icon,
  label,
  active,
  badge,
  onClick,
  tabIndex,
}: SidebarNavItemProps) {
  const base =
    'flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-dental-primary-500'
  const state = active
    ? 'bg-dental-primary-600 text-white shadow-md shadow-dental-primary-600/25'
    : 'text-dental-text hover:bg-dental-secondary-50'

  return (
    <Link
      href={href}
      onClick={onClick}
      tabIndex={tabIndex}
      aria-current={active ? 'page' : undefined}
      className={`${base} ${state}`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-dental-secondary-200 text-dental-muted font-medium">
          {badge}
        </span>
      )}
      {active && !badge && <ChevronRight className="w-4 h-4" />}
    </Link>
  )
}
