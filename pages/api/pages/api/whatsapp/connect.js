export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const EVOLUTION_URL = process.env.EVOLUTION_API_URL
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY
  const INSTANCE = process.env.EVOLUTION_INSTANCE || 'insurance-world'

  try {
    // Instance create karo
    let response = await fetch(`${EVOLUTION_URL}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': EVOLUTION_KEY
      },
      body: JSON.stringify({
        instanceName: INSTANCE,
        token: EVOLUTION_KEY,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS'
      })
    })

    let data = await response.json()
    console.log('Create:', data)

    // QR fetch karo
    const qrResponse = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_KEY }
    })
    const qrData = await qrResponse.json()
    console.log('QR:', qrData)

    return res.json({ 
      success: true, 
      qr: qrData.base64 || qrData.code || qrData.qrcode,
      data: qrData 
    })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
