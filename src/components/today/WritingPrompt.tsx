import { CaretDown } from '@/components/icons'
import { Icon } from '@/components/Icon'
import { useState } from 'react'
import { useJournal } from '../../store'
import { Card, Input, Textarea } from '../ui'
import { Button } from '../ui/button'
import { ImageUpload } from '../ImageUpload'
import { PROMPT_FIELDS, promptFieldFor, promptForDay, type PromptField } from '../../lib/prompts'

/**
 * One writing prompt, rotating daily, with the other two behind an expander.
 *
 * Gratitude, Reflection and Daily memory were three blank boxes asking
 * variations of the same question at the same moment. Three empty textareas
 * read as homework and get skipped; one gets answered. Nothing is removed —
 * the other two are one tap away, and a day that already has an answer in one
 * of them opens with it visible rather than hidden behind the expander.
 *
 * The rotation is by date, not random, so the same day always asks the same
 * thing — reopening yesterday must not change the question you were answering.
 */
const FIELDS = PROMPT_FIELDS
type Field = PromptField

const LABEL: Record<Field, { title: string; subtitle: string; placeholder: string }> = {
  gratitude: {
    title: 'Gratitude',
    subtitle: "One thing you're grateful for today",
    placeholder: "Today I'm grateful for…",
  },
  reflection: {
    title: 'Reflection',
    subtitle: '', // filled per-day from promptForDay
    placeholder: 'Write a few honest lines…',
  },
  memory: {
    title: 'Daily memory',
    subtitle: 'One line to remember this day by',
    placeholder: 'A single memorable moment…',
  },
}

export function WritingPrompt({ date }: { date: string }) {
  const { data, setGratitude, setMemory } = useJournal()
  const gratitude = data.gratitude.find((g) => g.date === date)?.text ?? ''
  const memoryRec = data.memories.find((m) => m.date === date)
  const memory = memoryRec?.text ?? ''

  const lead = promptFieldFor(date)
  // Anything already written stays visible — the expander hides blank fields,
  // never the person's own words.
  const written = new Set<Field>()
  if (gratitude) written.add('gratitude')
  if (memory) written.add('memory')
  const [open, setOpen] = useState(false)

  const shown = FIELDS.filter((f) => open || f === lead || written.has(f))
  const hiddenCount = FIELDS.length - shown.length

  function field(f: Field) {
    if (f === 'gratitude') {
      return (
        <Input
          value={gratitude}
          onChange={(e) => setGratitude(date, e.target.value)}
          placeholder={LABEL.gratitude.placeholder}
        />
      )
    }
    if (f === 'memory') {
      return (
        <>
          <Input
            value={memory}
            onChange={(e) => setMemory(date, { text: e.target.value })}
            placeholder={LABEL.memory.placeholder}
          />
          <div className="mt-3">
            <ImageUpload
              value={memoryRec?.photo}
              onChange={(photo) => setMemory(date, { photo })}
              label="Add a photo of the day"
              className={memoryRec?.photo ? 'taped' : ''}
            />
          </div>
        </>
      )
    }
    return (
      <>
        <Textarea
          key={`reflect-${date}`}
          defaultValue=""
          placeholder={LABEL.reflection.placeholder}
          onBlur={(e) =>
            e.target.value.trim() &&
            setMemory(date, { text: `${memory ? memory + ' · ' : ''}${e.target.value.trim()}` })
          }
          rows={3}
        />
        <p className="mt-1 text-label text-fg-2">Saved into today's memory when you click away.</p>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {shown.map((f) => (
        <Card
          key={f}
          title={LABEL[f].title}
          subtitle={f === 'reflection' ? promptForDay(date) : LABEL[f].subtitle}
        >
          {field(f)}
        </Card>
      ))}

      {hiddenCount > 0 && (
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="self-start gap-1.5">
          <Icon as={CaretDown} size="sm" />
          {hiddenCount === 1 ? 'One more prompt' : `${hiddenCount} more prompts`}
        </Button>
      )}
    </div>
  )
}
