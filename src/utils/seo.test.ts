import { describe, it, expect } from 'vitest'
import { generateOrganizationSchema } from '@/utils/seo'
import { CONTACT_INFO } from '@/utils/constants'

// Regression guard for the JSON-LD contact fields. Before, this schema shipped
// to prod with a `+380XXXXXXXXX` placeholder phone and a Kyiv address; nothing
// caught it because there was no test. These assertions fail CI if the org
// schema ever drifts back to placeholder/Kyiv data.
describe('generateOrganizationSchema — clinic contact fields', () => {
  const org = generateOrganizationSchema()

  it('uses the real Lviv address, not a Kyiv/placeholder one', () => {
    expect(org.address.addressLocality).toBe('Львів')
    expect(org.address.streetAddress).toContain('Сумська')
    expect(org.address.addressLocality).not.toBe('Київ')
    expect(org.address.streetAddress).not.toContain('Прикладна')
  })

  it('carries a real E.164 phone, not the +380XXXXXXXXX placeholder', () => {
    expect(org.telephone).toMatch(/^\+380\d{9}$/)
    expect(org.telephone).not.toContain('X')
  })

  it('geo coordinates match the single source of truth (CONTACT_INFO)', () => {
    expect(org.geo.latitude).toBe(CONTACT_INFO.coordinates.lat)
    expect(org.geo.longitude).toBe(CONTACT_INFO.coordinates.lng)
  })

  it('social profiles point at the Lviv accounts', () => {
    expect(org.sameAs.length).toBeGreaterThan(0)
    expect(org.sameAs.some(url => url.toLowerCase().includes('lviv'))).toBe(
      true
    )
    // the old generic placeholder handles must be gone
    expect(org.sameAs).not.toContain('https://www.facebook.com/dentalstory')
    expect(org.sameAs).not.toContain('https://www.instagram.com/dentalstory')
  })
})
