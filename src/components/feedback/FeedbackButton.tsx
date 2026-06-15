import { useState } from 'react'
import { MessageSquarePlus, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import { useJournal } from '../../store'

const CATEGORIES = [
  { id: 'bug', label: '🐞 Bug' },
  { id: 'idea', label: '💡 Idea' },
  { id: 'praise', label: '❤️ Praise' },
  { id: 'other', label: '💬 Other' },
] as const

type Status = { kind: 'idle' | 'sending' } | { kind: 'sent'; url?: string } | { kind: 'error'; msg: string }

const field = 'w-full rounded-md border border-border bg-surface0 px-3 py-2 text-sm text-text placeholder:text-overlay0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'

/**
 * In-app feedback → GitHub issue (via the /api/feedback function, which holds
 * the token server-side). Self-contained: own trigger, own submit lifecycle —
 * no global toast/provider dependency.
 */
export function FeedbackButton() {
  const { data } = useJournal()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>('idea')
  const [message, setMessage] = useState('')
  const [contact, setContact] = useState('')
  const [hp, setHp] = useState('') // honeypot
  const [status, setStatus] = useState<Status>({ kind: 'idle' })

  function reset() {
    setMessage(''); setContact(''); setHp(''); setCategory('idea'); setStatus({ kind: 'idle' })
  }

  async function submit() {
    if (message.trim().length < 3) { setStatus({ kind: 'error', msg: 'Add a few more words first.' }); return }
    setStatus({ kind: 'sending' })
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message, category, contact, hp,
          meta: { url: location.href, version: data.version, ua: navigator.userAgent },
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { setStatus({ kind: 'error', msg: j.error || 'Could not send — try again.' }); return }
      setStatus({ kind: 'sent', url: j.url })
    } catch {
      setStatus({ kind: 'error', msg: 'Network error — try again.' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset() }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Send feedback" title="Send feedback">
          <MessageSquarePlus size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {status.kind === 'sent' ? (
          <>
            <DialogHeader>
              <DialogTitle>Thanks! 🙌</DialogTitle>
              <DialogDescription>Your feedback was filed. It helps shape what gets built next.</DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-between">
              {status.url && (
                <a href={status.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-blue hover:underline">
                  View on GitHub <ExternalLink size={13} />
                </a>
              )}
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Send feedback</DialogTitle>
              <DialogDescription>Bug, idea, or a kind word — it opens a GitHub issue. No account needed.</DialogDescription>
            </DialogHeader>

            <div className="flex gap-1.5">
              {CATEGORIES.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  size="sm"
                  variant={category === c.id ? 'secondary' : 'ghost'}
                  onClick={() => setCategory(c.id)}
                >
                  {c.label}
                </Button>
              ))}
            </div>

            <textarea
              autoFocus
              className={field}
              rows={4}
              maxLength={5000}
              placeholder="What happened, or what would make bujo better?"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <input
              className={field}
              type="text"
              maxLength={200}
              placeholder="Email or @handle (optional — only if you want a reply)"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
            {/* Honeypot: visually hidden, off-screen; real users never fill it. */}
            <input
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="absolute left-[-9999px] h-0 w-0 opacity-0"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />

            {status.kind === 'error' && <p className="text-sm text-red">{status.msg}</p>}

            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={status.kind === 'sending'}>Cancel</Button>
              <Button onClick={submit} disabled={status.kind === 'sending' || message.trim().length < 3}>
                {status.kind === 'sending' ? 'Sending…' : 'Send'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
