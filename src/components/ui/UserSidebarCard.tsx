'use client'

import type { ReactNode } from 'react'

interface UserSidebarCardProps {
  name: string
  email?: string
  /** Optional node rendered under the name/email (e.g. RoleBadge for admin). */
  extra?: ReactNode
}

function computeInitials(name: string): string {
  return (
    name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  )
}

/**
 * Identity card shown below the logo in both admin and cabinet sidebars.
 * Avatar + name + email (+ optional extra slot).
 */
export default function UserSidebarCard({
  name,
  email,
  extra,
}: UserSidebarCardProps) {
  const initials = computeInitials(name)
  return (
    <div className="px-4 py-4 border-b border-dental-secondary-100">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full bg-dental-primary-600 flex items-center justify-center text-white font-semibold text-sm shrink-0"
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-dental-dark truncate">
            {name}
          </p>
          {email && (
            <p className="text-xs text-dental-muted truncate">{email}</p>
          )}
        </div>
      </div>
      {extra && <div className="mt-2">{extra}</div>}
    </div>
  )
}
