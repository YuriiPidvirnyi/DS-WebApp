'use client'

import dynamic from 'next/dynamic'

// Dynamic imports for client-only components to avoid hydration issues with timestamps
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false })
const AIAssistant = dynamic(() => import('@/components/AIAssistant'), { ssr: false })

export default function ClientWidgets() {
  return (
    <>
      <ChatWidget />
      <AIAssistant />
    </>
  )
}
