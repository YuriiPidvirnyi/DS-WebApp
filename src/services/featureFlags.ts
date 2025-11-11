/**
 * Feature Flags Service
 * Manages feature toggles for safe deployment and A/B testing
 */

export interface FeatureFlag {
  key: string
  enabled: boolean
  description?: string
  rolloutPercentage?: number
  userGroups?: string[]
  expiryDate?: Date
}

class FeatureFlagsService {
  private flags: Map<string, FeatureFlag> = new Map()
  private userId: string | null = null

  constructor() {
    this.loadFlags()
    this.userId = this.getUserId()
  }

  /**
   * Load feature flags from environment, localStorage, or remote config
   */
  private loadFlags() {
    // Default flags configuration
    const defaultFlags: FeatureFlag[] = [
      {
        key: 'NEW_BOOKING_FLOW',
        enabled: true,
        description: 'Enhanced booking form with doctor selection',
        rolloutPercentage: 100,
      },
      {
        key: 'PRICE_CALCULATOR',
        enabled: true,
        description: 'Interactive price calculator on services page',
        rolloutPercentage: 100,
      },
      {
        key: 'CHAT_WIDGET',
        enabled: false,
        description: 'Live chat widget for customer support',
        rolloutPercentage: 0,
      },
      {
        key: 'ONLINE_PAYMENTS',
        enabled: false,
        description: 'Enable online payment processing',
        rolloutPercentage: 0,
      },
      {
        key: 'VIDEO_CONSULTATIONS',
        enabled: false,
        description: 'Allow video consultations with doctors',
        rolloutPercentage: 0,
      },
      {
        key: 'LOYALTY_PROGRAM',
        enabled: false,
        description: 'Customer loyalty program with points and rewards',
        rolloutPercentage: 0,
      },
      {
        key: 'AI_CHATBOT',
        enabled: false,
        description: 'AI-powered chatbot for answering questions',
        rolloutPercentage: 0,
      },
      {
        key: 'APPOINTMENT_REMINDERS',
        enabled: true,
        description: 'SMS and email appointment reminders',
        rolloutPercentage: 50,
      },
      {
        key: 'DARK_MODE',
        enabled: false,
        description: 'Dark mode theme support',
        rolloutPercentage: 0,
      },
      {
        key: 'MULTILINGUAL',
        enabled: false,
        description: 'Multi-language support (EN, RU)',
        rolloutPercentage: 0,
      },
    ]

    // Load from environment variables
    defaultFlags.forEach(flag => {
      const envKey = `VITE_FF_${flag.key}`
      const envValue = import.meta.env[envKey]

      if (envValue !== undefined) {
        flag.enabled = envValue === 'true' || envValue === '1'
      }

      this.flags.set(flag.key, flag)
    })

    // Load overrides from localStorage (for development/testing)
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('featureFlags')
        if (stored) {
          const overrides = JSON.parse(stored)
          Object.entries(overrides).forEach(([key, enabled]) => {
            const flag = this.flags.get(key)
            if (flag) {
              flag.enabled = enabled as boolean
            }
          })
        }
      } catch (error) {
        console.error('Failed to load feature flags from localStorage:', error)
      }
    }
  }

  /**
   * Get or generate user ID for consistent rollout
   */
  private getUserId(): string {
    if (typeof window === 'undefined') return 'server'

    let userId = localStorage.getItem('userId')
    if (!userId) {
      userId = Math.random().toString(36).substr(2, 9)
      localStorage.setItem('userId', userId)
    }
    return userId
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(key: string): boolean {
    const flag = this.flags.get(key)
    if (!flag) return false

    // Check if flag is globally enabled
    if (!flag.enabled) return false

    // Check expiry date
    if (flag.expiryDate && new Date() > flag.expiryDate) {
      return false
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && flag.rolloutPercentage < 100) {
      const hash = this.hashCode(this.userId + key)
      const bucket = Math.abs(hash) % 100
      return bucket < flag.rolloutPercentage
    }

    return true
  }

  /**
   * Simple hash function for consistent bucketing
   */
  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash
  }

  /**
   * Get all feature flags (for debugging/admin)
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * Override a feature flag (for development/testing)
   */
  override(key: string, enabled: boolean) {
    const flag = this.flags.get(key)
    if (flag) {
      flag.enabled = enabled

      // Save to localStorage
      try {
        const overrides = JSON.parse(
          localStorage.getItem('featureFlags') || '{}'
        )
        overrides[key] = enabled
        localStorage.setItem('featureFlags', JSON.stringify(overrides))
      } catch (error) {
        console.error('Failed to save feature flag override:', error)
      }
    }
  }

  /**
   * Clear all overrides
   */
  clearOverrides() {
    localStorage.removeItem('featureFlags')
    this.loadFlags()
  }

  /**
   * Track feature flag exposure (for analytics)
   */
  trackExposure(key: string) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'feature_flag_exposure', {
        feature_flag: key,
        enabled: this.isEnabled(key),
        user_id: this.userId,
      })
    }
  }

  // A/B Testing
  private tests: Map<string, {
    variants: { name: string; weight: number }[]
    active: boolean
  }> = new Map()
  private userVariants: Map<string, string> = new Map()

  registerABTest(key: string, variants: { name: string; weight: number }[]) {
    this.tests.set(key, { variants, active: true })
  }

  getTestVariant(testKey: string): string {
    // Check if user already has variant
    if (this.userVariants.has(testKey)) {
      return this.userVariants.get(testKey)!
    }

    const test = this.tests.get(testKey)
    if (!test || !test.active) return 'control'

    // Assign variant based on weights
    const totalWeight = test.variants.reduce((sum, v) => sum + v.weight, 0)
    const hash = Math.abs(this.hashCode(this.userId + testKey)) % 10000
    const random = (hash / 10000) * totalWeight

    let cumulative = 0
    for (const variant of test.variants) {
      cumulative += variant.weight
      if (random < cumulative) {
        this.userVariants.set(testKey, variant.name)
        return variant.name
      }
    }

    return test.variants[0].name
  }

  trackConversion(testKey: string, conversionName: string) {
    const variant = this.getTestVariant(testKey)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', 'ab_test_conversion', {
        test_key: testKey,
        variant: variant,
        conversion: conversionName,
      })
    }
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagsService()

// React hook for feature flags
export function useFeatureFlag(key: string): boolean {
  const enabled = featureFlags.isEnabled(key)

  // Track exposure when component mounts
  if (typeof window !== 'undefined') {
    featureFlags.trackExposure(key)
  }

  return enabled
}

// React hook for A/B testing
export function useABTest(testKey: string): string {
  return featureFlags.getTestVariant(testKey)
}
