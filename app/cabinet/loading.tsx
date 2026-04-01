export default function CabinetLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-dental-secondary-200 rounded-lg" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="h-24 bg-white rounded-2xl border border-dental-secondary-100"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="h-20 bg-white rounded-2xl border border-dental-secondary-100" />
          <div className="h-40 bg-white rounded-2xl border border-dental-secondary-100" />
        </div>
        <div className="lg:col-span-2">
          <div className="h-80 bg-white rounded-2xl border border-dental-secondary-100" />
        </div>
      </div>
    </div>
  )
}
