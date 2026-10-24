import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase'
import { generateKeyCode, hashKey } from '@/lib/keys'
import { notify } from '@/lib/notify'

export async function GET(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const search = searchParams.get('q')?.trim() || ''
  const category = searchParams.get('category') || 'all'
  const status = searchParams.get('status') || 'all'
  const page = Math.max(parseInt(searchParams.get('page') || '1'), 1)
  const limit = 20

  let query = supabaseAdmin
    .from('LicenseKey')
    .select(
      `id, key_code, category, prefix, duration_value, duration_unit,
       max_hwid, note, is_active, is_test, first_used_at, expires_at,
       created_at, updated_at,
       KeyHwid (hwid, last_seen_at)`,
      { count: 'exact' }
    )

  if (search) {
    const esc = search.replace(/[%_]/g, '\\$&')
    query = query.ilike('key_code', '%' + esc + '%')
  }
  if (category !== 'all') query = query.eq('category', category)
  if (status === 'active') {
    query = query.eq('is_active', true).or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
  }
  if (status === 'revoked') query = query.eq('is_active', false)
  if (status === 'expired') {
    query = query.not('expires_at', 'is', null).lt('expires_at', new Date().toISOString())
  }
  if (status === 'pending') {
    query = query.eq('is_active', true).is('first_used_at', null)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) return NextResponse.json({ message: error.message }, { status: 500 })

  return NextResponse.json({
    data,
    pagination: {
      page,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  })
}

export async function POST(req: Request) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const {
      category = 'standard',
      prefix = 'NX',
      duration_value = 30,
      duration_unit = 'day',
      is_lifetime = false,
      max_hwid = 1,
      note = '',
      quantity = 1,
      is_test = false,
      custom_key = '',
    } = body

    if (quantity < 1 || quantity > 100) {
      return NextResponse.json({ message: 'จำนวนต้อง 1-100' }, { status: 400 })
    }
    
    // ⭐ ตรวจสอบ duration_value เฉพาะตอนที่ไม่ใช่ lifetime
    if (!is_lifetime && duration_value < 1) {
      return NextResponse.json({ message: 'ระยะเวลาต้อง ≥ 1' }, { status: 400 })
    }
    
    if (!['second','minute','hour','day','month','year'].includes(duration_unit)) {
      return NextResponse.json({ message: 'หน่วยเวลาไม่ถูกต้อง' }, { status: 400 })
    }
    if (!['standard','premium','vip','dev'].includes(category)) {
      return NextResponse.json({ message: 'หมวดหมู่ไม่ถูกต้อง' }, { status: 400 })
    }

    // ⭐ กำหนดค่า duration_value เป็น 0 ถ้าเป็น Lifetime
    const finalDurationValue = is_lifetime ? 0 : duration_value
    const createdKeys: string[] = []

    // === สร้างแบบกำหนดเอง (1 คีย์) ===
    if (custom_key && custom_key.trim()) {
      const code = custom_key.trim().toUpperCase()
      if (!/^[A-Z0-9-]{6,32}$/.test(code)) {
        return NextResponse.json({ message: 'รูปแบบ key ไม่ถูกต้อง (A-Z, 0-9, -, 6-32 ตัว)' }, { status: 400 })
      }
      const keyHash = hashKey(code)
      
      const { error } = await supabaseAdmin.from('LicenseKey').insert({
        key_code: code,
        key_hash: keyHash,
        category, 
        prefix: prefix.toUpperCase(),
        duration_value: finalDurationValue,  // ⭐ ใช้ค่าที่คำนวณแล้ว
        duration_unit,
        max_hwid, 
        note, 
        is_test,
        created_by: session.userId,
      })
      
      if (error) {
        console.error('Insert error:', error)
        if (error.code === '23505') return NextResponse.json({ message: 'Key นี้มีอยู่แล้ว' }, { status: 409 })
        return NextResponse.json({ message: error.message }, { status: 500 })
      }
      createdKeys.push(code)
    } else {
      // === สร้างอัตโนมัติ ===
      for (let i = 0; i < quantity; i++) {
        let attempts = 0
        let success = false
        while (!success && attempts < 3) {
          attempts++
          const keyCode = generateKeyCode(prefix)
          const keyHash = hashKey(keyCode)
          
          const { error } = await supabaseAdmin.from('LicenseKey').insert({
            key_code: keyCode,
            key_hash: keyHash,
            category, 
            prefix: prefix.toUpperCase(),
            duration_value: finalDurationValue,  // ⭐ ใช้ค่าที่คำนวณแล้ว
            duration_unit,
            max_hwid, 
            note, 
            is_test,
            created_by: session.userId,
          })
          
          if (!error) {
            createdKeys.push(keyCode)
            success = true
          } else if (error.code === '23505') {
            continue // retry
          } else {
            console.error('Insert error:', error)
            break
          }
        }
      }
    }

    if (createdKeys.length > 0) {
      const durationLabel = is_lifetime ? 'ถาวร' : `${duration_value} ${duration_unit}`
      await notify({
        title: 'สร้าง Keys ใหม่',
        message: `สร้าง ${createdKeys.length} keys (${category}, ${durationLabel}${is_test ? ', TEST' : ''})`,
        type: 'success',
      })
    }

    return NextResponse.json({ success: true, keys: createdKeys }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ message: err?.message }, { status: 500 })
  }
}