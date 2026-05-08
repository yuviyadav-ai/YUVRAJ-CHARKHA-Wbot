export default async function handler(req, res) {
  const EVOLUTION_URL = process.env.EVOLUTION_API_URL
  const EVOLUTION_KEY = process.env.EVOLUTION_API_KEY
  const INSTANCE = process.env.EVOLUTION_INSTANCE || 'insurance-world'

  try {
    const response = await fetch(`${EVOLUTION_URL}/instance/connectionState/${INSTANCE}`, {
      headers: { 'apikey': EVOLUTION_KEY }
    })
    const data = await response.json()
    return res.json(data)
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
