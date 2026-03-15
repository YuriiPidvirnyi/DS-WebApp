'use client'

import dynamic from 'next/dynamic'
import DraggableWrapper from './DraggableWrapper'

const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false })
const AIAssistant = dynamic(() => import('./AIAssistant'), { ssr: false })
const FloatingQuickActions = dynamic(
  () => import('./FloatingQuickActions'),
  { ssr: false }
)
const DragModeToggle = dynamic(
  () => import('./DragModeToggle'),
  { ssr: false }
)

export default function ClientFloatingButtons() {
  return (
    <>
      {/* Right side: Chat, AI Assistant, Quick Actions, Move button */}
      <DraggableWrapper
        storageKey="fab-chat-v2"
        label="Чат"
        className="fixed bottom-6 right-6 z-50"
      >
        <ChatWidget />
      </DraggableWrapper>

      <DraggableWrapper
        storageKey="fab-ai-assistant-v2"
        label="AI Асистент"
        className="fixed bottom-24 right-6 z-40"
      >
        <AIAssistant />
      </DraggableWrapper>

      <DraggableWrapper
        storageKey="fab-quick-actions-v2"
        label="Швидкі дії"
        className="fixed bottom-44 right-6 z-50"
      >
        <FloatingQuickActions />
      </DraggableWrapper>

      {/* Move button - right side above Quick Actions */}
      <DragModeToggle />
    </>
  )
}
