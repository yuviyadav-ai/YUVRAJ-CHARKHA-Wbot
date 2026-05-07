const API_URL = process.env.EVOLUTION_API_URL
const API_KEY = process.env.EVOLUTION_API_KEY
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'insurance-world'

// Send single WhatsApp message
export async function sendMessage(phone: string, message: string) {
  try {
    // Format phone: remove +, spaces, add 91 if needed
    let formatted = phone.replace(/\D/g, '')
    if (formatted.startsWith('0')) formatted = '91' + formatted.slice(1)
    if (formatted.length === 10) formatted = '91' + formatted

    const res = await fetch(`${API_URL}/message/sendText/${INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': API_KEY!,
      },
      body: JSON.stringify({
        number: formatted + '@s.whatsapp.net',
        textMessage: { text: message },
      }),
    })
    const data = await res.json()
    return { success: true, data }
  } catch (err) {
    console.error('Send message error:', err)
    return { success: false, error: err }
  }
}

// Send bulk messages with delay (avoid ban)
export async function sendBulk(
  contacts: { phone: string; name: string }[],
  messageTemplate: string,
  delayMs = 3000  // 3 second gap between messages
) {
  const results = []
  for (const contact of contacts) {
    const msg = messageTemplate.replace('{name}', contact.name)
    const result = await sendMessage(contact.phone, msg)
    results.push({ phone: contact.phone, ...result })
    // Delay between messages to avoid ban
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  return results
}

// Check WhatsApp connection status
export async function getStatus() {
  try {
    const res = await fetch(`${API_URL}/instance/connectionState/${INSTANCE}`, {
      headers: { 'apikey': API_KEY! },
    })
    return await res.json()
  } catch {
    return { state: 'error' }
  }
}

// Get QR code for connecting WhatsApp
export async function getQRCode() {
  try {
    const res = await fetch(`${API_URL}/instance/connect/${INSTANCE}`, {
      headers: { 'apikey': API_KEY! },
    })
    return await res.json()
  } catch (err) {
    return { error: err }
  }
}
