import { describe, expect, it } from 'vitest'
import { entriesCsv, habitsCsv, metricsCsv, workoutsCsv, parseMetricsCsv, stripSyncSecrets, daysSinceBackup, habitLogCsv, pickleballCsv, recoveryCsv, personalRecordsCsv, collectionCsv, redactSensitive } from './csv'
import { emptyJournal } from './storage'

describe('csv export', () => {
  it('escapes commas/quotes and includes headers', () => {
    const d = emptyJournal()
    d.entries = [{ id: '1', date: '2026-06-11', type: 'task', text: 'buy milk, eggs', status: 'open', important: true, memory: false, tags: ['shop'], createdAt: '2026-06-11' }]
    const csv = entriesCsv(d)
    expect(csv.split('\n')[0]).toBe('date,type,status,important,text,tags')
    expect(csv).toContain('"buy milk, eggs"')
    expect(csv).toContain('yes')
  })

  it('habits export is long-format (one row per completion)', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'h', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-01-01' }]
    d.habitLog = { '2026-06-11': ['h'] }
    expect(habitsCsv(d)).toContain('2026-06-11,Water,food')
  })

  it('metrics and workouts export with headers on an empty journal', () => {
    expect(metricsCsv(emptyJournal()).startsWith('date,mood,stress,sleep')).toBe(true)
    expect(workoutsCsv(emptyJournal()).startsWith('date,activity,split')).toBe(true)
  })

  it('parseMetricsCsv round-trips an exported metrics CSV', () => {
    const d = emptyJournal()
    d.metrics = [{ date: '2026-06-11', mood: 7, sleep: 8 }]
    const rows = parseMetricsCsv(metricsCsv(d))
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ date: '2026-06-11', patch: { mood: 7, sleep: 8 } })
  })

  it('parseMetricsCsv skips malformed dates and empty cells', () => {
    const rows = parseMetricsCsv('date,mood\nnot-a-date,5\n2026-06-12,\n2026-06-13,9')
    expect(rows).toEqual([{ date: '2026-06-13', patch: { mood: 9 } }])
  })
})

describe('habitLogCsv', () => {
  it('has headers and is empty (header-only) on a fresh journal', () => {
    expect(habitLogCsv(emptyJournal())).toBe('date,habit,category,value,target,done')
  })

  it('marks a check habit done on logged days', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'h', name: 'Read', category: 'wellness', color: 'sky', startedOn: '2026-01-01', type: 'check' }]
    d.habitLog = { '2026-06-11': ['h'] }
    const csv = habitLogCsv(d)
    expect(csv).toContain('2026-06-11,Read,wellness,1,,yes')
  })

  it('count habit is done only when value meets target', () => {
    const d = emptyJournal()
    d.habits = [{ id: 'w', name: 'Water', category: 'food', color: 'sky', startedOn: '2026-01-01', type: 'count', target: 8, unit: 'glasses' }]
    d.habitValues = { '2026-06-11': { w: 8 }, '2026-06-12': { w: 3 } }
    const csv = habitLogCsv(d)
    expect(csv).toContain('2026-06-11,Water,food,8,8,yes')
    expect(csv).toContain('2026-06-12,Water,food,3,8,')
    // 3 < 8 → not done (no 'yes' on that row)
    expect(csv).not.toContain('2026-06-12,Water,food,3,8,yes')
  })
})

describe('pickleballCsv', () => {
  it('header-only on a fresh journal', () => {
    expect(pickleballCsv(emptyJournal()).startsWith('kind,date,format,won,lost')).toBe(true)
    expect(pickleballCsv(emptyJournal()).split('\n')).toHaveLength(1)
  })

  it('emits a session row and an event row', () => {
    const d = emptyJournal()
    d.pickleball = [{ id: 's1', date: '2026-06-10', format: 'doubles', gamesWon: 3, gamesLost: 1, partner: 'Sam' }]
    d.pickleballEvents = [{ id: 'e1', date: '2026-06-12', name: 'Summer Open', kind: 'tournament', format: 'single-elim', wins: 2, losses: 1, placement: 'Gold' }]
    const csv = pickleballCsv(d)
    expect(csv).toContain('session,2026-06-10,doubles,3,1,Sam')
    expect(csv).toContain('tournament,2026-06-12,single-elim,2,1')
    expect(csv).toContain('Summer Open · Gold')
  })
})

describe('recoveryCsv', () => {
  it('header-only on a fresh journal', () => {
    expect(recoveryCsv(emptyJournal())).toBe('kind,addiction,date,trigger,technique,intensity,note')
  })

  it('exports urge wins, resets, and per-addiction streaks', () => {
    const d = emptyJournal()
    d.nofap = {
      startedOn: '2026-06-01',
      best: 30,
      relapses: [{ id: 'r1', date: '2026-06-05', trigger: 'stress', note: 'late night' }],
      urgeLog: [{ id: 'u1', date: '2026-06-03', trigger: 'boredom', technique: 'surf', intensity: 3, note: 'surfed it' }],
      addictions: [{ id: 'a1', name: 'Sugar', startedOn: '2026-06-02', best: 10, relapses: [{ id: 'r2', date: '2026-06-06', trigger: 'cake', note: '' }] }],
    }
    const csv = recoveryCsv(d)
    expect(csv).toContain('urge,primary,2026-06-03,boredom,surf,3,surfed it')
    expect(csv).toContain('reset,primary,2026-06-05,stress')
    expect(csv).toContain('streak,Sugar,2026-06-02,best 10d')
    expect(csv).toContain('reset,Sugar,2026-06-06,cake')
  })
})

describe('personalRecordsCsv', () => {
  it('header-only on a fresh journal', () => {
    expect(personalRecordsCsv(emptyJournal())).toBe('kind,metric,value,reps,est1RM')
  })

  it('emits the best set per exercise with an Epley 1RM, plus cardio PBs', () => {
    const d = emptyJournal()
    d.workouts = [
      { id: 'w1', date: '2026-06-10', activity: 'Strength', sets: ['Bench 5x5 @ 80', 'Bench 8x8 @ 70'], distanceKm: 5, calories: 400, durationMin: 30, notes: '' },
      { id: 'w2', date: '2026-06-11', activity: 'Run', sets: [], distanceKm: 10, calories: 700, durationMin: 60, notes: '' },
    ]
    const csv = personalRecordsCsv(d)
    // Best Bench set is the heaviest (80kg @ 5 reps) → Epley 80*(1+5/30)=93.33 → rounded to .5 = 93.5
    expect(csv).toContain('strength,Bench,80,5,93.5')
    expect(csv).not.toContain(',70,')
    // Cardio PBs are the maxima across all workouts.
    expect(csv).toContain('cardio,Longest distance (km),10,,')
    expect(csv).toContain('cardio,Most calories,700,,')
    expect(csv).toContain('cardio,Most minutes,60,,')
  })

  it('omits zero cardio PB rows', () => {
    const d = emptyJournal()
    d.workouts = [{ id: 'w1', date: '2026-06-10', activity: 'Strength', sets: ['Squat 3x3 @ 100'], distanceKm: 0, calories: 0, durationMin: 0, notes: '' }]
    const csv = personalRecordsCsv(d)
    expect(csv).toContain('strength,Squat,100,3')
    expect(csv).not.toContain('cardio')
  })
})

describe('collectionCsv', () => {
  it('header-only when the collection has no entries', () => {
    expect(collectionCsv(emptyJournal(), 'missing')).toBe('date,type,status,important,text,tags')
  })

  it('exports only the chosen collection, sorted by date', () => {
    const d = emptyJournal()
    d.entries = [
      { id: '1', date: '2026-06-12', type: 'task', text: 'later task', status: 'open', important: false, memory: false, tags: ['proj'], collection: 'c1', createdAt: '2026-06-12' },
      { id: '2', date: '2026-06-10', type: 'task', text: 'early task', status: 'open', important: true, memory: false, tags: [], collection: 'c1', createdAt: '2026-06-10' },
      { id: '3', date: '2026-06-11', type: 'note', text: 'other page', status: 'open', important: false, memory: false, tags: [], collection: 'c2', createdAt: '2026-06-11' },
    ]
    const csv = collectionCsv(d, 'c1')
    const lines = csv.split('\n')
    expect(lines).toHaveLength(3) // header + 2 c1 rows
    expect(lines[1]).toBe('2026-06-10,task,open,yes,early task,')
    expect(lines[2]).toContain('later task')
    expect(csv).not.toContain('other page')
  })
})

describe('redactSensitive', () => {
  it('drops recovery + cycle and blanks entry text, without mutating input', () => {
    const d = emptyJournal()
    d.nofap = { startedOn: '2026-06-01', best: 30, relapses: [{ id: 'r', date: '2026-06-05', trigger: 'stress', note: 'private' }] }
    d.cycle = [{ date: '2026-06-03', temp: 36.5, flags: ['period'] }]
    d.entries = [{ id: 'e', date: '2026-06-10', type: 'note', text: 'secret thought', status: 'open', important: false, memory: false, tags: ['secret'], createdAt: '2026-06-10' }]
    const out = redactSensitive(d)
    expect(out.nofap.relapses).toEqual([])
    expect(out.nofap.best).toBe(0)
    expect(out.cycle).toEqual([])
    expect(out.entries[0].text).toBe('')
    expect(out.entries[0].tags).toEqual([])
    // Structure of the entry survives so charts still have shape.
    expect(out.entries[0].type).toBe('note')
    // Input untouched.
    expect(d.nofap.relapses).toHaveLength(1)
    expect(d.entries[0].text).toBe('secret thought')
  })
})

describe('stripSyncSecrets', () => {
  it('removes sync tokens but keeps other settings', () => {
    const d = emptyJournal()
    d.settings.selfHostToken = 'jwt'
    d.settings.selfHostUrl = 'https://x'
    d.settings.githubToken = 'pat'
    d.settings.githubGistId = 'gist'
    d.settings.googleClientId = 'cid'
    d.settings.googleEmail = 'a@b.c'
    d.settings.lastBackup = '2026-06-10'
    const out = stripSyncSecrets(d)
    expect(out.settings.selfHostToken).toBeUndefined()
    expect(out.settings.selfHostUrl).toBeUndefined()
    expect(out.settings.githubToken).toBeUndefined()
    expect(out.settings.githubGistId).toBeUndefined()
    expect(out.settings.googleClientId).toBeUndefined()
    expect(out.settings.googleEmail).toBeUndefined()
    // Non-secret settings survive.
    expect(out.settings.lastBackup).toBe('2026-06-10')
    expect(out.settings.theme).toBe(d.settings.theme)
  })

  it('does not mutate the input', () => {
    const d = emptyJournal()
    d.settings.selfHostToken = 'jwt'
    stripSyncSecrets(d)
    expect(d.settings.selfHostToken).toBe('jwt')
  })
})

describe('daysSinceBackup', () => {
  it('counts whole days between dates', () => {
    expect(daysSinceBackup('2026-06-10', '2026-06-17')).toBe(7)
    expect(daysSinceBackup('2026-06-17', '2026-06-17')).toBe(0)
  })

  it('returns null when no/invalid backup date', () => {
    expect(daysSinceBackup(undefined, '2026-06-17')).toBeNull()
    expect(daysSinceBackup('not-a-date', '2026-06-17')).toBeNull()
  })

  it('never returns negative for a future backup date', () => {
    expect(daysSinceBackup('2026-06-20', '2026-06-17')).toBe(0)
  })
})
