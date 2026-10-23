# Key Panel — Admin

License Key Management System สำหรับโปรแกรม C++

## Setup

### 1) ตั้งค่า .env.local

แก้ไขไฟล์ .env.local:

\\\env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
JWT_SECRET=<สร้างอัตโนมัติแล้ว>
NEXT_PUBLIC_APP_URL=http://localhost:3000
\\\

### 2) Setup Database

รันไฟล์ \db/schema.sql\ ใน Supabase SQL Editor

### 3) ตั้ง Admin

\\\sql
update public."User" set role = 'admin' where email = 'your-email@example.com';
\\\

### 4) รัน

\\\powershell
npm run dev
\\\

เปิด http://localhost:3000/login

## API สำหรับ C++ Client

\\\
POST https://your-domain.com/api/v1/verify
Content-Type: application/json

{
  "key": "NX-XXXX-XXXX-XXXX",
  "hwid": "ABC123..."
}
\\\

Response:
\\\json
{
  "valid": true,
  "category": "standard",
  "duration_days": 30,
  "expires_at": "2026-11-22T10:00:00Z"
}
\\\

## Deploy Vercel

1. Push ขึ้น GitHub
2. Import ใน Vercel
3. เพิ่ม Environment Variables (เหมือน .env.local)
4. Deploy