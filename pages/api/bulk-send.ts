import { NextApiRequest, NextApiResponse } from 'next'
import { sendBulk } from '../../lib/evolution'
import { supabase } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  // Simple auth check
  const { password, message, filter } = req.body
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    // Get contacts from Supabase
    let query = supabase.from('contacts').select('phone, name')
    
    // Optional filter by insurance type
    if (filter && filter !== 'all') {
      query = query.eq('insurance_type', filter)
    }

    const { data: contacts, error } = await query
    if (error) throw error
    if (!contacts?.length) {
      return res.status(200).json({ success: false, message: 'No contacts found' })
    }

    // Send bulk with 3s delay between each
    const results = await sendBulk(contacts, message, 3000)

    // Log campaign
    await supabase.from('message_log').insert({
      phone: 'BULK_CAMPAIGN',
      message: `Sent to ${contacts.length} contacts: ${message.substring(0, 100)}`,
      type: 'bulk',
    })

    const sent = results.filter(r => r.success).length
    return res.status(200).json({ 
      success: true, 
      total: contacts.length,
      sent,
      failed: contacts.length - sent,
    })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}
