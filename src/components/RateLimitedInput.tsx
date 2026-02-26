'use client'

import React, { useState, useEffect } from 'react'
import { rateLimiter } from '../utils/security'

interface RateLimitedInputProps {
  name: string
  maxAttempts?: number
  windowMs?: number
  onRateLimitExceeded?: (resetAt: number) => void
  children: (props: {
    isLimited: boolean
    remaining: number
    resetAt: number
    onAttempt: () => boolean
  }) => React.ReactNode
}

/**
 * Higher-order component for rate-limited inputs
 */
export const RateLimitedInput: React.FC<RateLimitedInputProps> = ({
  name,
  maxAttempts = 5,
  windowMs = 60000, // 1 minute
  onRateLimitExceeded,
  children,
}) => {
  const [state, setState] = useState({
    isLimited: false,
    remaining: maxAttempts,
    resetAt: Date.now() + windowMs,
  })

  useEffect(() => {
    if (state.isLimited) {
      const timer = setInterval(() => {
        if (Date.now() >= state.resetAt) {
          rateLimiter.reset(name)
          setState({
            isLimited: false,
            remaining: maxAttempts,
            resetAt: Date.now() + windowMs,
          })
        }
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [state.isLimited, state.resetAt, name, maxAttempts, windowMs])

  const handleAttempt = (): boolean => {
    const result = rateLimiter.check(name, maxAttempts, windowMs)

    setState({
      isLimited: !result.allowed,
      remaining: result.remaining,
      resetAt: result.resetAt,
    })

    if (!result.allowed && onRateLimitExceeded) {
      onRateLimitExceeded(result.resetAt)
    }

    return result.allowed
  }

  return (
    <>
      {children({
        isLimited: state.isLimited,
        remaining: state.remaining,
        resetAt: state.resetAt,
        onAttempt: handleAttempt,
      })}
    </>
  )
}

interface RateLimitMessageProps {
  resetAt: number
}

export const RateLimitMessage: React.FC<RateLimitMessageProps> = ({
  resetAt,
}) => {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, resetAt - Date.now()))

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(Math.max(0, resetAt - Date.now()))
    }, 1000)

    return () => clearInterval(timer)
  }, [resetAt])

  const seconds = Math.ceil(timeLeft / 1000)

  return (
    <div className="text-red-600 text-sm mt-2">
      Too many attempts. Please try again in {seconds} second
      {seconds !== 1 ? 's' : ''}.
    </div>
  )
}
