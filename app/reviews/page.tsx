import { permanentRedirect } from 'next/navigation'

/**
 * The public reviews page has been removed.
 * Patients can no longer submit reviews directly on the site.
 * Reviews are managed via the admin panel only.
 */
export default function ReviewsPage() {
  permanentRedirect('/')
}
