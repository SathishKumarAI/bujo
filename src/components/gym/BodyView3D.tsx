import { useEffect, useRef, useState } from 'react'
import { Card, Empty } from '../ui'
import { Button } from '../ui/button'
import { cat } from '../../lib/colors'
import { muscleNames } from '../../lib/muscles'
import { muscleWorkFor } from '../../lib/exerciseMuscles'
import { activationAt, movementFor, REST } from '../../lib/movement'

/**
 * MUSCLE VIEW · which muscles a lift works, on a body that performs the rep.
 *
 * The app could not answer "I picked Tricep Extension, show me the triceps" at
 * all: `Gym` highlighted the whole *split*, and `ExerciseDB`'s per-exercise
 * muscles came from a **network** call, so offline and for the entire built-in
 * library there was no data. `lib/exerciseMuscles.ts` is that data,
 * `lib/movement.ts` is the rep shape, and this is the picture.
 *
 * **The time axis is the point.** A still highlight says the triceps are
 * involved in a bench press; it cannot say they are nearly idle off the chest
 * and are what fails you at lockout. Colour here is driven by
 * `activationAt(name, t)` every frame, so a muscle brightens exactly when it
 * is doing the work — and the scrubber lets you stop anywhere in the rep and
 * read it.
 *
 * **three.js is imported dynamically and nothing else pulls it in.** ~160KB
 * gzipped is a lot to add to a journal's first paint for a card most sessions
 * never open, so the chunk loads on mount. The muscle list below renders
 * regardless — it is the answer; the body is how you find it on yourself.
 *
 * **Reduced motion changes behaviour, not speed.** Autoplay is off entirely
 * under `prefers-reduced-motion`; the scrubber and drag still work, because a
 * motion you ask for is not what that rule is about.
 */
export function BodyView3D({ exercise }: { exercise: string }) {
  const host = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)
  const [ready, setReady] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [zoom, setZoom] = useState<'work' | 'body'>('work')
  /** Phase of the rep, 0–1. Mirrored out of the render loop for the scrubber. */
  const [phase, setPhase] = useState(0)
  const api = useRef<{
    setView: (v: 'front' | 'back') => void
    setZoom: (z: 'work' | 'body') => void
    setPhase: (t: number) => void
    setPlaying: (p: boolean) => void
    dispose: () => void
  } | null>(null)

  const work = muscleWorkFor(exercise)
  const move = movementFor(exercise)
  const live = activationAt(exercise, phase)

  useEffect(() => {
    if (!work || !host.current) return
    let cancelled = false
    const el = host.current

    void (async () => {
      let THREE: typeof import('three')
      try {
        THREE = await import('three')
      } catch {
        if (!cancelled) setFailed(true)
        return
      }
      if (cancelled) return
      const { buildBody, applyPose, frameRep } = await import('./bodyMesh')
      if (cancelled) return

      let renderer: import('three').WebGLRenderer
      try {
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      } catch {
        // WebGL can be absent or blocked — old device, hardened browser.
        if (!cancelled) setFailed(true)
        return
      }

      // A person is portrait-shaped. The first version sized the canvas to the
      // full card width, which on a wide card was 1,640 device pixels of frame
      // around a figure — correctly rendered and unreadable, because a 2.3:1
      // viewport of a 1.8m body is mostly empty floor and ceiling.
      const W = Math.min(el.clientWidth || 280, 340)
      const H = 360
      renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
      renderer.setSize(W, H)
      el.appendChild(renderer.domElement)

      const scene = new THREE.Scene()
      const FOV = 30
      const camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 100)
      // Positioned below, once the rig exists — the shot depends on what the
      // rep does, which cannot be known before the rig is built.

      scene.add(new THREE.AmbientLight(0xffffff, 0.8))
      const key = new THREE.DirectionalLight(0xffffff, 1.05)
      key.position.set(2, 4, 3)
      scene.add(key)
      const rim = new THREE.DirectionalLight(0xffffff, 0.35)
      rim.position.set(-3, 2, -3)
      scene.add(rim)

      // Theme tokens, not hardcoded greys — a fixed palette would be wrong in
      // all five themes at once.
      const rest = new THREE.Color(cat('surface1'))
      const hot = new THREE.Color(cat('red'))
      const base = new THREE.MeshStandardMaterial({ color: rest, roughness: 0.85, metalness: 0.05 })

      const rig = buildBody(base)
      scene.add(rig.group)

      /**
       * Frame the muscles that are working, across the whole rep.
       *
       * A curl and a squat were both shot at whole-body zoom, so the one lit
       * muscle — the entire point of the card — was a few dozen pixels in the
       * middle of a mannequin. `frameRep` walks the rep and measures, so an
       * overhead press gets the headroom its hands need and a calf raise does
       * not pay for headroom it will never use.
       *
       * Fit on the bounding SPHERE, not the height: the body turns, and a
       * shot framed on height alone clips the moment you drag it side-on.
       * Horizontal fit is the tighter constraint on a narrow canvas, so both
       * are computed and the larger distance wins.
       */
      const shot = frameRep(rig, [...work.primary, ...work.secondary], (t) => (move ? move.pose(t) : REST))
      const vFov = (FOV * Math.PI) / 180
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (W / H))
      const fit = (fov: number) => shot.radius / Math.sin(fov / 2)
      // 1.12 leaves a little air rather than cropping to the skin.
      let dist = Math.max(fit(vFov), fit(hFov)) * 1.12
      let target = shot.centre.clone()
      const wholeBody = new THREE.Vector3(0, 0.92, 0)
      const wholeDist = 3.5
      // The camera stays on +Z and the BODY turns (`rig.group.rotation.y`), so
      // framing only has to solve for height and distance.
      const place = () => {
        camera.position.set(0, target.y, dist)
        camera.lookAt(target)
      }
      place()

      let yaw = shot.yaw
      let dragging = false
      let lastX = 0
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      let auto = !reduce
      let play = !reduce
      let t = 0
      if (reduce) setPlaying(false)

      const down = (e: PointerEvent) => { dragging = true; auto = false; lastX = e.clientX; el.setPointerCapture?.(e.pointerId) }
      const move2 = (e: PointerEvent) => { if (dragging) { yaw += (e.clientX - lastX) * 0.01; lastX = e.clientX } }
      const up = () => { dragging = false }
      const canvas = renderer.domElement
      // The page must still scroll under a thumb; the wheel is deliberately
      // unbound so a laptop scrolls past the card too.
      canvas.style.touchAction = 'pan-y'
      canvas.addEventListener('pointerdown', down)
      window.addEventListener('pointermove', move2)
      window.addEventListener('pointerup', up)

      const colorFor = (a: number) => rest.clone().lerp(hot, a)

      let raf = 0
      let last = performance.now()
      let sinceReport = 0
      const tick = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000)
        last = now
        if (play) t = (t + dt / 2.4) % 1 // ~2.4s per rep
        if (auto) yaw += 0.003
        rig.group.rotation.y = yaw

        applyPose(rig, move ? move.pose(t) : REST)

        const act = activationAt(exercise, t)
        for (const p of rig.parts) {
          const mat = p.mesh.material as import('three').MeshStandardMaterial
          const a = act[p.id] ?? 0
          mat.color.copy(colorFor(a))
          // Emissive is what makes a working muscle read as *lit* rather than
          // just tinted, which matters on the dark themes.
          mat.emissive.copy(hot).multiplyScalar(a * 0.35)
        }

        renderer.render(scene, camera)
        // The scrubber is React state; updating it every frame would re-render
        // the whole card 60×/s. Ten times a second is smooth enough to read.
        sinceReport += dt
        if (sinceReport > 0.1) { sinceReport = 0; setPhase(t) }
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      if (!cancelled) setReady(true)

      api.current = {
        setView: (v) => { auto = false; yaw = v === 'front' ? 0 : Math.PI },
        setZoom: (z) => {
          // "Whole body" is an escape hatch, not a default: the close shot is
          // right for the question the card answers, and occasionally you want
          // to see where it sits on the person.
          if (z === 'body') { target = wholeBody.clone(); dist = wholeDist }
          else { target = shot.centre.clone(); dist = Math.max(fit(vFov), fit(hFov)) * 1.12 }
          place()
        },
        setPhase: (v) => { t = v; play = false },
        setPlaying: (p) => { play = p },
        dispose: () => {
          cancelAnimationFrame(raf)
          canvas.removeEventListener('pointerdown', down)
          window.removeEventListener('pointermove', move2)
          window.removeEventListener('pointerup', up)
          // Geometries and materials are not collected with the scene graph. A
          // card that rebuilds on every exercise change would otherwise leak a
          // whole body per pick.
          scene.traverse((o) => {
            const m = o as import('three').Mesh
            m.geometry?.dispose?.()
            const mm = m.material as import('three').Material | import('three').Material[] | undefined
            if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
            else mm?.dispose?.()
          })
          renderer.dispose()
          canvas.remove()
        },
      }
    })()

    return () => {
      cancelled = true
      api.current?.dispose()
      api.current = null
    }
    // Rebuilt per exercise: the rig is ~30 meshes, cheaper to rebuild than to diff.
  }, [exercise, work, move])

  if (!exercise.trim()) {
    return (
      <Card band title="Muscles worked" subtitle="Pick an exercise to see it on the body">
        <Empty>Type or pick an exercise in the logger and it lights up here.</Empty>
      </Card>
    )
  }

  if (!work) {
    return (
      <Card band title="Muscles worked" subtitle={exercise}>
        {/* Says it does not know, rather than drawing a grey body — which
            would read as "this exercise works nothing". */}
        <Empty>No muscle map for “{exercise}” yet. Name it closer to a standard lift, or add a rule in `lib/exerciseMuscles.ts`.</Empty>
      </Card>
    )
  }

  const pct = Math.round(phase * 100)
  const stage = phase < 0.5 ? 'lowering' : 'lifting'

  return (
    <Card
      band
      title="Muscles worked"
      subtitle={move ? `${exercise} · ${move.label}` : exercise}
      right={
        <div className="flex flex-wrap justify-end gap-1">
          <Button variant="secondary" size="sm" onClick={() => api.current?.setView('front')}>Front</Button>
          <Button variant="secondary" size="sm" onClick={() => api.current?.setView('back')}>Back</Button>
          {/* The close shot is the default because it answers the card's
              question; this is for seeing where it sits on the person. */}
          <Button variant="secondary" size="sm" onClick={() => { const next = zoom === 'work' ? 'body' : 'work'; setZoom(next); api.current?.setZoom(next) }}>
            {zoom === 'work' ? 'Whole body' : 'Close up'}
          </Button>
        </div>
      }
    >
      {!failed && (
        <div
          ref={host}
          className="mx-auto flex w-full cursor-grab touch-pan-y justify-center select-none active:cursor-grabbing"
          style={{ height: 360 }}
          role="img"
          aria-label={`Three-dimensional body performing ${exercise}. Muscles worked: ${muscleNames(work.primary).join(', ')} primarily${work.secondary.length ? `, ${muscleNames(work.secondary).join(', ')} assisting` : ''}.`}
        />
      )}
      {!ready && !failed && <p className="py-6 text-center text-label text-fg-2">Loading the 3D view…</p>}

      {move && !failed && (
        <div className="mt-2">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => { const next = !playing; setPlaying(next); api.current?.setPlaying(next) }}
            >
              {playing ? 'Pause' : 'Play'}
            </Button>
            <input
              type="range"
              min={0}
              max={100}
              value={pct}
              aria-label="Scrub through the rep"
              onChange={(e) => {
                const v = Number(e.target.value) / 100
                setPhase(v); setPlaying(false); api.current?.setPhase(v)
              }}
              className="min-w-0 flex-1 accent-mauve"
              style={{ accentColor: cat('mauve') }}
            />
            <span className="w-16 shrink-0 text-right text-label tabular-nums text-fg-2">{stage}</span>
          </div>
          <p className="mt-1.5 text-label text-fg-2">{move.cue}</p>
        </div>
      )}

      {/* Live effort. This is the part a static diagram cannot do: the bar
          moves with the rep, so "the triceps take over at lockout" is
          something you watch rather than something you are told. */}
      <ul className="mt-3 space-y-1.5">
        {[...work.primary, ...work.secondary].map((id) => {
          const a = live[id] ?? 0
          const isPrimary = work.primary.includes(id)
          return (
            <li key={id} className="flex items-center gap-2 text-body">
              <span className={isPrimary ? 'text-fg-1' : 'text-fg-2'} style={{ minWidth: '7rem' }}>{muscleNames([id])[0]}</span>
              <span className="h-2 min-w-0 flex-1 overflow-hidden rounded-pill bg-ink-2">
                <span
                  className="block h-full rounded-pill transition-[width] duration-100"
                  style={{ width: `${Math.round(a * 100)}%`, background: cat(isPrimary ? 'red' : 'peach') }}
                />
              </span>
              <span className="w-10 shrink-0 text-right text-label tabular-nums text-fg-2">{Math.round(a * 100)}%</span>
            </li>
          )
        })}
      </ul>

      {failed && <p className="mt-2 text-label text-fg-2">This browser has no WebGL, so the 3D body is off — the list above is the same information.</p>}
      <p className="mt-2 text-label text-fg-3">Drag to turn. A stylised figure for finding the work on your own body, not an anatomical reference.</p>
    </Card>
  )
}
