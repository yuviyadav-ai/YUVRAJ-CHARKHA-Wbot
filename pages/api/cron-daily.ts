import { NextApiRequest, NextApiResponse } from 'next'
import { sendMessage } from '../../lib/evolution'
import { supabase } from '../../lib/supabase'

// This runs daily via Vercel Cron (configured in vercel.json)
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Vercel cron sends GET, protect with secret
  const secret = req.headers['x-cron-secret']
  if (secret !== process.env.ADMIN_PASSWORD) {
    return res.status(401).end()
  }

  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')

  let birthdaySent = 0
  let festivalSent = 0

  // ── Birthday Wishes ──────────────────────────────────────────────────────
  const { data: birthdayContacts } = await supabase
    .from('contacts')
    .select('phone, name, birthday')
    .not('birthday', 'is', null)

  for (const contact of birthdayContacts || []) {
    if (!contact.birthday) continue
    const bday = new Date(contact.birthday)
    const bdayDd = String(bday.getDate()).padStart(2, '0')
    const bdayMm = String(bday.getMonth() + 1).padStart(2, '0')

    if (bdayDd === dd && bdayMm === mm) {
      const msg = `🎂 *Happy Birthday ${contact.name} Ji!*

Aapko aur aapke poore parivaar ko janamdin ki haardik shubhkamnayein! 🎉

Aapka yeh din bahut khaas ho aur zindagi mein khushiyan aur safalta milti rahe.

Hamesha surakshit rahein! 💛
— *Yuvraj Charkha*
Insurance WORLD`

      await sendMessage(contact.phone, msg)
      await supabase.from('message_log').insert({
        phone: contact.phone,
        message: msg,
        type: 'birthday',
      })
      birthdaySent++
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  // ── Festival Wishes ──────────────────────────────────────────────────────
  const todayStr = `${today.getFullYear()}-${mm}-${dd}`
  const { data: festivals } = await supabase
    .from('festivals')
    .select('*')
    .eq('date', todayStr)

  for (const festival of festivals || []) {
    // Get all contacts for festival
    const { data: allContacts } = await supabase
      .from('contacts')
      .select('phone, name')
      .limit(500) // safety limit

    for (const contact of allContacts || []) {
      const msg = festival.message_template.replace('{name}', contact.name || 'Aap')
      await sendMessage(contact.phone, msg)
      await supabase.from('message_log').insert({
        phone: contact.phone,
        message: msg,
        type: 'festival',
      })
      festivalSent++
      await new Promise(r => setTimeout(r, 3000))
    }
  }

  return res.status(200).json({
    success: true,
    date: todayStr,
    birthday_sent: birthdaySent,
    festival_sent: festivalSent,
  })
}
