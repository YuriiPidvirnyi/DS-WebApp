import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'submission_cooldowns'

type CooldownsMap = Record<string, number>

function readCooldowns(): CooldownsMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeCooldowns(map: CooldownsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

export function useSubmissionCooldown(key: string, defaultDurationSec = 30) {
  const [now, setNow] = useState(() => Date.now())

  // Tick every second to update remaining time
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const { expiresAt } = useMemo(() => {
    const cooldowns = readCooldowns()
    const expiresAt = cooldowns[key] || 0
    return { expiresAt }
  }, [key, now])

  const remainingMs = Math.max(0, expiresAt - now)
  const remainingSec = Math.ceil(remainingMs / 1000)
  const isCoolingDown = remainingMs > 0

  const start = useCallback((durationSec?: number) => {
    const cd = readCooldowns()
    const until = Date.now() + 1000 * (durationSec ?? defaultDurationSec)
    cd[key] = until
    writeCooldowns(cd)
    setNow(Date.now())
  }, [key, defaultDurationSec])

  const clear = useCallback(() => {
    const cd = readCooldowns()
    delete cd[key]
    writeCooldowns(cd)
    setNow(Date.now())
  }, [key])

  return { isCoolingDown, remainingSec, start, clear }
}
