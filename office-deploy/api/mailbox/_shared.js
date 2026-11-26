// Shared helpers for the ARSEN mailbox proxy.
// The mailbox key is NEVER hardcoded here. It comes from the request
// (the key Tanny types into Settings, stored only in her browser).
// These functions run on Vercel's server, never in the browser, so the
// browser never talks to ARSEN directly (Cloudflare blocks that).

export const MAILBOX_BASE = 'https://mailbox.arsen-ai.com/r/e88O50qtgN9X'
export const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export function mailboxHeaders(key) {
  return {
    'X-Mailbox-Key': key,
    Accept: 'application/json',
    'Accept-Encoding': 'identity',
    'User-Agent': UA
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function isTransient(status) {
  return status === 429 || status >= 500
}

// Fetch with retries for transient failures only (429 / 5xx / timeout).
// Wrong-key errors (401/403) are returned immediately, never retried.
export async function fetchWithRetry(url, options, attempts = 3) {
  let lastError = null
  for (let i = 0; i < attempts; i++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 10000)
      let res
      try {
        res = await fetch(url, { ...options, signal: controller.signal })
      } finally {
        clearTimeout(timer)
      }
      if (isTransient(res.status) && i < attempts - 1) {
        await sleep(800 * (i + 1))
        continue
      }
      return res
    } catch (e) {
      lastError = e
      if (i < attempts - 1) {
        await sleep(800 * (i + 1))
        continue
      }
      throw e
    }
  }
  throw lastError
}

export function keyFromRequest(req) {
  // Key arrives as a header from our own frontend (never in a URL).
  return req.headers['x-mailbox-key'] || req.headers['X-Mailbox-Key'] || ''
}

export function keyMissingResponse(res) {
  return res.status(400).json({ error: 'key_missing', message: '우편함 키를 설정에 입력해주세요.' })
}

// Turn the mailbox API's raw response into a clear, friendly error.
export async function errorResponse(res, upstream) {
  const text = await upstream.text().catch(() => '')
  if (upstream.status === 401 || upstream.status === 403) {
    return res.status(upstream.status).json({
      error: 'forbidden',
      message: '우편함 키가 맞지 않아요. 설정에서 키를 다시 확인해주세요.'
    })
  }
  if (upstream.status === 429) {
    return res.status(429).json({
      error: 'rate_limited',
      message: '요청이 너무 몰려서 잠시 제한됐어요. 조금만 기다리면 자동으로 다시 연결돼요.'
    })
  }
  return res.status(upstream.status || 502).json({
    error: 'mailbox_error',
    message: '우편함 서버가 응답하지 않았어요. 잠시 후 다시 시도해주세요.',
    detail: text.slice(0, 200)
  })
}

// Normalize the many shapes the mailbox API may return into one list.
export function normalizeMessages(data) {
  const list = Array.isArray(data) ? data : data?.messages || data?.items || []
  return list
    .map((m) => ({
      id: m.id ?? m.message_id ?? m._id,
      sender: m.sender ?? m.author ?? m.name ?? '알 수 없음',
      text: m.text ?? m.content ?? m.message ?? '',
      created_at: m.created_at ?? m.createdAt ?? m.time ?? ''
    }))
    .filter((m) => m.id !== undefined && m.id !== null && m.text !== '')
}
