interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-dental-secondary-200 rounded ${className ?? ''}`}
      aria-hidden="true"
    />
  )
}

export function SkeletonCard({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`animate-pulse bg-white rounded-2xl border border-dental-secondary-100 ${className ?? ''}`}
      role="status"
      aria-busy="true"
    >
      {children}
    </div>
  )
}
