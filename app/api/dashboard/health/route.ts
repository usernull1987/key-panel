import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    const start = Date.now()
    const { error } = await supabaseAdmin
      .from('LicenseKey')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      latency: Date.now() - start,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    return NextResponse.json(
      { status: 'error', message: err?.message || 'Database error' },
      { status: 503 }
    )
  }
}