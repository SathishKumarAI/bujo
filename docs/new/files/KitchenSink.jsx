import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Field,
  FastRing,
  LogEntry,
  SectionHeader,
  SegmentScale,
  Stepper,
} from './ui';

export default function KitchenSink() {
  const [mood, setMood] = useState(7);
  const [energy, setEnergy] = useState(4);
  const [hours, setHours] = useState(16);
  const [meal, setMeal] = useState('food');
  const [elapsed, setElapsed] = useState(3 * 3600 + 1420);
  const [entries, setEntries] = useState([
    { id: 1, state: 'done', text: 'Back up photos', priority: true, tags: [] },
    { id: 2, state: 'task', text: 'Plan weekend hike', priority: true, tags: [] },
    { id: 3, state: 'note', text: 'Walk the rim', priority: false, tags: ['travel'] },
    { id: 4, state: 'scheduled', text: 'Call mom', priority: false, tags: [] },
  ]);

  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  function setState(id, state) {
    setEntries((es) => es.map((e) => (e.id === id ? { ...e, state } : e)));
  }

  return (
    <div className="col rise">
      <h1>Kitchen sink</h1>
      <p className="text-2" style={{ marginTop: 'var(--s-2)' }}>
        Every primitive and state in one place. If something looks wrong here, it looks wrong everywhere.
      </p>

      <hr className="rule" />

      <SectionHeader title="Buttons" meta="1 primary per screen" />
      <div style={{ display: 'flex', gap: 'var(--s-2)', flexWrap: 'wrap' }}>
        <Button variant="primary">Quick add</Button>
        <Button variant="secondary">Start fast</Button>
        <Button variant="ghost">Skip</Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
        <Button variant="ghost" icon aria-label="More options">
          ⋯
        </Button>
      </div>

      <hr className="rule" />

      <SectionHeader title="Scales" meta={`mood ${mood} · energy ${energy}`} />
      <div style={{ display: 'grid', gap: 'var(--s-6)' }}>
        <SegmentScale
          label="Mood"
          value={mood}
          onChange={setMood}
          lowLabel="Low"
          highLabel="High"
        />
        <SegmentScale
          label="Energy"
          value={energy}
          onChange={setEnergy}
          lowLabel="Drained"
          highLabel="Energized"
        />
      </div>

      <hr className="rule" />

      <SectionHeader title="First meal" />
      <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
        <Button variant="secondary" on={meal === 'food'} onClick={() => setMeal('food')}>
          Food
        </Button>
        <Button variant="secondary" on={meal === 'drink'} onClick={() => setMeal('drink')}>
          Drink
        </Button>
      </div>

      <hr className="rule" />

      <SectionHeader title="Fasting" action={<Stepper label="Window" value={hours} onChange={setHours} min={12} max={24} suffix="h" />} />
      <Card style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-6)' }}>
        <FastRing elapsedSeconds={elapsed} windowHours={hours} />
        <div style={{ display: 'grid', gap: 'var(--s-3)' }}>
          <p className="text-2" style={{ fontSize: 'var(--fs-label)' }}>
            Started at 8:14 pm. Ends when you log your first meal.
          </p>
          <div>
            <Button variant="secondary">End fast</Button>
          </div>
        </div>
      </Card>

      <hr className="rule" />

      <SectionHeader title="Rapid log" meta={`${entries.length} entries`} />
      <Card>
        <div style={{ display: 'flex', gap: 'var(--s-2)', marginBottom: 'var(--s-4)' }}>
          <Field tall placeholder="bench 80×5, ran 5k 28min, mood 7, water 6, t call mom" />
          <Button variant="primary">Add</Button>
        </div>
        {entries.map((e) => (
          <LogEntry
            key={e.id}
            state={e.state}
            text={e.text}
            priority={e.priority}
            tags={e.tags}
            onStateChange={(s) => setState(e.id, s)}
          />
        ))}
        <p className="caption" style={{ marginTop: 'var(--s-3)' }}>
          Click a glyph to cycle task → done → migrated → scheduled.
        </p>
      </Card>

      <hr className="rule" />

      <SectionHeader title="Type scale" />
      <div style={{ display: 'grid', gap: 'var(--s-3)' }}>
        <h1>Display 32 — Fraunces</h1>
        <h2>Title 22 — Fraunces</h2>
        <h3>Heading 18 — Fraunces</h3>
        <p>Body 15 — Instrument Sans, the workhorse for everything that isn't a title.</p>
        <p className="label">Label 13 — medium weight, secondary color</p>
        <p className="caption">Caption 11 — muted, for endpoints and hints</p>
        <p className="num" style={{ fontSize: '22px' }}>
          0123456789 — tabular, never shifts width
        </p>
      </div>
    </div>
  );
}
