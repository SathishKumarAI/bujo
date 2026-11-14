import { useState } from 'react'
import { Cell, Cells } from '../ui/cells'
import { Sheet } from '../ui/sheet'
import { plain } from '../../lib/plain'
import { ACADEMY_DRILLS, DRILL_FIXES, TECHNIQUES } from '../../lib/pickleballAcademy'
import { drillQuery } from '../../lib/video'
import { VideoLink } from '../VideoLink'
import { PracticeTick } from './PracticeTick'

/**
 * THE SHOT GUIDE AND THE DRILL LIBRARY ON A PHONE: one row per shot, one row
 * per skill, each opening a `Sheet`.
 *
 * OWNS: the phone drawing of the `shots` and `drills` chapters. DOES NOT OWN:
 * the content (`lib/pickleballAcademy.ts`) or the desktop drawing, which is
 * hover-reveal / click-to-pin folds in `views/Coaching.tsx`'s `Manual`.
 *
 * Owner, 2026-11-13: nothing opens in place on a phone. Measured before: 14
 * shot folds and 8 drill-group folds (COD-590).
 */
export function ShotsPhone() {
  const [open, setOpen] = useState<string | null>(null)
  const shot = TECHNIQUES.find((t) => t.name === open)
  return (
    <div className="flex flex-col gap-3">
      {[...new Set(TECHNIQUES.map((t) => t.group))].map((group) => (
        <Cells key={group} title={group}>
          {TECHNIQUES.filter((t) => t.group === group).map((t) => (
            <Cell key={t.name} title={t.name} subtitle={plain(t.what)} opensSheet onPress={() => setOpen(t.name)} />
          ))}
        </Cells>
      ))}
      <Sheet open={!!shot} onOpenChange={(v) => { if (!v) setOpen(null) }} title={shot?.name ?? ''} description={shot ? plain(shot.what) : undefined}>
        {shot && (
          <div className="flex flex-col gap-3">
            <div className="flex justify-end"><PracticeTick kind="shot" name={shot.name} /></div>
            <Lines title="When to hit it" items={shot.when} />
            <Lines title="How to do it" items={shot.how.map((s, i) => `${i + 1}. ${s}`)} />
            <Lines title="Key cues" items={shot.cues} />
            <Lines title="Common mistakes" items={shot.mistakes} />
          </div>
        )}
      </Sheet>
    </div>
  )
}

export function DrillsPhone() {
  const [open, setOpen] = useState<string | null>(null)
  const skills = [...new Set(ACADEMY_DRILLS.map((d) => d.skill))]
  const list = ACADEMY_DRILLS.filter((d) => d.skill === open)
  return (
    <>
      <Cells>
        {skills.map((skill) => {
          const n = ACADEMY_DRILLS.filter((d) => d.skill === skill).length
          return (
            <Cell key={skill} title={skill} subtitle={DRILL_FIXES[skill] && plain(DRILL_FIXES[skill])}
              trail={`${n} drill${n === 1 ? '' : 's'}`} opensSheet onPress={() => setOpen(skill)} />
          )
        })}
      </Cells>
      <Sheet open={!!open} onOpenChange={(v) => { if (!v) setOpen(null) }} title={`${open ?? ''} drills`} description={open && DRILL_FIXES[open] ? plain(DRILL_FIXES[open]) : undefined}>
        <div className="cells">
          {list.map((d) => (
            <div key={d.name} className="cell items-start gap-2">
              <span className="min-w-0 flex-1">
                <span className="block text-body font-medium text-fg-1">{d.name}</span>
                <span className="block text-label text-fg-2">{plain(d.how)}</span>
              </span>
              <VideoLink name={d.name} query={drillQuery(d.name)} label="" size="sm" quiet className="min-h-11 min-w-11 justify-center" />
              <PracticeTick kind="drill" name={d.name} />
            </div>
          ))}
        </div>
      </Sheet>
    </>
  )
}

function Lines({ title, items }: { title: string; items: string[] }) {
  return (
    <section>
      <h3 className="mb-1 text-label font-semibold text-fg-1">{title}</h3>
      <ul className="cells">
        {items.map((x) => <li key={x} className="cell text-body text-fg-1">{plain(x)}</li>)}
      </ul>
    </section>
  )
}
