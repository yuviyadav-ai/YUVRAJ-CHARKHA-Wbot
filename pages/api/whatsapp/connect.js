export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY;
  const INSTANCE = process.env.EVOLUTION_INSTANCE || 'YuviBot';

  try {
    // QR Code fetch karne ke liye seedha request
    const qrRes = await fetch(`${EVOLUTION_URL}/instance/connect/${INSTANCE}`, {
      method: 'GET',
      headers: { 'apikey': EVOLUTION_KEY }
    });
    
    const qrData = await qrRes.json();
    
    return res.json({ 
      success: true, 
      qr: qrData.base64 || qrData.code || qrData.qrcode 
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
