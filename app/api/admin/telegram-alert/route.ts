import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  const session = await getSession()
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
  }

  try {
    const { enabled } = await req.json()

    const { error } = await supabaseAdmin
      .from('SiteSettings')
      .update({ telegram_alert_enabled: enabled })
      .eq('id', 1)

    if (error) throw error

    return NextResponse.json({ success: true, enabled })
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 })
  }
}