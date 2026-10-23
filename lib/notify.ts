import { supabaseAdmin } from '@/lib/supabase'

export async function notify({
  title,
  message,
  type = 'info',
  sendTelegram = true,
}: {
  title: string
  message: string
  type?: 'success' | 'error' | 'info'
  sendTelegram?: boolean
}) {
  try {
    await supabaseAdmin.from('Notification').insert({
      title,
      message,
      type,
      read: false,
    })
  } catch (err) {
    console.error('Insert notification failed:', err)
  }

  if (sendTelegram) {
    try {
      const { data: settings } = await supabaseAdmin
        .from('SiteSettings')
        .select('telegram_bot_token, telegram_chat_id')
        .eq('id', 1)
        .maybeSingle()

      if (settings?.telegram_bot_token && settings?.telegram_chat_id) {
        const prefix =
          type === 'success'
            ? '[SUCCESS]'
            : type === 'error'
            ? '[ERROR]'
            : '[INFO]'

        const text =
          prefix +
          ' ' +
          title +
          '\n\n' +
          message +
          '\n\n' +
          new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })

        await fetch(
          'https://api.telegram.org/bot' +
            settings.telegram_bot_token +
            '/sendMessage',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: settings.telegram_chat_id,
              text,
              parse_mode: 'HTML',
            }),
          }
        )
      }
    } catch (err) {
      console.error('Send Telegram failed:', err)
    }
  }
}