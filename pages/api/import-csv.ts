import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export const config = { api: { bodyParser: { sizeLimit: '10mb' } } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { contacts, password } = req.body
    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // contacts = array from CSV parse
    // Expected columns: name, phone, birthday (dd/mm/yyyy), insurance_type, city
    const formatted = contacts.map((c: any) => ({
      name: c.name || c.Name || '',
      phone: String(c.phone || c.Phone || c.mobile || c.Mobile || '').replace(/\D/g, ''),
      birthday: parseBirthday(c.birthday || c.Birthday || c.dob || c.DOB),
      insurance_type: c.insurance_type || c.type || null,
      city: c.city || c.City || null,
    })).filter((c: any) => c.phone.length >= 10)

    // Upsert — update if phone exists, insert if new
    const { data, error } = await supabase
      .from('contacts')
      .upsert(formatted, { onConflict: 'phone', ignoreDuplicates: false })
      .select()

    if (error) throw error

    return res.status(200).json({ 
      success: true, 
      imported: data?.length || formatted.length,
      total_processed: contacts.length,
    })
  } catch (err) {
    return res.status(500).json({ error: String(err) })
  }
}

function parseBirthday(val: string): string | null {
  if (!val) return null
  try {
    // Handle dd/mm/yyyy or dd-mm-yyyy
    const parts = val.split(/[\/\-]/)
    if (parts.length === 3) {
      const [d, m, y] = parts
      return `${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
    }
    return null
  } catch { return null }
}
