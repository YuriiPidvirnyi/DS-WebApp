'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface DragModeContextValue {
  dragModeEnabled: boolean
  toggleDragMode: () => void
  disableDragMode: () => void
}

const DragModeContext = createContext<DragModeContextValue>({
  dragModeEnabled: false,
  toggleDragMode: () => {},
  disableDragMode: () => {},
})

export function DragModeProvider({ children }: { children: ReactNode }) {
  const [dragModeEnabled, setDragModeEnabled] = useState(false)

  const toggleDragMode = useCallback(() => setDragModeEnabled(v => !v), [])
  const disableDragMode = useCallback(() => setDragModeEnabled(false), [])

  return (
    <DragModeContext.Provider value={{ dragModeEnabled, toggleDragMode, disableDragMode }}>
      {children}
    </DragModeContext.Provider>
  )
}

export function useDragMode() {
  return useContext(DragModeContext)
}
