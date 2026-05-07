import { NextApiRequest, NextApiResponse } from 'next'
import { getStatus, getQRCode } from '../../lib/evolution'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const status = await getStatus()
    return res.status(200).json(status)
  }
  if (req.method === 'POST') {
    const qr = await getQRCode()
    return res.status(200).json(qr)
  }
  return res.status(405).end()
}
