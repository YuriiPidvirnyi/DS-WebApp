import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return supabaseResponse
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect /cabinet routes - require authentication
  if (request.nextUrl.pathname.startsWith('/cabinet') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Protect /admin routes - require admin role.
  // Protect /patient/[id] routes the same way: they render staff-facing
  // patient dashboards for an arbitrary patient UUID, so plain authenticated
  // users must never reach them (IDOR).
  const pathname = request.nextUrl.pathname
  const isAdminPath =
    (pathname === '/admin' || pathname.startsWith('/admin/')) &&
    pathname !== '/admin/login'
  // Match the /patient segment exactly, not as a raw prefix, so unrelated
  // routes like /patient-portal would never get admin-only gating.
  const isPatientPath =
    pathname === '/patient' || pathname.startsWith('/patient/')

  if (isAdminPath || isPatientPath) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }

    // Admin source of truth: admin_users membership.
    const { data: adminMembership } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (!adminMembership) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
