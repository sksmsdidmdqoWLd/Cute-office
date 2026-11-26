// GET /.netlify/functions/mailbox-messages?since=<last message id>
// (also reachable as /api/mailbox/messages?since=... via the redirect in netlify.toml)
// Proxies to the real ARSEN mailbox room '배찡이의 소듕한 직원들'.
// First load: ?since=0 (whole history). After that the frontend passes the
// last message id it saw, so only NEW messages come back.
const {
  MAILBOX_BASE,
  mailboxHeaders,
  fetchWithRetry,
  json,
  keyFromEvent,
  keyMissingResponse,
  mailboxUnreachableResponse,
  errorResponse,
  normalizeMessages
} = require('./_shared.cjs')

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'method_not_allowed' })
  }
  const key = keyFromEvent(event)
  if (!key) return keyMissingResponse()

  const since = (event.queryStringParameters && event.queryStringParameters.since) || '0'
  const url = `${MAILBOX_BASE}/messages?since=${encodeURIComponent(since)}`

  let upstream
  try {
    upstream = await fetchWithRetry(url, { headers: mailboxHeaders(key) })
  } catch (e) {
    return mailboxUnreachableResponse()
  }
  if (!upstream.ok) return errorResponse(upstream)

  let data
  try {
    data = await upstream.json()
  } catch {
    data = []
  }
  return json(200, { messages: normalizeMessages(data) })
}
