// POST /.netlify/functions/mailbox-send  { text: "..." }
// (also reachable as /api/mailbox/send via the redirect in netlify.toml)
// Proxies a chat message to the real ARSEN mailbox room.
// The key used is the one the frontend sends in the X-Mailbox-Key header:
// Tanny's posts always use her [대장(최은지) 전용 키] when she set one,
// otherwise her normal mailbox key. Nothing is hardcoded here.
const {
  MAILBOX_BASE,
  mailboxHeaders,
  fetchWithRetry,
  json,
  keyFromEvent,
  keyMissingResponse,
  mailboxUnreachableResponse,
  errorResponse
} = require('./_shared.cjs')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'method_not_allowed' })
  }
  const key = keyFromEvent(event)
  if (!key) return keyMissingResponse()

  let text = ''
  try {
    const parsed = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : event.body
    text = parsed?.text
  } catch {
    text = ''
  }
  if (!text || !String(text).trim()) {
    return json(400, { error: 'empty_text', message: '보낼 글을 입력해주세요.' })
  }

  let upstream
  try {
    upstream = await fetchWithRetry(`${MAILBOX_BASE}/send`, {
      method: 'POST',
      headers: { ...mailboxHeaders(key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: String(text) })
    })
  } catch (e) {
    return mailboxUnreachableResponse()
  }
  if (!upstream.ok) return errorResponse(upstream)

  let data = {}
  try {
    data = await upstream.json()
  } catch {
    data = {}
  }
  return json(200, { ok: true, ...data })
}
