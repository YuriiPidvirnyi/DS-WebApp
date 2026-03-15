'use client'

import dynamic from 'next/dynamic'
import DraggableWrapper from './DraggableWrapper'

const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })
const FloatingQuickActions = dynamic(
  () => import('./FloatingQuickActions'),
  { ssr: false }
)

export default function ClientFloatingButtons() {
  return (
    <>
      {/* Right column (bottom → top): Chat, AI, Quick Actions */}
      <DraggableWrapper
        storageKey="fab-chat-v3"
        label="Чат"
        className="fixed bottom-6 right-6 z-50"
      >
        <ChatWidget />
      </DraggableWrapper>

      <DraggableWrapper
        storageKey="fab-ai-v3"
        label="AI Асистент"
        className="fixed bottom-24 right-6 z-40"
      >
        <AIAssistant />
      </DraggableWrapper>

      <DraggableWrapper
        storageKey="fab-quick-v3"
        label="Швидкі дії"
        className="fixed bottom-44 right-6 z-40"
      >
        <FloatingQuickActions />
      </DraggableWrapper>
    </>
  )
}
