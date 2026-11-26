// POST /api/mailbox/send  { text: "..." }
// Proxies a chat message to the real ARSEN mailbox room.
// The key used is the one the frontend sends in the X-Mailbox-Key header:
// Tanny's posts always use her [대장(최은지) 전용 키] when she set one,
// otherwise her normal mailbox key. Nothing is hardcoded here.
import {
  MAILBOX_BASE,
  mailboxHeaders,
  fetchWithRetry,
  keyFromRequest,
  keyMissingResponse,
  errorResponse
} from './_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const key = keyFromRequest(req)
  if (!key) return keyMissingResponse(res)

  const text = typeof req.body === 'string' ? req.body : req.body?.text
  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'empty_text', message: '보낼 글을 입력해주세요.' })
  }

  let upstream
  try {
    upstream = await fetchWithRetry(`${MAILBOX_BASE}/send`, {
      method: 'POST',
      headers: { ...mailboxHeaders(key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: String(text) })
    })
  } catch (e) {
    return res.status(502).json({
      error: 'mailbox_unreachable',
      message: '우편함 서버가 응답하지 않았어요. 잠시 후 다시 시도해주세요.'
    })
  }
  if (!upstream.ok) return errorResponse(res, upstream)

  let data = {}
  try {
    data = await upstream.json()
  } catch {
    data = {}
  }
  return res.status(200).json({ ok: true, ...data })
}
