// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// หน้าที่อนุญาตเฉพาะ Admin
const ADMIN_ONLY = [
  '/dashboard/keys',
  '/dashboard/api-clients',
  '/dashboard/settings',
  '/dashboard/profile',
]

export async function proxy(req: NextRequest) {
  const token = req.cookies.get('admin_session')?.value
  const { pathname } = req.nextUrl

  // 1. ถ้าอยู่หน้า login/register และมี token แล้ว → ไป dashboard
  if ((pathname === '/login' || pathname === '/register') && token) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // 2. ถ้าอยู่หน้า dashboard แต่ไม่มี token → ไป login
  if (pathname.startsWith('/dashboard') && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // 3. ตรวจสอบสิทธิ์ Admin สำหรับหน้าที่ต้องป้องกัน
  if (token && ADMIN_ONLY.some((p) => pathname.startsWith(p))) {
    try {
      const secret = process.env.JWT_SECRET
      if (!secret) throw new Error('JWT_SECRET missing')
      
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret)
      )

      // ถ้าไม่ใช่ admin ให้เด้งกลับหน้า dashboard หลัก
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    } catch (err) {
      // Token ผิดรูปแบบ / หมดอายุ / Secret ผิด → ล้าง cookie แล้วไป login
      const response = NextResponse.redirect(new URL('/login', req.url))
      response.cookies.delete('admin_session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  // ดักจับเฉพาะ path ที่ต้องป้องกัน
  matcher: ['/dashboard/:path*', '/login', '/register'],
}