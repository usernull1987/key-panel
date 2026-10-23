import crypto from 'crypto'

const KEY_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * สร้าง key_code รูปแบบ {prefix}-XXXX-XXXX-XXXX
 */
export function generateKeyCode(prefix: string = 'NX'): string {
  const segment = () =>
    Array.from({ length: 4 }, () =>
      KEY_CHARS.charAt(crypto.randomInt(0, KEY_CHARS.length))
    ).join('')

  const cleanPrefix = (prefix || 'NX').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'NX'
  return `${cleanPrefix}-${segment()}-${segment()}-${segment()}`
}

export function hashKey(keyCode: string): string {
  return crypto
    .createHash('sha256')
    .update(keyCode.trim().toUpperCase())
    .digest('hex')
}

/**
 * ⚠️ ไม่ใช้ computeExpiresAt แล้ว — เพราะเวลาจะเริ่มนับตอนใช้ครั้งแรก
 * (คำนวณใน SQL function)
 */
export type DurationUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year'

export const DURATION_UNITS: { value: DurationUnit; label: string }[] = [
  { value: 'second', label: 'วินาที' },
  { value: 'minute', label: 'นาที' },
  { value: 'hour', label: 'ชั่วโมง' },
  { value: 'day', label: 'วัน' },
  { value: 'month', label: 'เดือน' },
  { value: 'year', label: 'ปี' },
]