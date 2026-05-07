import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { data, error } = await supabase
    .from('message_log')
    .select('*')
    .order('sent_at', { ascending: false })
    .limit(100)
  if (error) return res.status(500).json({ error })
  return res.status(200).json({ logs: data })
}
