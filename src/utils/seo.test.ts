import { describe, it, expect } from 'vitest'
import { generateOrganizationSchema } from '@/utils/seo'
import { CONTACT_INFO } from '@/utils/constants'

// Regression guard for the JSON-LD contact fields. Before, this schema shipped
// to prod with a `+380XXXXXXXXX` placeholder phone and a Kyiv address; nothing
// caught it because there was no test. The schema now derives every contact
// field from CONTACT_INFO (the single source of truth), and these assertions
// pin that binding so the fields can never silently drift apart again.
describe('generateOrganizationSchema — clinic contact fields', () => {
  const org = generateOrganizationSchema()

  it('address is bound to CONTACT_INFO (real Lviv, never a Kyiv/placeholder one)', () => {
    expect(org.address.streetAddress).toBe(CONTACT_INFO.address.street)
    expect(org.address.addressLocality).toBe(CONTACT_INFO.address.city)
    expect(org.address.addressRegion).toBe(CONTACT_INFO.address.district)
    expect(org.address.postalCode).toBe(CONTACT_INFO.address.postalCode)
    expect(org.address.addressLocality).not.toBe('Київ')
    expect(org.address.streetAddress).not.toContain('Прикладна')
  })

  it('telephone is bound to CONTACT_INFO and is a real E.164 number', () => {
    expect(org.telephone).toBe(CONTACT_INFO.phone)
    expect(org.telephone).toMatch(/^\+380\d{9}$/)
    expect(org.telephone).not.toContain('X')
  })

  it('geo coordinates match CONTACT_INFO', () => {
    expect(org.geo.latitude).toBe(CONTACT_INFO.coordinates.lat)
    expect(org.geo.longitude).toBe(CONTACT_INFO.coordinates.lng)
  })

  it('social profiles are bound to CONTACT_INFO and point at the Lviv accounts', () => {
    expect(org.sameAs).toContain(CONTACT_INFO.social.facebook)
    expect(org.sameAs).toContain(CONTACT_INFO.social.instagram)
    expect(org.sameAs).toContain(CONTACT_INFO.social.telegram)
    expect(org.sameAs).toContain(CONTACT_INFO.social.tiktok)
    expect(org.sameAs.some(url => url.toLowerCase().includes('lviv'))).toBe(
      true
    )
    // the old generic placeholder handles must be gone
    expect(org.sameAs).not.toContain('https://www.facebook.com/dentalstory')
    expect(org.sameAs).not.toContain('https://www.instagram.com/dentalstory')
    // no dead Twitter/X placeholder in the social graph
    expect(org.sameAs).not.toContain('https://x.com')
  })
})
