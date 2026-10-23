import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { createSession } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ message: 'กรุณากรอกข้อมูล' }, { status: 400 })
    }

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .select('id, username, email, password, role')
      .or(`username.eq.${username},email.eq.${username}`)
      .maybeSingle()

    if (error || !user) {
      return NextResponse.json({ message: 'ข้อมูลไม่ถูกต้อง' }, { status: 401 })
    }

    if (user.role !== 'admin') {
      return NextResponse.json(
        { message: 'หน้านี้สำหรับแอดมินเท่านั้น' },
        { status: 403 }
      )
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return NextResponse.json({ message: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
    }

    await createSession({
      userId: user.id,
      username: user.username,
      role: 'admin',
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('LOGIN ERROR:', err)
    return NextResponse.json(
      { message: 'เกิดข้อผิดพลาด', debug: err?.message },
      { status: 500 }
    )
  }
}