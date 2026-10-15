'use client'
import { useState, useRef, useEffect  } from 'react'

export default function ChatWidget({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
}, [messages])


  async function send() {
    if (!input.trim() || loading) return
    const question = input
    setMessages((m) => [...m, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    setMessages((m) => [...m, { role: 'bot', text: '' }])

    try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ question, courseId }),
    })

    if (!res.ok) {
      throw new Error('Сервер ответил ошибкой')
    }

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      setMessages((m) => {
        const copy = [...m]
        const last = copy[copy.length - 1]
        copy[copy.length - 1] = { ...last, text: last.text + chunk }
        return copy
      })
    }
  } catch(e) {
    setMessages((m) => {
      const copy = [...m]
      copy[copy.length - 1] = { role: 'bot', text: 'Что-то пошло не так, попробуйте еще раз'}
      return copy
    })
  } finally {
    setLoading(false)
  }
}

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ position: 'fixed', bottom: 24, right: 24, background: '#4ade80', color: '#0f0f0f', border: 'none', borderRadius: '50%', width: 56, height: 56, fontSize: 24, cursor: 'pointer' }}
      >
        💬
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, width: 340, height: 460, background: '#141414', border: '0.5px solid #1e1e1e', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', color: '#f0f0f0' }}>
        <span>ИИ Ассистент</span>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', background: m.role === 'user' ? '#4ade80' : '#1e1e1e', color: m.role === 'user' ? '#0f0f0f' : '#e0e0e0', padding: '8px 12px', borderRadius: 10, maxWidth: '85%', fontSize: 14 }}>
            {m.text || '...'}
          </div>
        ))}
          <div ref={messagesEndRef} />
      </div>
      
      <div style={{ padding: 12, borderTop: '0.5px solid #1e1e1e', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Задать вопрос..."
          style={{ flex: 1, background: '#0f0f0f', border: '0.5px solid #333', borderRadius: 8, padding: '8px 12px', color: '#e0e0e0', fontSize: 14 }}
        />
        <button onClick={send} disabled={loading} style={{ background: '#4ade80', border: 'none', borderRadius: 8, padding: '8px 14px', color: '#0f0f0f', cursor: 'pointer' }}>→</button>
      </div>
    </div>
  )
}