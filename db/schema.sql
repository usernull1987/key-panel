-- ============================================
-- KEY PANEL DATABASE SCHEMA
-- รันใน Supabase SQL Editor
-- ============================================

-- 1) ตาราง LicenseKey
create table if not exists public."LicenseKey" (
  id uuid primary key default gen_random_uuid(),
  key_code text not null unique,
  key_hash text not null,
  category text not null default 'standard',
  duration_days integer not null,
  max_hwid integer not null default 1,
  note text,
  is_active boolean not null default true,
  expires_at timestamptz,
  created_by uuid references public."User"(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_licensekey_active on public."LicenseKey"(is_active);
create index if not exists idx_licensekey_hash on public."LicenseKey"(key_hash);
create index if not exists idx_licensekey_category on public."LicenseKey"(category);

-- 2) ตาราง KeyHwid
create table if not exists public."KeyHwid" (
  id uuid primary key default gen_random_uuid(),
  license_key_id uuid not null references public."LicenseKey"(id) on delete cascade,
  hwid text not null,
  ip_address text,
  user_agent text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique(license_key_id, hwid)
);

create index if not exists idx_keyhwid_license on public."KeyHwid"(license_key_id);

-- 3) ตาราง KeyLog
create table if not exists public."KeyLog" (
  id bigserial primary key,
  license_key_id uuid references public."LicenseKey"(id) on delete cascade,
  action text not null,
  hwid text,
  ip_address text,
  success boolean not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_keylog_created on public."KeyLog"(created_at desc);
create index if not exists idx_keylog_license on public."KeyLog"(license_key_id);

-- 4) Function verify_license_key
create or replace function public.verify_license_key(
  p_key_hash text,
  p_hwid text,
  p_ip text default null,
  p_user_agent text default null
)
returns jsonb
language plpgsql
security definer
as \$\$
declare
  v_key public."LicenseKey"%rowtype;
  v_hwid_count int;
  v_expired boolean;
begin
  select * into v_key
  from public."LicenseKey"
  where key_hash = p_key_hash
  limit 1;

  if v_key.id is null then
    return jsonb_build_object('valid', false, 'reason', 'KEY_NOT_FOUND');
  end if;

  if not v_key.is_active then
    return jsonb_build_object('valid', false, 'reason', 'KEY_REVOKED');
  end if;

  v_expired := v_key.expires_at is not null and v_key.expires_at < now();
  if v_expired then
    return jsonb_build_object('valid', false, 'reason', 'KEY_EXPIRED', 'expires_at', v_key.expires_at);
  end if;

  select count(*) into v_hwid_count
  from public."KeyHwid"
  where license_key_id = v_key.id;

  if not exists (
    select 1 from public."KeyHwid"
    where license_key_id = v_key.id and hwid = p_hwid
  ) then
    if v_hwid_count >= v_key.max_hwid then
      return jsonb_build_object('valid', false, 'reason', 'HWID_LIMIT_REACHED', 'max', v_key.max_hwid);
    end if;

    insert into public."KeyHwid" (license_key_id, hwid, ip_address, user_agent)
    values (v_key.id, p_hwid, p_ip, p_user_agent);
  else
    update public."KeyHwid"
    set last_seen_at = now(), ip_address = coalesce(p_ip, ip_address)
    where license_key_id = v_key.id and hwid = p_hwid;
  end if;

  insert into public."KeyLog" (license_key_id, action, hwid, ip_address, success, message)
  values (v_key.id, 'verify', p_hwid, p_ip, true, 'OK');

  return jsonb_build_object(
    'valid', true,
    'key_id', v_key.id,
    'category', v_key.category,
    'duration_days', v_key.duration_days,
    'expires_at', v_key.expires_at,
    'hwid', p_hwid
  );
exception when others then
  return jsonb_build_object('valid', false, 'reason', 'SERVER_ERROR', 'error', sqlerrm);
end;
\$\$;

grant execute on function public.verify_license_key to anon, authenticated, service_role;

-- 5) อัปเดต role = 'admin' ให้ user ที่ต้องการ
-- update public."User" set role = 'admin' where email = 'your-admin@email.com';