import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // ⭐ admin เท่านั้น
    if (session.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    const { data, error } = await supabaseAdmin
      .from('User')
      .select('id, username, email, image, points, role')
      .eq('id', session.userId)
      .maybeSingle()

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ message: 'ไม่พบผู้ใช้' }, { status: 404 })
    }

    return NextResponse.json({ data })
  } catch (err: any) {
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาด', debug: err?.message },
      { status: 500 }
    )
  }
}