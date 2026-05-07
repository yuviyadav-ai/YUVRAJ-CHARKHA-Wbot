import { useState, useEffect, useRef } from 'react'
import Papa from 'papaparse'

const ADMIN_PASS = ''

export default function Dashboard() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState<'home'|'contacts'|'bulk'|'birthday'|'logs'>('home')
  const [contacts, setContacts] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [bulkMsg, setBulkMsg] = useState('')
  const [bulkFilter, setBulkFilter] = useState('all')
  const [waStatus, setWaStatus] = useState<any>(null)
  const [qrCode, setQrCode] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('iw_pass')
    if (saved) { setPassword(saved); setAuthed(true) }
  }, [])

  useEffect(() => {
    if (!authed) return
    fetchContacts()
    fetchLogs()
    checkWAStatus()
  }, [authed])

  async function login() {
    const res = await fetch('/api/wa-status')
    if (res.ok) { 
      localStorage.setItem('iw_pass', password)
      setAuthed(true) 
    }
  }

  async function fetchContacts() {
    const res = await fetch('/api/contacts?password=' + password)
    const d = await res.json()
    setContacts(d.contacts || [])
  }

  async function fetchLogs() {
    const res = await fetch('/api/logs?password=' + password)
    const d = await res.json()
    setLogs(d.logs || [])
  }

  async function checkWAStatus() {
    const res = await fetch('/api/wa-status')
    const d = await res.json()
    setWaStatus(d)
  }

  async function connectWA() {
    const res = await fetch('/api/wa-status', { method: 'POST' })
    const d = await res.json()
    setQrCode(d.qrcode?.base64 || d.base64 || '')
  }

  async function sendBulk() {
    if (!bulkMsg.trim()) return alert('Message likho pehle!')
    if (!confirm(`Kya aap confirm karte hain? Sabhi contacts ko message jaayega.`)) return
    setSending(true)
    const res = await fetch('/api/bulk-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password, message: bulkMsg, filter: bulkFilter }),
    })
    const d = await res.json()
    setResult(d)
    setSending(false)
  }

  async function importCSV(e: any) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const res = await fetch('/api/import-csv', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contacts: results.data, password }),
        })
        const d = await res.json()
        alert(d.success ? `✅ ${d.imported} contacts import ho gaye!` : 'Error: ' + d.error)
        fetchContacts()
        setImporting(false)
      },
    })
  }

  const statusColor = waStatus?.instance?.state === 'open' ? 'bg-green-500' : 'bg-red-500'
  const statusText = waStatus?.instance?.state === 'open' ? 'Connected ✅' : 'Disconnected ❌'

  if (!authed) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">💬</div>
          <h1 className="text-xl font-semibold text-gray-800">Insurance WORLD</h1>
          <p className="text-sm text-gray-500">WhatsApp Bot Dashboard</p>
        </div>
        <input
          type="password"
          placeholder="Admin password"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && login()}
        />
        <button onClick={login} className="w-full bg-green-500 hover:bg-green-600 text-white rounded-xl py-3 font-medium transition">
          Login →
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-lg">💬</div>
          <div>
            <div className="font-semibold text-gray-800 text-sm">Insurance WORLD Bot</div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
              <span className="text-xs text-gray-500">{statusText}</span>
            </div>
          </div>
        </div>
        {waStatus?.instance?.state !== 'open' && (
          <button onClick={connectWA} className="text-xs bg-green-500 text-white px-3 py-1.5 rounded-lg">
            Connect WhatsApp
          </button>
        )}
      </div>

      {/* QR Code */}
      {qrCode && (
        <div className="mx-6 mt-4 bg-white rounded-2xl p-6 text-center border border-yellow-200">
          <p className="text-sm font-medium text-gray-700 mb-3">📱 WhatsApp scan karo is QR se:</p>
          <img src={`data:image/png;base64,${qrCode}`} className="mx-auto w-48 h-48" alt="QR Code" />
          <p className="text-xs text-gray-400 mt-2">WhatsApp → Linked Devices → Link a device</p>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4 flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'home', label: '🏠 Home' },
          { id: 'contacts', label: '👥 Contacts' },
          { id: 'bulk', label: '📢 Bulk' },
          { id: 'birthday', label: '🎂 Birthday' },
          { id: 'logs', label: '📋 Logs' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              tab === t.id ? 'bg-green-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-6">

        {/* HOME TAB */}
        {tab === 'home' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-green-600">{contacts.length}</div>
                <div className="text-xs text-gray-500 mt-1">Total Contacts</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-blue-600">
                  {contacts.filter(c => c.birthday).length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Birthday Data</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-purple-600">
                  {logs.filter(l => l.type === 'incoming').length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Messages Received</div>
              </div>
              <div className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className="text-2xl font-bold text-amber-600">
                  {logs.filter(l => l.type === 'bulk' || l.type === 'birthday' || l.type === 'festival').length}
                </div>
                <div className="text-xs text-gray-500 mt-1">Campaigns Sent</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">Quick Actions</h3>
              <div className="space-y-2">
                <button onClick={() => setTab('bulk')} className="w-full bg-green-50 hover:bg-green-100 text-green-700 rounded-xl py-2.5 text-sm font-medium transition text-left px-4">
                  📢 Bulk Message bhejo →
                </button>
                <button onClick={() => { setTab('contacts'); fileRef.current?.click() }} className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl py-2.5 text-sm font-medium transition text-left px-4">
                  📥 CSV Import karo →
                </button>
                <button onClick={() => setTab('logs')} className="w-full bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl py-2.5 text-sm font-medium transition text-left px-4">
                  📋 Message logs dekho →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CONTACTS TAB */}
        {tab === 'contacts' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input ref={fileRef} type="file" accept=".csv" onChange={importCSV} className="hidden" />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={importing}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2.5 text-sm font-medium transition"
              >
                {importing ? '⏳ Importing...' : '📥 CSV Upload karo'}
              </button>
              <button onClick={fetchContacts} className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl px-4 py-2.5 text-sm transition">
                🔄
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs text-amber-700">
                📋 <strong>CSV Format:</strong> name, phone, birthday (dd/mm/yyyy), insurance_type, city
              </p>
            </div>

            <div className="space-y-2">
              {contacts.slice(0, 50).map((c, i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{c.name || 'No name'}</div>
                    <div className="text-xs text-gray-500">{c.phone}</div>
                  </div>
                  <div className="text-right">
                    {c.birthday && <div className="text-xs text-pink-500">🎂 {new Date(c.birthday).toLocaleDateString('en-IN', {day:'numeric',month:'short'})}</div>}
                    {c.insurance_type && <div className="text-xs text-blue-500">{c.insurance_type}</div>}
                  </div>
                </div>
              ))}
              {contacts.length > 50 && (
                <p className="text-center text-xs text-gray-400">+{contacts.length - 50} aur contacts hain</p>
              )}
            </div>
          </div>
        )}

        {/* BULK TAB */}
        {tab === 'bulk' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">📢 Bulk Message</h3>

              <label className="block text-xs text-gray-500 mb-1">Filter (optional)</label>
              <select
                value={bulkFilter}
                onChange={e => setBulkFilter(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400"
              >
                <option value="all">Sab contacts ({contacts.length})</option>
                <option value="term">Term Insurance</option>
                <option value="health">Health Insurance</option>
                <option value="car">Car Insurance</option>
              </select>

              <label className="block text-xs text-gray-500 mb-1">Message ({bulkMsg.length}/1000)</label>
              <textarea
                value={bulkMsg}
                onChange={e => setBulkMsg(e.target.value)}
                rows={6}
                placeholder="Namaste {name} Ji! 🙏 ..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
              />
              <p className="text-xs text-gray-400 mb-3">💡 {'{name}'} likhne par automatically client ka naam aayega</p>

              {result && (
                <div className={`rounded-xl p-3 mb-3 text-sm ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {result.success
                    ? `✅ ${result.sent}/${result.total} messages bhej diye!`
                    : '❌ Error: ' + result.message}
                </div>
              )}

              <button
                onClick={sendBulk}
                disabled={sending || !bulkMsg.trim()}
                className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-xl py-3 text-sm font-medium transition"
              >
                {sending ? '⏳ Bhej raha hai...' : `📤 Send karo (${contacts.length} contacts)`}
              </button>
            </div>

            {/* Quick templates */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">⚡ Quick Templates</h3>
              {[
                { label: '🪔 Diwali', msg: 'Namaste {name} Ji! 🪔 Diwali ki haardik shubhkamnayein! Is shubh avsar par apne parivaar ka bhavishy surakshit karein. Free consultation ke liye reply karein. — Yuvraj Charkha, Insurance WORLD' },
                { label: '🌈 Holi', msg: 'Namaste {name} Ji! 🌈 Holi ke rang aapke jeevan mein khushiyan bhar de! — Yuvraj Charkha, Insurance WORLD' },
                { label: '📋 Follow-up', msg: 'Namaste {name} Ji! Aapki insurance query ke baare mein follow up kar raha hoon. Kya aapko abhi bhi help chahiye? — Yuvraj Sir, Insurance WORLD' },
                { label: '💼 New offer', msg: 'Namaste {name} Ji! Ek khaas offer hai aapke liye — is mahine term insurance lene par extra benefits milenge. Free consultation ke liye reply karein. — Insurance WORLD' },
              ].map((t, i) => (
                <button
                  key={i}
                  onClick={() => setBulkMsg(t.msg)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-xl px-3 py-2.5 text-sm text-gray-700 mb-2 transition"
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BIRTHDAY TAB */}
        {tab === 'birthday' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-1 text-sm">🎂 Birthday Automation</h3>
              <p className="text-xs text-gray-500 mb-3">Har roz subah 9 baje automatic birthday wish jaati hai</p>
              <div className="flex items-center gap-2 bg-green-50 rounded-xl p-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-700 font-medium">Active — Daily 9:00 AM</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 text-sm">📅 Upcoming Birthdays</h3>
              {contacts
                .filter(c => c.birthday)
                .map(c => ({ ...c, bday: new Date(c.birthday) }))
                .sort((a, b) => {
                  const now = new Date()
                  const nextA = new Date(now.getFullYear(), a.bday.getMonth(), a.bday.getDate())
                  const nextB = new Date(now.getFullYear(), b.bday.getMonth(), b.bday.getDate())
                  if (nextA < now) nextA.setFullYear(now.getFullYear() + 1)
                  if (nextB < now) nextB.setFullYear(now.getFullYear() + 1)
                  return nextA.getTime() - nextB.getTime()
                })
                .slice(0, 10)
                .map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{c.name}</div>
                      <div className="text-xs text-gray-500">{c.phone}</div>
                    </div>
                    <div className="text-xs text-pink-500 font-medium">
                      🎂 {c.bday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                ))}
              {contacts.filter(c => c.birthday).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Abhi koi birthday data nahi. CSV import karo.</p>
              )}
            </div>
          </div>
        )}

        {/* LOGS TAB */}
        {tab === 'logs' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-700 text-sm">📋 Message Logs</h3>
              <button onClick={fetchLogs} className="text-xs text-gray-400 hover:text-gray-600">🔄 Refresh</button>
            </div>
            {logs.slice(0, 50).map((l, i) => (
              <div key={i} className={`rounded-xl p-3 border text-sm ${
                l.type === 'incoming' ? 'bg-blue-50 border-blue-100' :
                l.type === 'birthday' ? 'bg-pink-50 border-pink-100' :
                l.type === 'festival' ? 'bg-yellow-50 border-yellow-100' :
                l.type === 'bulk' ? 'bg-purple-50 border-purple-100' :
                'bg-gray-50 border-gray-100'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-700">{l.phone}</span>
                  <span className="text-xs text-gray-400">{new Date(l.sent_at).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-xs text-gray-600 line-clamp-2">{l.message}</div>
                <div className="text-xs mt-1">
                  <span className={`px-2 py-0.5 rounded-full ${
                    l.type === 'incoming' ? 'bg-blue-100 text-blue-600' :
                    l.type === 'birthday' ? 'bg-pink-100 text-pink-600' :
                    'bg-purple-100 text-purple-600'
                  }`}>{l.type}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
