import { Spinner } from './ui'

export default function LoadingPage() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <Spinner size="xl" />
    </div>
  )
}
