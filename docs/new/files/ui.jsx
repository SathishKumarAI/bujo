import { useEffect, useRef, useState } from 'react';
import './ui.css';

export function Button({ variant = 'secondary', on = false, icon = false, children, ...rest }) {
  const cls = [
    'btn',
    `btn--${variant}`,
    on ? 'btn--on' : '',
    icon ? 'btn--icon' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button type="button" className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Card({ children, ...rest }) {
  return (
    <div className="card" {...rest}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, meta, action }) {
  return (
    <div className="section-head">
      <h3 className="section-head__title">{title}</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-3)' }}>
        {meta && <span className="section-head__meta num">{meta}</span>}
        {action}
      </div>
    </div>
  );
}

export function Field({ tall = false, ...rest }) {
  return <input className={tall ? 'field field--tall' : 'field'} {...rest} />;
}

export function Rolling({ value, className = '' }) {
  return (
    <span key={String(value)} className={`roll num ${className}`}>
      {value}
    </span>
  );
}

export function SegmentScale({ value, onChange, max = 10, lowLabel, highLabel, label }) {
  const ref = useRef(null);

  function onKeyDown(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      onChange(Math.min(max, value + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      onChange(Math.max(0, value - 1));
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      onChange(Number(e.key));
    } else if (e.key === 'Home') {
      e.preventDefault();
      onChange(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      onChange(max);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--s-3)' }}>
        <span className="label">{label}</span>
        <Rolling value={value} />
      </div>
      <div
        ref={ref}
        className="seg"
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        onKeyDown={onKeyDown}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            tabIndex={-1}
            className="seg__cell"
            data-on={n <= value}
            data-peak={n === value}
            aria-label={`${label} ${n}`}
            onClick={() => onChange(n === value ? n - 1 : n)}
          />
        ))}
      </div>
      <div className="seg__ends">
        <span className="caption">{lowLabel}</span>
        <span className="caption">{highLabel}</span>
      </div>
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99, suffix, label }) {
  return (
    <div className="stepper" role="group" aria-label={label}>
      <Button variant="ghost" icon aria-label={`Decrease ${label}`} onClick={() => onChange(Math.max(min, value - 1))}>
        −
      </Button>
      <span className="stepper__val">
        <Rolling value={value} />
        {suffix && <span className="text-3 num"> {suffix}</span>}
      </span>
      <Button variant="ghost" icon aria-label={`Increase ${label}`} onClick={() => onChange(Math.min(max, value + 1))}>
        +
      </Button>
    </div>
  );
}

const CYCLE = ['task', 'done', 'migrated', 'scheduled'];
const GLYPH = { task: '•', done: '×', migrated: '>', scheduled: '<', note: '—', event: '○' };
const GLYPH_LABEL = {
  task: 'Task',
  done: 'Done',
  migrated: 'Migrated',
  scheduled: 'Scheduled',
  note: 'Note',
  event: 'Event',
};

export function LogEntry({ state = 'task', text, priority = false, tags = [], onStateChange }) {
  function cycle() {
    if (!CYCLE.includes(state)) return;
    const next = CYCLE[(CYCLE.indexOf(state) + 1) % CYCLE.length];
    onStateChange?.(next);
  }

  return (
    <div className="entry" data-done={state === 'done'}>
      <button
        type="button"
        className="glyph"
        onClick={cycle}
        aria-label={`${GLYPH_LABEL[state]} — change state`}
        style={{ color: state === 'done' ? 'var(--success)' : undefined }}
      >
        <span key={state} className="roll">
          {GLYPH[state]}
        </span>
      </button>
      {priority && <span className="entry__bang" aria-label="Priority">!</span>}
      <span className="entry__text">
        {text}{' '}
        {tags.map((t) => (
          <span key={t} className="tag">
            #{t}
          </span>
        ))}
      </span>
    </div>
  );
}

export function FastRing({ elapsedSeconds, windowHours = 16, size = 120 }) {
  const total = windowHours * 3600;
  const pct = Math.min(1, elapsedSeconds / total);
  const r = size / 2 - 2;
  const c = 2 * Math.PI * r;
  const [tick, setTick] = useState(false);
  const hour = Math.floor(elapsedSeconds / 3600);
  const prevHour = useRef(hour);

  useEffect(() => {
    if (hour !== prevHour.current) {
      prevHour.current = hour;
      setTick(true);
      const t = setTimeout(() => setTick(false), 620);
      return () => clearTimeout(t);
    }
  }, [hour]);

  const h = String(hour).padStart(2, '0');
  const m = String(Math.floor((elapsedSeconds % 3600) / 60)).padStart(2, '0');
  const s = String(Math.floor(elapsedSeconds % 60)).padStart(2, '0');

  return (
    <div
      className={tick ? 'ring--tick' : ''}
      style={{ position: 'relative', width: size, height: size }}
      role="img"
      aria-label={`${h} hours ${m} minutes into a ${windowHours} hour fast`}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }} aria-hidden="true">
        <circle className="ring__track" cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth="2" />
        <circle
          className="ring__fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeContent: 'center',
          textAlign: 'center',
        }}
      >
        <span className="num" style={{ fontSize: '20px' }}>
          {h}:{m}:{s}
        </span>
        <span className="caption">of {windowHours}h</span>
      </div>
    </div>
  );
}
