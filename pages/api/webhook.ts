import { NextApiRequest, NextApiResponse } from 'next'
import { sendMessage } from '../../lib/evolution'
import { supabase } from '../../lib/supabase'

// ── Bot Responses ──────────────────────────────────────────────────────────
const RESPONSES: Record<string, string> = {
  welcome: `🙏 *Namaste! Insurance WORLD mein aapka swagat hai!*

Main Yuvraj Charkha ka digital assistant hoon.

Aapko kaunsi insurance mein help chahiye?

1️⃣ Term Insurance
2️⃣ Health Insurance  
3️⃣ Car / Two Wheeler Insurance
4️⃣ Travel Insurance
5️⃣ Life Insurance / LIC
6️⃣ 📞 Yuvraj Sir se baat karni hai

Reply mein sirf number bhejein (1-6)`,

  '1': `📋 *Term Insurance*

✅ *Kya hota hai?*
Pure life cover — aapke na rehne par family ko bada amount milta hai.

✅ *Example:*
Age 32 → ₹1 Crore cover → sirf ₹550-650/month

✅ *Benefits:*
• Sabse sasta pure protection plan
• Tax benefit Section 80C
• Critical illness rider bhi available

👉 *Free consultation ke liye apna naam aur city bhejein*
Example: "Rahul, Nagpur"`,

  '2': `🏥 *Health Insurance*

✅ *Kya milta hai?*
Hospitalization, surgery, medicines — sab cover

✅ *Plans available:*
• Individual: ₹5L cover → ~₹800/month
• Family Floater: ₹10L → ~₹1,500/month  
• Senior Citizen plans bhi available

✅ *Extra benefits:*
• Cashless treatment 5000+ hospitals
• No claim bonus
• Pre/post hospitalization cover

👉 *Apna naam, age aur family members ki count bhejein*`,

  '3': `🚗 *Car / Two Wheeler Insurance*

✅ *Types:*
• Third Party (legally mandatory) — ₹2,000/year
• Comprehensive — full protection — ₹5,000-8,000/year

✅ *Renewal benefits hamare through:*
• Fast processing
• Best price comparison
• Claim support

👉 *Vehicle number bhejein — best quote 10 minute mein!*`,

  '4': `✈️ *Travel Insurance*

✅ *Cover milta hai:*
• Medical emergency abroad
• Trip cancellation
• Lost baggage
• Flight delay

✅ *Cost:*
7 days domestic → ₹200-400
International 15 days → ₹800-1,500

👉 *Travel date aur destination bhejein — best plan suggest karenge*`,

  '5': `🏦 *Life Insurance / LIC*

✅ *Hum offer karte hain:*
• LIC Jeevan Anand
• LIC Tech Term
• LIC New Endowment Plan
• Money back plans

✅ *Yuvraj Sir ke baare mein:*
🏆 *Double MDRT Qualifier* — India ke top 1% LIC advisors mein
20+ saal ka experience

👉 *Apni age aur investment capacity bhejein*`,

  '6': `📞 *Yuvraj Charkha Sir se Direct Baat Karein*

🏆 Double MDRT Certified Advisor
📍 Insurance WORLD

👉 *Apna naam aur convenient time bhejein*
Example: "Rahul — kal 11 baje"

Yuvraj Sir personally aapko call karenge! ✅`,

  default: `🙏 Samajh nahi aaya. Please 1-6 mein se koi number bhejein:

1️⃣ Term Insurance
2️⃣ Health Insurance
3️⃣ Car / Two Wheeler Insurance
4️⃣ Travel Insurance
5️⃣ Life Insurance / LIC
6️⃣ Yuvraj Sir se baat karni hai`,
}

// ── Webhook Handler ────────────────────────────────────────────────────────
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const body = req.body

    // Evolution API webhook format
    const event = body?.event
    if (event !== 'messages.upsert') return res.status(200).json({ ok: true })

    const message = body?.data?.messages?.[0]
    if (!message || message.key?.fromMe) return res.status(200).json({ ok: true })

    const phone = message.key?.remoteJid?.replace('@s.whatsapp.net', '')
    const text = (message.message?.conversation || 
                  message.message?.extendedTextMessage?.text || '').trim()

    if (!phone || !text) return res.status(200).json({ ok: true })

    // Get/Create contact in Supabase
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('phone', phone)
      .single()

    // Log incoming message
    await supabase.from('message_log').insert({
      phone,
      message: text,
      type: 'incoming',
    })

    // ── Determine reply ────────────────────────────────────────────────────
    let reply = ''
    const lower = text.toLowerCase()

    // Greetings → welcome menu
    const greetings = ['hi', 'hello', 'hii', 'hey', 'namaskar', 'namaste', 
                       'hy', 'helo', 'start', 'insurance']
    if (greetings.some(g => lower.includes(g))) {
      reply = RESPONSES.welcome
    }
    // Number selection 1-6
    else if (['1','2','3','4','5','6'].includes(text)) {
      reply = RESPONSES[text]
    }
    // Name + city format (lead capture) e.g. "Rahul, Nagpur"
    else if (text.includes(',') && text.length < 50) {
      const parts = text.split(',')
      const name = parts[0].trim()
      const cityOrTime = parts[1]?.trim()

      // Save/update contact name
      if (contact) {
        await supabase.from('contacts').update({ name }).eq('phone', phone)
      } else {
        await supabase.from('contacts').insert({ phone, name, city: cityOrTime })
      }

      reply = `✅ *Shukriya ${name} Ji!*

Aapki details note kar li gayi hain.

🏆 *Yuvraj Charkha Sir* aapko jald call karenge.

Insurance WORLD — *Double MDRT Certified*
📞 Helpline: 9309747795`
    }
    // Default
    else {
      reply = RESPONSES.default
    }

    // Send reply
    if (reply) {
      await sendMessage(phone, reply)
      // Log outgoing
      await supabase.from('message_log').insert({
        phone,
        message: reply,
        type: 'outgoing',
      })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(200).json({ ok: true }) // Always 200 for webhook
  }
}
