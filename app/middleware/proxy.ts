// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const ADMIN_ONLY = ['/dashboard/keys', '/dashboard/api-clients', '/dashboard/settings']

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  const { pathname } = req.nextUrl

  // login/register → ถ้ามี token ไป dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // dashboard → ถ้าไม่มี token ไป login
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // ⭐ admin-only pages → ตรวจ role ใน JWT
  if (token && ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    try {
      const secret = process.env.JWT_SECRET
      if (!secret) throw new Error('No secret')
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      )
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard/my-keys', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
}