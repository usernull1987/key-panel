import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

// GET — list notifications
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin
    .from('Notification')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    // ถ้าตารางยังไม่มี → คืน array ว่าง
    if (error.code === '42P01') return NextResponse.json({ data: [] })
    return NextResponse.json({ message: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: data || [] })
}

// DELETE — clear all notifications
export async function DELETE() {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { error } = await supabaseAdmin
    .from('Notification')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}