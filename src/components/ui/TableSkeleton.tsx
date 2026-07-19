interface TableSkeletonProps {
  cols: number
  rows?: number
}

function SkeletonCell() {
  return (
    <td className="px-4 py-3">
      <div className="h-4 animate-pulse rounded bg-dental-secondary/40" />
    </td>
  )
}

export function TableSkeleton({ cols, rows = 6 }: TableSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-dental-secondary-100">
          {Array.from({ length: cols }, (_, colIndex) => (
            <SkeletonCell key={colIndex} />
          ))}
        </tr>
      ))}
    </>
  )
}
