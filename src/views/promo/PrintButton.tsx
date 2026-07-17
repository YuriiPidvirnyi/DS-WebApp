'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui'

export default function PrintButton({ label }: { label: string }) {
  return (
    <Button size="lg" onClick={() => window.print()}>
      <Printer className="mr-2 h-5 w-5" />
      {label}
    </Button>
  )
}
