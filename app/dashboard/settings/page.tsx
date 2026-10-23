'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Terminal, Copy, CheckCircle2, AlertCircle, Shield,
  Key, Activity, Globe, Code, ChevronRight,
  Server, Lock, Zap, Info, Clock, XCircle,
  ArrowRight, ExternalLink, FileCode, Send,
} from 'lucide-react'

type Tab = 'overview' | 'endpoints' | 'errors' | 'examples' | 'security'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'ภาพรวม', icon: Info },
  { id: 'endpoints', label: 'Endpoints', icon: Server },
  { id: 'errors', label: 'Error Codes', icon: AlertCircle },
  { id: 'examples', label: 'ตัวอย่างโค้ด', icon: Code },
  { id: 'security', label: 'ความปลอดภัย', icon: Shield },
]

export default function ApiDocsPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [apiBase, setApiBase] = useState('https://your-domain.com')
  const [mounted, setMounted] = useState(false)
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking')

  useEffect(() => {
    setApiBase(window.location.origin)
    setMounted(true)

    // Check API status
    fetch('/api/v1/auth', { method: 'GET' })
      .then(() => setStatus('online'))
      .catch(() => setStatus('offline'))
  }, [])

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('คัดลอกแล้ว')
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg shadow-blue-500/30">
            <Terminal className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
              API Documentation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              เอกสารการเชื่อมต่อโปรแกรม C++ กับระบบ Key Panel
            </p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="mb-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatusCard
            icon={Activity}
            label="สถานะ API"
            value={status === 'online' ? 'ออนไลน์' : status === 'offline' ? 'ออฟไลน์' : 'กำลังตรวจสอบ'}
            color={status === 'online' ? 'green' : status === 'offline' ? 'red' : 'slate'}
            pulse={status === 'online'}
          />
          <StatusCard
            icon={Server}
            label="Base URL"
            value={mounted ? new URL(apiBase).host : '-'}
            color="blue"
          />
          <StatusCard
            icon={Shield}
            label="Security"
            value="HMAC + JWT"
            color="purple"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-white/[0.04] gap-1">
          {TABS.map((t) => {
            const active = tab === t.id
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium whitespace-nowrap transition-all ' +
                  (active
                    ? 'bg-white dark:bg-white/[0.08] text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white')
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="animate-[fadeIn_0.3s_ease-out]">

        {/* ═══════ TAB: OVERVIEW ═══════ */}
        {tab === 'overview' && (
          <div className="space-y-4">
            <Card icon={Info} title="เกี่ยวกับ API" desc="ภาพรวมระบบ">
              <div className="space-y-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                <p>
                  Key Panel API ช่วยให้โปรแกรม C++ ของคุณสามารถตรวจสอบ License Key
                  และผูก HWID กับอุปกรณ์ได้อย่างปลอดภัย ผ่านระบบ HMAC Signature + JWT Session
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  {[
                    { icon: Lock, title: 'HMAC-SHA256', desc: 'ทุก request ต้อง signed ด้วย API Key' },
                    { icon: Clock, title: 'Anti-Replay', desc: 'Timestamp + Nonce ป้องกัน replay attack' },
                    { icon: Zap, title: 'Rate Limit', desc: 'จำกัด request ต่อนาทีต่อ API Key' },
                    { icon: Shield, title: 'IP Allowlist', desc: 'จำกัด IP ที่เรียก API ได้' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                        <item.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{item.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Card icon={Server} title="Base URL" desc="URL หลักของ API">
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-3">
                  <code className="flex-1 font-mono text-xs text-slate-900 dark:text-white truncate">
                    {mounted ? apiBase : 'https://your-domain.com'}
                  </code>
                  {mounted && (
                    <button
                      onClick={() => copy(apiBase)}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white dark:hover:bg-white/[0.08] hover:text-slate-700 dark:hover:text-slate-200 transition-colors shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Info className="h-3 w-3" />
                  ใช้ URL ของเว็บคุณเอง + <code className="font-mono">/api/v1</code>
                </p>
              </div>
            </Card>

            <Card icon={Key} title="ขั้นตอนการใช้งาน" desc="เริ่มต้นใน 4 ขั้น">
              <div className="space-y-3">
                {[
                  { step: '1', title: 'สร้าง API Key', desc: 'ไปที่หน้า API Clients → สร้าง API Key' },
                  { step: '2', title: 'ฝัง API Key ในโปรแกรม', desc: 'ใส่ใน C++ code (แนะนำ obfuscate)' },
                  { step: '3', title: 'เรียก /auth เพื่อ login', desc: 'ส่ง License Key + HWID → รับ Session Token' },
                  { step: '4', title: 'เรียก /verify เพื่อตรวจสอบ', desc: 'ส่ง Session Token ตาม interval' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-bold text-white">
                      {item.step}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
                <Link
                  href="/dashboard/api-clients"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  ไปที่ API Clients
                  <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* ═══════ TAB: ENDPOINTS ═══════ */}
        {tab === 'endpoints' && (
          <div className="space-y-4">
            {/* /auth */}
            <Card icon={Lock} title="POST /api/v1/auth" desc="Login และรับ Session Token">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold">
                    POST
                  </span>
                  <code className="font-mono text-xs text-slate-900 dark:text-white">
                    /api/v1/auth
                  </code>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">Request Headers</p>
                  <HeadersTable
                    rows={[
                      { key: 'X-Api-Key', value: 'sk_live_xxxxx', desc: 'API Key จาก API Clients' },
                      { key: 'X-Timestamp', value: '1234567890', desc: 'Unix ms (ห่างไม่เกิน 60 วินาที)' },
                      { key: 'X-Signature', value: 'hmac_hex', desc: 'HMAC-SHA256(api_key, timestamp.path.body)' },
                      { key: 'X-Nonce', value: 'abc123...', desc: 'Random string (ห้ามซ้ำ)' },
                      { key: 'Content-Type', value: 'application/json', desc: 'ต้องระบุ' },
                    ]}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">Request Body</p>
                  <CodeBlock
                    code={`{
  "license_key": "NX-XXXX-XXXX-XXXX",
  "hwid": "ABC123DEF456..."
}`}
                    onCopy={() => copy('{\n  "license_key": "NX-XXXX-XXXX-XXXX",\n  "hwid": "ABC123DEF456..."\n}')}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">Response สำเร็จ</p>
                  <CodeBlock
                    variant="success"
                    code={`{
  "valid": true,
  "session_token": "eyJhbGc...",
  "session_expires_at": "2026-10-23T15:00:00Z",
  "category": "premium",
  "duration_value": 30,
  "duration_unit": "day",
  "first_used_at": "2026-10-23T14:00:00Z",
  "expires_at": "2026-11-22T14:00:00Z"
}`}
                  />
                </div>
              </div>
            </Card>

            {/* /verify */}
            <Card icon={CheckCircle2} title="POST /api/v1/verify" desc="ตรวจสอบ Session ที่มีอยู่">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 text-[10px] font-bold">
                    POST
                  </span>
                  <code className="font-mono text-xs text-slate-900 dark:text-white">
                    /api/v1/verify
                  </code>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">Request Headers</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    เหมือนกับ <code className="font-mono">/auth</code> ทุกประการ
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">Request Body</p>
                  <CodeBlock
                    code={`{
  "session_token": "eyJhbGc...",
  "hwid": "ABC123DEF456..."
}`}
                    onCopy={() => copy('{\n  "session_token": "eyJhbGc...",\n  "hwid": "ABC123DEF456..."\n}')}
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white mb-2">Response สำเร็จ</p>
                  <CodeBlock
                    variant="success"
                    code={`{
  "valid": true,
  "session_expires_at": "2026-10-23T15:00:00Z",
  "timestamp": "2026-10-23T14:30:00Z"
}`}
                  />
                </div>
              </div>
            </Card>

            {/* Flow */}
            <Card icon={ArrowRight} title="Flow การใช้งาน" desc="ลำดับการเรียก API">
              <div className="space-y-2">
                {[
                  { step: '1', action: 'POST /api/v1/auth', desc: 'Login ครั้งแรก → รับ session_token' },
                  { step: '2', action: 'POST /api/v1/verify', desc: 'ตรวจสอบทุก 5 นาที' },
                  { step: '3', action: 'POST /api/v1/auth', desc: 'ถ้า session หมดอายุ → login ใหม่' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                      {item.step}
                    </div>
                    <div className="min-w-0">
                      <code className="text-xs font-semibold text-slate-900 dark:text-white font-mono">
                        {item.action}
                      </code>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ═══════ TAB: ERRORS ═══════ */}
        {tab === 'errors' && (
          <div className="space-y-4">
            <Card icon={AlertCircle} title="รหัสข้อผิดพลาด" desc="ความหมายของ reason แต่ละแบบ">
              <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-white/[0.02]">
                    <tr>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Code</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Status</th>
                      <th className="text-left px-3 py-2.5 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">ความหมาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                    {[
                      ['KEY_NOT_FOUND', 404, 'ไม่พบ License Key ในระบบ'],
                      ['KEY_REVOKED', 403, 'Key ถูกระงับโดยแอดมิน'],
                      ['KEY_EXPIRED', 403, 'Key หมดอายุแล้ว'],
                      ['HWID_LIMIT_REACHED', 403, 'จำนวน HWID เต็ม'],
                      ['MISSING_PARAMS', 400, 'ไม่ส่ง key หรือ hwid มา'],
                      ['MISSING_HEADERS', 400, 'ไม่ส่ง security headers ครบ'],
                      ['INVALID_API_KEY', 401, 'API Key ไม่ถูกต้อง'],
                      ['API_KEY_REVOKED', 401, 'API Key ถูกระงับ'],
                      ['API_KEY_EXPIRED', 401, 'API Key หมดอายุ'],
                      ['TIMESTAMP_INVALID', 401, 'Timestamp เกิน 60 วินาที'],
                      ['SIGNATURE_INVALID', 401, 'HMAC Signature ไม่ตรง'],
                      ['NONCE_REPLAY', 401, 'Nonce ซ้ำ (replay attack)'],
                      ['SESSION_NOT_FOUND', 401, 'Session Token ไม่พบ'],
                      ['SESSION_EXPIRED', 401, 'Session หมดอายุ'],
                      ['SESSION_HWID_MISMATCH', 401, 'Session กับ HWID ไม่ตรง'],
                      ['RATE_LIMIT_EXCEEDED', 429, 'เรียกเกิน limit ต่อนาที'],
                      ['IP_NOT_ALLOWED', 403, 'IP ไม่อยู่ใน allowlist'],
                      ['SERVER_ERROR', 500, 'ข้อผิดพลาดภายในเซิร์ฟเวอร์'],
                    ].map(([code, status, desc]) => (
                      <tr key={code as string} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="px-3 py-2.5 font-mono text-[11px] text-red-600 dark:text-red-400 whitespace-nowrap">
                          {code}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={
                            'inline-flex rounded-md px-1.5 py-0.5 text-[9px] font-bold ' +
                            (String(status).startsWith('4')
                              ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400'
                              : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400')
                          }>
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card icon={XCircle} title="ตัวอย่าง Response ผิดพลาด" desc="JSON ที่ส่งกลับเมื่อ error">
              <CodeBlock
                variant="error"
                code={`{
  "valid": false,
  "reason": "KEY_EXPIRED"
}`}
              />
            </Card>
          </div>
        )}

        {/* ═══ TAB: EXAMPLES ═══ */}
        {tab === 'examples' && (
          <div className="space-y-4">
            <Card icon={Code} title="C++ (libcurl)" desc="ตัวอย่างโค้ด C++">
              <CodeBlock
                code={`#include <curl/curl.h>
#include <openssl/hmac.h>
#include <iostream>
#include <chrono>
#include <random>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

const std::string API_KEY  = "sk_live_xxxxx";
const std::string BASE_URL = "${mounted ? apiBase : 'https://your-domain.com'}/api/v1";

// สร้าง HMAC-SHA256 signature
std::string hmacSha256(const std::string& key, const std::string& data) {
    unsigned char* digest = HMAC(EVP_sha256(),
        key.c_str(), key.length(),
        (unsigned char*)data.c_str(), data.length(),
        nullptr, nullptr);
    char hex[65];
    for (int i = 0; i < 32; i++) sprintf(hex + i * 2, "%02x", digest[i]);
    return std::string(hex);
}

// สร้าง Nonce random
std::string generateNonce() {
    std::random_device rd;
    std::mt19937 gen(rd());
    std::uniform_int_distribution<> dis(0, 15);
    const char* hex = "0123456789abcdef";
    std::string nonce;
    for (int i = 0; i < 32; i++) nonce += hex[dis(gen)];
    return nonce;
}

// เรียก API แบบ signed request
std::string postSecure(const std::string& path, const std::string& body) {
    long long ts = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::system_clock::now().time_since_epoch()).count();
    std::string nonce = generateNonce();
    std::string signature = hmacSha256(API_KEY,
        std::to_string(ts) + "." + path + "." + body);

    CURL* curl = curl_easy_init();
    struct curl_slist* headers = nullptr;
    headers = curl_slist_append(headers, "Content-Type: application/json");
    headers = curl_slist_append(headers, ("X-Api-Key: " + API_KEY).c_str());
    headers = curl_slist_append(headers, ("X-Timestamp: " + std::to_string(ts)).c_str());
    headers = curl_slist_append(headers, ("X-Signature: " + signature).c_str());
    headers = curl_slist_append(headers, ("X-Nonce: " + nonce).c_str());

    std::string response;
    curl_easy_setopt(curl, CURLOPT_URL, (BASE_URL + path).c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, body.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION,
        +[](char* ptr, size_t size, size_t nmemb, std::string* data) {
            data->append(ptr, size * nmemb);
            return size * nmemb;
        });
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &response);
    curl_easy_perform(curl);
    curl_easy_cleanup(curl);
    curl_slist_free_all(headers);
    return response;
}

int main() {
    std::string hwid = "ABC123DEF456";  // HWID ของเครื่อง

    // 1) Login
    json authBody = {{"license_key", "NX-XXXX-XXXX-XXXX"}, {"hwid", hwid}};
    auto authRes = postSecure("/auth", authBody.dump());
    auto authJson = json::parse(authRes);

    if (!authJson.value("valid", false)) {
        std::cout << "Login failed: " << authJson.value("reason", "?") << "\\n";
        return 1;
    }

    std::string sessionToken = authJson["session_token"];
    std::cout << "Logged in! Expires: " << authJson["expires_at"] << "\\n";

    // 2) Verify ทุก 5 นาที
    while (true) {
        std::this_thread::sleep_for(std::chrono::minutes(5));

        json verifyBody = {{"session_token", sessionToken}, {"hwid", hwid}};
        auto verifyRes = postSecure("/verify", verifyBody.dump());
        auto verifyJson = json::parse(verifyRes);

        if (verifyJson.value("valid", false)) {
            std::cout << "OK\\n";
        } else {
            std::cout << "Invalid: " << verifyJson.value("reason", "?") << "\\n";
            break;
        }
    }
    return 0;
}`}
                onCopy={() => copy(cppExample(mounted ? apiBase : 'https://your-domain.com'))}
              />
            </Card>

            <Card icon={Terminal} title="cURL" desc="ทดสอบด้วย command line">
              <CodeBlock
                code={`# 1) สร้าง signature (ด้วย openssl)
TIMESTAMP=$(date +%s000)
NONCE=$(openssl rand -hex 16)
BODY='{"license_key":"NX-XXXX-XXXX-XXXX","hwid":"ABC123"}'
SIG=$(echo -n "\${TIMESTAMP}./auth.\${BODY}" | \\
  openssl dgst -sha256 -hmac "sk_live_xxxxx" | awk '{print $2}')

# 2) เรียก API
curl -X POST ${mounted ? apiBase : 'https://your-domain.com'}/api/v1/auth \\
  -H "Content-Type: application/json" \\
  -H "X-Api-Key: sk_live_xxxxx" \\
  -H "X-Timestamp: \${TIMESTAMP}" \\
  -H "X-Signature: \${SIG}" \\
  -H "X-Nonce: \${NONCE}" \\
  -d "\${BODY}"`}
                onCopy={() => copy('curl -X POST ' + apiBase + '/api/v1/auth')}
              />
            </Card>

            <Card icon={Code} title="TypeScript" desc="ตัวอย่าง Node.js/TypeScript">
              <CodeBlock
                code={`import crypto from 'crypto'

const API_KEY = 'sk_live_xxxxx'
const BASE_URL = '${mounted ? apiBase : 'https://your-domain.com'}/api/v1'

async function postSecure(path: string, body: any) {
  const timestamp = Date.now()
  const nonce = crypto.randomBytes(16).toString('hex')
  const bodyStr = JSON.stringify(body)
  const signature = crypto
    .createHmac('sha256', API_KEY)
    .update(\`\${timestamp}.\${path}.\${bodyStr}\`)
    .digest('hex')

  const res = await fetch(\`\${BASE_URL}\${path}\`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': API_KEY,
      'X-Timestamp': String(timestamp),
      'X-Signature': signature,
      'X-Nonce': nonce,
    },
    body: bodyStr,
  })
  return res.json()
}

// ใช้งาน
const auth = await postSecure('/auth', {
  license_key: 'NX-XXXX-XXXX-XXXX',
  hwid: 'ABC123DEF456',
})`}
              />
            </Card>
          </div>
        )}

        {/* ═══════ TAB: SECURITY ═══════ */}
        {tab === 'security' && (
          <div className="space-y-4">
            <Card icon={Shield} title="มาตรการความปลอดภัย" desc="ระบบรักษาความปลอดภัยที่ใช้">
              <div className="space-y-3">
                {[
                  {
                    icon: Lock,
                    title: 'HMAC-SHA256 Signature',
                    desc: 'ทุก request ต้อง sign ด้วย API Key — ป้องกันการแก้ไขข้อมูลระหว่างทาง',
                  },
                  {
                    icon: Clock,
                    title: 'Timestamp Validation',
                    desc: 'ต้องห่างจากเวลา server ไม่เกิน 60 วินาที — ป้องกัน replay attack',
                  },
                  {
                    icon: Key,
                    title: 'Nonce Replay Protection',
                    desc: 'ทุก request ต้องมี nonce ไม่ซ้ำ — ใช้ครั้งเดียวเท่านั้น',
                  },
                  {
                    icon: Zap,
                    title: 'Rate Limiting',
                    desc: 'จำกัด request ต่อนาทีต่อ API Key — ป้องกัน DDoS',
                  },
                  {
                    icon: Globe,
                    title: 'IP Allowlist',
                    desc: 'จำกัด IP ที่เรียกได้ (ถ้าตั้งไว้)',
                  },
                  {
                    icon: Shield,
                    title: 'JWT Session',
                    desc: 'Session Token ที่มีอายุ 1 ชั่วโมง — ลดจำนวนครั้ง login',
                  },
                  {
                    icon: Activity,
                    title: 'Audit Log',
                    desc: 'ทุก request ถูกบันทึกใน ApiRequestLog',
                  },
                  {
                    icon: AlertCircle,
                    title: 'SHA-256 License Hash',
                    desc: 'License Keys ถูก hash ก่อนเก็บใน DB — ปลอดภัย',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                      <item.icon className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card icon={Info} title="คำแนะนำเพิ่มเติม" desc="สำหรับการใช้งานจริง">
              <div className="space-y-2">
                {[
                  'ใช้ HTTPS เท่านั้น (ไม่ใช้ HTTP)',
                  'Obfuscate API Key ในโค้ด C++ (เช่น XOR + Base64)',
                  'เก็บ Session Token ใน memory ไม่ต้องเก็บลง disk',
                  'เรียก /verify ทุก 5-10 นาที',
                  'ถ้า Session หมดอายุ → เรียก /auth ใหม่',
                  'จัดการ Rate Limit — อย่าเรียกบ่อยเกินไป',
                ].map((text, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 dark:text-slate-400">{text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════
function StatusCard({
  icon: Icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: React.ElementType
  label: string
  value: string
  color: 'green' | 'red' | 'blue' | 'purple' | 'slate'
  pulse?: boolean
}) {
  const colorMap = {
    green: { bg: 'bg-green-100 dark:bg-green-500/20', text: 'text-green-600 dark:text-green-400' },
    red: { bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-400' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-400' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-600 dark:text-purple-400' },
    slate: { bg: 'bg-slate-100 dark:bg-white/[0.06]', text: 'text-slate-600 dark:text-slate-400' },
  }
  const c = colorMap[color]
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
      <div className={'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ' + c.bg}>
        <Icon className={'h-4 w-4 ' + c.text} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        <div className="flex items-center gap-1.5">
          {pulse && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{value}</p>
        </div>
      </div>
    </div>
  )
}

function Card({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: React.ElementType
  title: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0f0f0f] overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-white/[0.06] flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/[0.06]">
          <Icon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
          {desc && <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function CodeBlock({
  code,
  variant = 'default',
  onCopy,
}: {
  code: string
  variant?: 'default' | 'success' | 'error'
  onCopy?: () => void
}) {
  const bgClass =
    variant === 'success'
      ? 'bg-green-900/20 dark:bg-green-950/40 border border-green-500/30 text-green-100'
      : variant === 'error'
      ? 'bg-red-900/20 dark:bg-red-950/40 border border-red-500/30 text-red-100'
      : 'bg-slate-900 dark:bg-black text-slate-100'

  return (
    <div className="relative group">
      <pre className={`rounded-xl p-4 text-[11px] overflow-x-auto leading-relaxed ${bgClass}`}>
        <code>{code}</code>
      </pre>
      {onCopy && (
        <button
          onClick={onCopy}
          className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          title="คัดลอก"
        >
          <Copy className="h-3 w-3" />
        </button>
      )}
    </div>
  )
}

function HeadersTable({
  rows,
}: {
  rows: { key: string; value: string; desc: string }[]
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 dark:bg-white/[0.02]">
          <tr>
            <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">Header</th>
            <th className="text-left px-3 py-2 font-semibold text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-wider">ความหมาย</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {rows.map((row) => (
            <tr key={row.key} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
              <td className="px-3 py-2 font-mono text-[11px] text-slate-900 dark:text-white whitespace-nowrap">
                {row.key}
              </td>
              <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{row.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function cppExample(baseUrl: string) {
  return `#include <curl/curl.h>
#include <openssl/hmac.h>
#include <iostream>

const std::string API_KEY  = "sk_live_xxxxx";
const std::string BASE_URL = "${baseUrl}/api/v1";`
}