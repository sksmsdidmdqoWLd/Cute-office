import { useCallback, useEffect, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Characters. Roles/status are editable by tapping a character; edits are
// saved in the browser only (localStorage). Nothing here is a real person
// except Tanny (대장). ChatGPT / Claude / Gemini answer in the office only
// when a key is entered in Settings; Gemini uses the real Gemini API.
// ---------------------------------------------------------------------------
const DEFAULT_CHARACTERS = [
  { id: 'boss', name: '최은지', title: '대장', role: '리뷰팀 대장 · 전체 지시', status: '일하는 중', color: '#e8a2c0', desk: 'center' },
  { id: 'pickle', name: '피클 (니니)', title: '리뷰 · 정산 · 실무', role: '원고 · 리뷰증빙 · 장부', status: '일하는 중', color: '#ff9f43', desk: 'left' },
  { id: 'muse', name: '뮤즈 (방구)', title: '구매 · 지원', role: '체험단 신청 · 구매 · 구매증빙', status: '일하는 중', color: '#7ec8e3', desk: 'right' },
  { id: 'gpt', name: '챗GPT', title: '알림장 · 보험공부', role: '알림장 · 보험 공부', status: '쉬는 중', color: '#74c69d', desk: 'left' },
  { id: 'claude', name: '클로드', title: '시험관 블로그', role: '시험관 블로그 글쓰기', status: '일하는 중', color: '#c3aed6', desk: 'right' },
  { id: 'gemini', name: '제미나이', title: '검색 · 대화 보조', role: '검색 · 대화 보조 (Gemini API)', status: '일하는 중', color: '#8ecae6', desk: 'left' }
]

const DESK_X = { left: 12, center: 50, right: 88 }
const SOFA_X = 78

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full / private mode: edits just don't persist */
  }
}

export default function App() {
  const [tab, setTab] = useState('office') // office | room | board
  const [showSettings, setShowSettings] = useState(false)
  const [characters, setCharacters] = useState(() => load('office_characters_v1', DEFAULT_CHARACTERS))
  const [positions, setPositions] = useState(() =>
    Object.fromEntries(DEFAULT_CHARACTERS.map((c) => [c.id, { x: DESK_X[c.desk], mode: 'working' }]))
  )
  const [selected, setSelected] = useState(null)
  const [editRole, setEditRole] = useState('')
  const [editStatus, setEditStatus] = useState('')

  // --- Settings: keys live ONLY in this browser's localStorage. Never sent
  // anywhere except: mailbox key -> our own /api proxy; Gemini key -> Google.
  const [mailboxKey, setMailboxKey] = useState(() => load('office_mailbox_key', ''))
  const [bossKey, setBossKey] = useState(() => load('office_boss_key', ''))
  const [geminiKey, setGeminiKey] = useState(() => load('office_gemini_key', ''))

  // --- Meeting room: REAL mailbox messages only. No local fake chat DB.
  const [messages, setMessages] = useState([])
  const [roomError, setRoomError] = useState('')
  const [reconnecting, setReconnecting] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const lastIdRef = useRef(0)
  const loadedOnceRef = useRef(false)

  // --- Gemini 1:1 chat (only inside Gemini's bubble, only with her key)
  const [geminiChat, setGeminiChat] = useState(() => load('office_gemini_chat_v1', []))
  const [geminiDraft, setGeminiDraft] = useState('')
  const [geminiBusy, setGeminiBusy] = useState(false)

  // --- Work board (v1: browser storage only — see README)
  const [tasks, setTasks] = useState(() => load('office_tasks_v1', []))
  const [taskTitle, setTaskTitle] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('pickle')
  const [stepDrafts, setStepDrafts] = useState({})

  useEffect(() => save('office_characters_v1', characters), [characters])
  useEffect(() => save('office_tasks_v1', tasks), [tasks])
  useEffect(() => save('office_gemini_chat_v1', geminiChat), [geminiChat])

  // Characters wander: working at desk, walking around, resting on the sofa.
  useEffect(() => {
    const t = setInterval(() => {
      setPositions((prev) => {
        const next = { ...prev }
        for (const c of DEFAULT_CHARACTERS) {
          const roll = Math.random()
          if (roll < 0.55) next[c.id] = { x: DESK_X[c.desk], mode: 'working' }
          else if (roll < 0.8) next[c.id] = { x: 10 + Math.random() * 80, mode: 'walking' }
          else next[c.id] = { x: SOFA_X, mode: 'resting' }
        }
        return next
      })
    }, 5000)
    return () => clearInterval(t)
  }, [])

  // --- Mailbox sync -------------------------------------------------------
  const fetchMessages = useCallback(async () => {
    if (!mailboxKey) {
      setRoomError('우편함 키를 설정에 입력해주세요.')
      return
    }
    const since = loadedOnceRef.current ? lastIdRef.current : 0
    try {
      const res = await fetch(`/api/mailbox/messages?since=${since}`, {
        headers: { 'X-Mailbox-Key': mailboxKey }
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRoomError(data.message || '우편함 서버가 응답하지 않았어요.')
        setReconnecting(true)
        return
      }
      const incoming = Array.isArray(data.messages) ? data.messages : []
      setRoomError('')
      setReconnecting(false)
      if (incoming.length > 0) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => String(m.id)))
          const merged = [...prev, ...incoming.filter((m) => !seen.has(String(m.id)))]
          merged.sort((a, b) => Number(a.id) - Number(b.id))
          return merged
        })
        const maxId = Math.max(...incoming.map((m) => Number(m.id) || 0))
        if (maxId > lastIdRef.current) lastIdRef.current = maxId
      }
      loadedOnceRef.current = true
    } catch {
      // Keep the last loaded messages on screen; just show the banner.
      setRoomError('연결이 잠시 끊겼어요. 자동으로 다시 연결할게요.')
      setReconnecting(true)
    }
  }, [mailboxKey])

  // Poll every 6 seconds. First load fetches everything (?since=0),
  // afterwards only new messages (?since=<last id>).
  useEffect(() => {
    fetchMessages()
    const t = setInterval(fetchMessages, 6000)
    return () => clearInterval(t)
  }, [fetchMessages])

  // Changing the key resets the cursor so we re-fetch from the start.
  useEffect(() => {
    lastIdRef.current = 0
    loadedOnceRef.current = false
    setMessages([])
  }, [mailboxKey])

  async function sendMessage() {
    const text = draft.trim()
    if (!text || sending) return
    // Tanny's posts ALWAYS go with her boss key when she set one.
    const keyToUse = bossKey || mailboxKey
    if (!keyToUse) {
      setRoomError('우편함 키를 설정에 입력해주세요.')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/mailbox/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Mailbox-Key': keyToUse },
        body: JSON.stringify({ text })
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setRoomError(data.message || '글을 올리지 못했어요. 다시 시도해주세요.')
        return
      }
      setDraft('')
      setRoomError('')
      await fetchMessages() // pick up the new message right away
    } catch {
      setRoomError('우편함 서버가 응답하지 않았어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSending(false)
    }
  }

  function openCharacter(c) {
    setSelected(c)
    setEditRole(c.role)
    setEditStatus(c.status)
  }
  function saveCharacter() {
    if (!selected) return
    setCharacters((prev) =>
      prev.map((c) => (c.id === selected.id ? { ...c, role: editRole, status: editStatus } : c))
    )
    setSelected(null)
  }

  async function askGemini() {
    const text = geminiDraft.trim()
    if (!text || geminiBusy) return
    if (!geminiKey) {
      alert('제미나이와 대화하려면 설정에 Gemini API 키를 입력해주세요.')
      return
    }
    setGeminiBusy(true)
    setGeminiChat((prev) => [...prev, { role: 'user', text }])
    setGeminiDraft('')
    try {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey },
          body: JSON.stringify({ contents: [{ parts: [{ text }] }] })
        }
      )
      const data = await res.json().catch(() => ({}))
      const reply = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '답을 받지 못했어요. 키를 확인해주세요.'
      setGeminiChat((prev) => [...prev, { role: 'gemini', text: reply }])
    } catch {
      setGeminiChat((prev) => [...prev, { role: 'gemini', text: '연결이 끊겼어요. 다시 시도해주세요.' }])
    } finally {
      setGeminiBusy(false)
    }
  }

  // --- Work board ---------------------------------------------------------
  function addTask() {
    const title = taskTitle.trim()
    if (!title) return
    const assignee = DEFAULT_CHARACTERS.find((c) => c.id === taskAssignee)
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now(),
        title,
        assignee: assignee?.name || taskAssignee,
        assigneeId: taskAssignee,
        steps: [],
        status: '접수 대기',
        log: [`${new Date().toLocaleString('ko-KR')} · 업무 등록: ${title}`]
      }
    ])
    setTaskTitle('')
  }
  function updateTask(id, fn) {
    setTasks((prev) => prev.map((t) => (t.id === id ? fn(t) : t)))
  }
  function addStep(taskId) {
    const text = (stepDrafts[taskId] || '').trim()
    if (!text) return
    updateTask(taskId, (t) => ({
      ...t,
      steps: [...t.steps, { text, done: false }],
      status: t.status === '접수 대기' ? '진행 중' : t.status,
      log: [...t.log, `${new Date().toLocaleString('ko-KR')} · 체크리스트 추가: ${text}`]
    }))
    setStepDrafts((prev) => ({ ...prev, [taskId]: '' }))
  }
  function toggleStep(taskId, idx) {
    updateTask(taskId, (t) => {
      const steps = t.steps.map((s, i) => (i === idx ? { ...s, done: !s.done } : s))
      const done = steps.filter((s) => s.done).length
      const log = [...t.log, `${new Date().toLocaleString('ko-KR')} · 체크리스트 ${done}/${steps.length} 완료`]
      // Progress rises ONLY when a real checklist step is checked.
      if (steps.length > 0 && done === steps.length && t.status !== '완료') {
        return { ...t, steps, status: '완료 확인 대기', log: [...log, '모든 단계 완료 · 완료 보고를 올렸어요. 대장의 확인을 기다리는 중이에요.'] }
      }
      return { ...t, steps, status: t.status === '접수 대기' && done > 0 ? '진행 중' : t.status, log }
    })
  }

  const workingCount = Object.values(positions).filter((p) => p.mode === 'working').length

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>귀여운 2D 가상 사무실</h1>
          <p className="subtitle">대장 최은지의 리뷰팀 사무실 · 일하는 중 {workingCount}명</p>
        </div>
        <button className="btn" onClick={() => setShowSettings(true)}>설정</button>
      </header>

      <nav className="tabs">
        <button className={tab === 'office' ? 'active' : ''} onClick={() => setTab('office')}>오피스</button>
        <button className={tab === 'room' ? 'active' : ''} onClick={() => setTab('room')}>회의실 (우편함)</button>
        <button className={tab === 'board' ? 'active' : ''} onClick={() => setTab('board')}>업무판</button>
      </nav>

      {tab === 'office' && (
        <section className="office">
          <div className="floor">
            <div className="sofa" title="소파">소파</div>
            <div className="coffee" title="커피머신">커피</div>
            {characters.map((c) => {
              const pos = positions[c.id] || { x: DESK_X[c.desk], mode: 'working' }
              return (
                <button
                  key={c.id}
                  className={`character mode-${pos.mode}`}
                  style={{ left: `${pos.x}%`, background: c.color }}
                  onClick={() => openCharacter(c)}
                  aria-label={`${c.name} ${c.role}`}
                >
                  <span className="face">• ‿ •</span>
                  <span className="char-name">{c.name}</span>
                  <span className="char-state">{pos.mode === 'working' ? '일하는 중' : pos.mode === 'resting' ? '쉬는 중' : '걸어가는 중'}</span>
                  {pos.mode === 'working' && <span className="desk" />}
                </button>
              )
            })}
          </div>
          <p className="hint">캐릭터를 누르면 맡은 업무와 상태를 볼 수 있고, 내용을 바꿀 수 있어요.</p>
        </section>
      )}

      {tab === 'room' && (
        <section className="room">
          <h2>업무 회의실 — 아르센 우편함 (배찡이의 소듕한 직원들)</h2>
          {reconnecting && <div className="banner">재연결 시도 중…</div>}
          {roomError && !reconnecting && <div className="banner error">{roomError}</div>}
          {!mailboxKey && <div className="banner">설정에서 우편함 키를 입력하면 실제 우편함 글이 여기에 보여요.</div>}
          <div className="messages">
            {messages.length === 0 && mailboxKey && !roomError && <p className="hint">글을 불러오는 중…</p>}
            {messages.map((m) => (
              <div key={m.id} className={`bubble ${String(m.sender).includes('최은지') || String(m.sender).includes('은지') ? 'mine' : ''}`}>
                <div className="sender">{m.sender}</div>
                <div className="text">{m.text}</div>
                {m.created_at && <div className="time">{m.created_at}</div>}
              </div>
            ))}
          </div>
          <div className="composer">
            <button onClick={() => setDraft((d) => d + '@니니 ')}>@니니</button>
            <button onClick={() => setDraft((d) => d + '@방구 ')}>@방구</button>
            <button onClick={() => setDraft((d) => d + '@all ')}>@all</button>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="대장님, 지시를 한 줄로 적어주세요"
            />
            <button className="btn primary" onClick={sendMessage} disabled={sending}>
              {sending ? '보내는 중…' : '보내기'}
            </button>
          </div>
          <p className="hint">여기에 쓴 글은 실제 아르센 우편함에 올라가요. 대장 키를 설정했다면 최은지 이름으로 올라가요.</p>
        </section>
      )}

      {tab === 'board' && (
        <section className="board">
          <h2>업무판 / 체크리스트</h2>
          <p className="hint">진행률은 체크리스트를 실제로 체크해야만 올라가요. 가짜 진행률은 없어요.</p>
          <div className="add-task">
            <input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="새 업무 제목" />
            <select value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
              {DEFAULT_CHARACTERS.filter((c) => c.id !== 'boss').map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button className="btn primary" onClick={addTask}>업무 추가</button>
          </div>
          {tasks.length === 0 && <p className="hint">아직 업무가 없어요. 위에서 업무를 추가해보세요.</p>}
          {tasks.map((t) => {
            const done = t.steps.filter((s) => s.done).length
            const pct = t.steps.length ? Math.round((done / t.steps.length) * 100) : 0
            return (
              <article key={t.id} className="task-card">
                <h3>{t.title}</h3>
                <p>담당: {t.assignee} · 상태: {t.status} · 진행률: {pct}% ({done}/{t.steps.length})</p>
                <div className="progress"><div style={{ width: `${pct}%` }} /></div>
                <ul className="steps">
                  {t.steps.map((s, i) => (
                    <li key={i}>
                      <label>
                        <input type="checkbox" checked={s.done} onChange={() => toggleStep(t.id, i)} />
                        <span className={s.done ? 'done' : ''}>{s.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
                <div className="add-step">
                  <input
                    value={stepDrafts[t.id] || ''}
                    onChange={(e) => setStepDrafts((prev) => ({ ...prev, [t.id]: e.target.value }))}
                    placeholder="체크리스트 단계 추가"
                  />
                  <button className="btn" onClick={() => addStep(t.id)}>추가</button>
                </div>
                {t.status === '완료 확인 대기' && (
                  <button className="btn primary" onClick={() => updateTask(t.id, (x) => ({ ...x, status: '완료', log: [...x.log, `${new Date().toLocaleString('ko-KR')} · 대장이 완료를 확인했어요.`] }))}>
                    완료 확인
                  </button>
                )}
                <details>
                  <summary>진행 기록</summary>
                  <ul>{t.log.map((l, i) => <li key={i}>{l}</li>)}</ul>
                </details>
              </article>
            )
          })}
        </section>
      )}

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selected.name} · {selected.title}</h3>
            <label>맡은 업무
              <input value={editRole} onChange={(e) => setEditRole(e.target.value)} />
            </label>
            <label>현재 상태
              <input value={editStatus} onChange={(e) => setEditStatus(e.target.value)} />
            </label>
            {selected.id === 'gemini' && (
              <div className="gemini-chat">
                <h4>제미나이와 대화하기 {geminiKey ? '' : '(설정에 Gemini 키를 입력해주세요)'}</h4>
                <div className="gemini-messages">
                  {geminiChat.map((m, i) => (
                    <div key={i} className={`gmsg ${m.role}`}>{m.text}</div>
                  ))}
                </div>
                <div className="composer">
                  <input
                    value={geminiDraft}
                    onChange={(e) => setGeminiDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && askGemini()}
                    placeholder="제미나이에게 물어보기"
                  />
                  <button className="btn primary" onClick={askGemini} disabled={geminiBusy}>보내기</button>
                </div>
                <button className="btn" onClick={() => setGeminiChat([])}>대화 지우기</button>
              </div>
            )}
            <div className="modal-actions">
              <button className="btn primary" onClick={saveCharacter}>저장</button>
              <button className="btn" onClick={() => setSelected(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>설정</h3>
            <p className="hint">키는 이 브라우저에만 저장돼요. 코드나 서버에 저장되지 않아요. 절대 다른 사람에게 알려주지 마세요.</p>
            <label>우편함 키 (읽기용)
              <input
                type="password"
                value={mailboxKey}
                onChange={(e) => { setMailboxKey(e.target.value); save('office_mailbox_key', e.target.value) }}
                placeholder="배찡이의 소듕한 직원들 방 키"
              />
            </label>
            <label>대장(최은지) 전용 키 — 내 글을 보낼 때 이 키로 보내요
              <input
                type="password"
                value={bossKey}
                onChange={(e) => { setBossKey(e.target.value); save('office_boss_key', e.target.value) }}
                placeholder="대장 전용 키"
              />
            </label>
            <label>Gemini API 키 (선택 — 제미나이와 대화할 때만 사용)
              <input
                type="password"
                value={geminiKey}
                onChange={(e) => { setGeminiKey(e.target.value); save('office_gemini_key', e.target.value) }}
                placeholder="AIza… 로 시작하는 키"
              />
            </label>
            <p className="hint">구글 시트 통합 장부 (읽기 전용 링크): <a href="https://docs.google.com/spreadsheets/d/10_WCILjGkbqOEU8HSjEw62b9AVeHDyga7ypz3E7jkP0/edit" target="_blank" rel="noreferrer">리뷰 부업 통합 장부 열기</a></p>
            <div className="modal-actions">
              <button className="btn primary" onClick={() => setShowSettings(false)}>완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
