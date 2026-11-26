// GET /api/mailbox/messages?since=<last message id>
// Proxies to the real ARSEN mailbox room '배찡이의 소듕한 직원들'.
// First load: ?since=0 (whole history). After that the frontend passes the
// last message id it saw, so only NEW messages come back.
import {
  MAILBOX_BASE,
  mailboxHeaders,
  fetchWithRetry,
  keyFromRequest,
  keyMissingResponse,
  errorResponse,
  normalizeMessages
} from './_shared.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }
  const key = keyFromRequest(req)
  if (!key) return keyMissingResponse(res)

  const since = req.query.since ?? '0'
  const url = `${MAILBOX_BASE}/messages?since=${encodeURIComponent(since)}`

  let upstream
  try {
    upstream = await fetchWithRetry(url, { headers: mailboxHeaders(key) })
  } catch (e) {
    return res.status(502).json({
      error: 'mailbox_unreachable',
      message: '우편함 서버가 응답하지 않았어요. 잠시 후 다시 시도해주세요.'
    })
  }
  if (!upstream.ok) return errorResponse(res, upstream)

  let data
  try {
    data = await upstream.json()
  } catch {
    data = []
  }
  return res.status(200).json({ messages: normalizeMessages(data) })
}
