import type { ReactNode } from 'react'
import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { render } from '@/test/test-utils'
import { CONTACT_INFO } from '@/utils/constants'

// The rail hides itself on /cabinet and /admin; force a public route so it renders.
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
// Keep the render hermetic — the rail's chrome (logo image, nav links, lazy
// panels) is irrelevant to the social-rail invariant under test.
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { src, alt } = props as { src?: string; alt?: string }
    // eslint-disable-next-line @next/next/no-img-element -- test mock, not real image usage
    return <img src={typeof src === 'string' ? src : ''} alt={alt ?? ''} />
  },
}))
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock('next/dynamic', () => ({ default: () => () => null }))

import SidebarNav from './SidebarNav'

/**
 * Guards the visible-UI side of this PR's social-link cleanup: the rail must
 * show exactly the clinic's real channels, in the same order the SEO `sameAs`
 * array uses (Instagram → Facebook → TikTok), with no dead Twitter/X link.
 * seo.test.ts covers the structured-data side; this covers the rendered rail —
 * the two disagreeing is exactly the bug this PR fixed.
 */
describe('SidebarNav — social rail', () => {
  it('renders Instagram → Facebook → TikTok, bound to CONTACT_INFO', () => {
    render(<SidebarNav />)

    const insta = screen.getByText('Instagram').closest('a')
    const fb = screen.getByText('Facebook').closest('a')
    const tiktok = screen.getByText('TikTok').closest('a')

    expect(insta?.getAttribute('href')).toBe(CONTACT_INFO.social.instagram)
    expect(fb?.getAttribute('href')).toBe(CONTACT_INFO.social.facebook)
    expect(tiktok?.getAttribute('href')).toBe(CONTACT_INFO.social.tiktok)

    // Rendered order must match the sameAs order (the invariant this PR fixed).
    expect(
      insta!.compareDocumentPosition(fb!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
    expect(
      fb!.compareDocumentPosition(tiktok!) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('renders no Twitter/X link', () => {
    render(<SidebarNav />)

    expect(screen.queryByText('Twitter')).toBeNull()
    expect(screen.queryByText(/^x$/i)).toBeNull()
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href') ?? '').not.toMatch(
        /x\.com|twitter\.com/i
      )
    }
  })
})
