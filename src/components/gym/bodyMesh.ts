import * as THREE from 'three'
import { M } from '../../lib/exerciseMuscles'
import type { Pose } from '../../lib/movement'

/**
 * A RIGGED BODY, BUILT FROM PRIMITIVES · no model file, no licence, no megabytes.
 *
 * The obvious way to do 3D anatomy is to ship a muscle-separated GLB. The good
 * ones (BodyParts3D, Z-Anatomy) are **5–30MB**, share-alike licensed, and this
 * is a PWA whose service worker precaches everything so it works in a tunnel —
 * a 30MB model is a 30MB install for every user, most of whom never open this
 * card. Procedural costs a few KB of source, carries no licence, and lets each
 * mesh be tagged with the exact wger muscle id the rest of the app already
 * speaks (`lib/muscles.ts`, `exerciseMuscles.ts`).
 *
 * **It is a hierarchy, not a pile of capsules.** The first version placed every
 * muscle in world space, which is fine for a static highlight and useless the
 * moment the body has to move: an arm that bends needs the forearm parented to
 * the upper arm, and the biceps parented to the segment it sits on. So:
 *
 * ```
 * root ── hips ── spine ── chest ── shoulder(L/R) ── upperArm ── elbow ── forearm
 *           └──── thigh(L/R) ──── knee ──── shin
 * ```
 *
 * `applyPose` writes joint rotations only. Muscles never move themselves; they
 * ride the segment, which is what makes the animation read as a body rather
 * than as parts sliding around.
 *
 * The honest trade, worth stating where someone will read it: **this is a
 * stylised mannequin, not an anatomical reference.** It shows where the work
 * is and roughly how much. `MuscleMap`'s wger art is the reference, and it is
 * still on the page beside this.
 */

export interface MusclePart {
  /** wger id, so highlighting uses the same numbers as everything else. */
  id: number
  mesh: THREE.Mesh
}

export interface Rig {
  group: THREE.Group
  parts: MusclePart[]
  joints: {
    spine: THREE.Object3D
    shoulder: THREE.Object3D[]
    elbow: THREE.Object3D[]
    hip: THREE.Object3D[]
    knee: THREE.Object3D[]
  }
}

const cap = (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 4, 12)

export function buildBody(base: THREE.Material): Rig {
  const group = new THREE.Group()
  const parts: MusclePart[] = []
  const inert = new THREE.MeshStandardMaterial({ color: 0x3b3b49, roughness: 0.9, metalness: 0 })

  /** A muscle mesh, parented to a segment and tagged with its id. */
  const muscle = (id: number, geo: THREE.BufferGeometry, parent: THREE.Object3D, pos: [number, number, number], rot: [number, number, number] = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geo, base.clone())
    mesh.position.set(...pos)
    mesh.rotation.set(...rot)
    mesh.userData.muscleId = id
    parent.add(mesh)
    parts.push({ id, mesh })
    return mesh
  }
  const bone = (parent: THREE.Object3D, pos: [number, number, number]) => {
    const o = new THREE.Object3D()
    o.position.set(...pos)
    parent.add(o)
    return o
  }
  const plain = (geo: THREE.BufferGeometry, parent: THREE.Object3D, pos: [number, number, number]) => {
    const m = new THREE.Mesh(geo, inert)
    m.position.set(...pos)
    parent.add(m)
    return m
  }

  // ── Spine chain ──────────────────────────────────────────────────────────
  const hips = bone(group, [0, 0.95, 0])
  const spine = bone(hips, [0, 0, 0])
  const chest = bone(spine, [0, 0.28, 0])

  plain(cap(0.075, 0.10), hips, [0, 0.03, 0])
  plain(cap(0.045, 0.07), chest, [0, 0.20, 0])
  plain(new THREE.SphereGeometry(0.105, 20, 16), chest, [0, 0.33, 0])

  muscle(M.chest, cap(0.085, 0.10), chest, [0.075, 0.05, 0.075], [0, 0, 0.1])
  muscle(M.chest, cap(0.085, 0.10), chest, [-0.075, 0.05, 0.075], [0, 0, -0.1])
  muscle(M.traps, cap(0.058, 0.16), chest, [0.062, 0.12, -0.055], [0.25, 0, 0.12])
  muscle(M.traps, cap(0.058, 0.16), chest, [-0.062, 0.12, -0.055], [0.25, 0, -0.12])
  muscle(M.lats, cap(0.062, 0.20), chest, [0.105, -0.04, -0.055], [0, 0, 0.16])
  muscle(M.lats, cap(0.062, 0.20), chest, [-0.105, -0.04, -0.055], [0, 0, -0.16])
  muscle(M.serratus, cap(0.032, 0.09), chest, [0.125, -0.02, 0.045], [0, 0, 0.25])
  muscle(M.serratus, cap(0.032, 0.09), chest, [-0.125, -0.02, 0.045], [0, 0, -0.25])
  muscle(M.abs, cap(0.055, 0.16), spine, [0.038, 0.16, 0.085])
  muscle(M.abs, cap(0.055, 0.16), spine, [-0.038, 0.16, 0.085])
  muscle(M.obliques, cap(0.038, 0.17), spine, [0.105, 0.16, 0.035], [0, 0, 0.06])
  muscle(M.obliques, cap(0.038, 0.17), spine, [-0.105, 0.16, 0.035], [0, 0, -0.06])

  // ── Arms ─────────────────────────────────────────────────────────────────
  const shoulder: THREE.Object3D[] = []
  const elbow: THREE.Object3D[] = []
  for (const s of [1, -1]) {
    const sh = bone(chest, [0.185 * s, 0.155, 0])
    muscle(M.shoulders, new THREE.SphereGeometry(0.072, 16, 14), sh, [0.012 * s, 0.01, 0])
    // Upper arm hangs DOWN from the shoulder: -y, so a positive `shoulder`
    // angle swings it forward the way an arm does.
    muscle(M.biceps, cap(0.046, 0.15), sh, [0.008 * s, -0.12, 0.028])
    muscle(M.triceps, cap(0.048, 0.16), sh, [0.008 * s, -0.12, -0.034])
    muscle(M.brachialis, cap(0.030, 0.08), sh, [0.014 * s, -0.20, 0.03])
    const el = bone(sh, [0.01 * s, -0.235, 0])
    plain(cap(0.042, 0.22), el, [0, -0.12, 0])
    plain(new THREE.SphereGeometry(0.038, 12, 10), el, [0, -0.25, 0])
    shoulder.push(sh)
    elbow.push(el)
  }

  // ── Legs ─────────────────────────────────────────────────────────────────
  const hip: THREE.Object3D[] = []
  const knee: THREE.Object3D[] = []
  for (const s of [1, -1]) {
    const hp = bone(hips, [0.085 * s, -0.04, 0])
    muscle(M.glutes, new THREE.SphereGeometry(0.088, 16, 14), hp, [0, 0.02, -0.055])
    muscle(M.quads, cap(0.070, 0.24), hp, [0.006 * s, -0.19, 0.028])
    muscle(M.hamstrings, cap(0.062, 0.23), hp, [0.006 * s, -0.19, -0.042])
    // Knee at -0.38, not -0.40: the thigh capsule's lower cap ends at -0.38
    // and the shin's upper cap started at -0.44, so the first pass rendered a
    // visible 60mm gap of nothing between thigh and calf on both legs. Joints
    // are where the segments MEET, and a capsule's half-length has to be in
    // the arithmetic or the body comes apart at the knees.
    const kn = bone(hp, [0, -0.38, 0])
    muscle(M.calves, cap(0.052, 0.16), kn, [0, -0.14, -0.033])
    muscle(M.soleus, cap(0.038, 0.12), kn, [0, -0.23, -0.018])
    plain(new THREE.BoxGeometry(0.09, 0.05, 0.2), kn, [0, -0.38, 0.045])
    hip.push(hp)
    knee.push(kn)
  }

  return { group, parts, joints: { spine, shoulder, elbow, hip, knee } }
}

/**
 * Write a pose onto the rig.
 *
 * Mirrored where the body is: the left arm's abduction is the right arm's,
 * negated, so one set of angles drives both sides. Nothing here touches
 * muscles — they are children of the segments and come along for free, which
 * is the entire reason the hierarchy exists.
 */
export function applyPose(rig: Rig, p: Pose) {
  rig.joints.spine.rotation.x = p.spine
  rig.joints.shoulder.forEach((o, i) => {
    const s = i === 0 ? 1 : -1
    o.rotation.x = p.shoulder
    o.rotation.z = -p.shoulderOut * s
  })
  rig.joints.elbow.forEach((o) => { o.rotation.x = p.elbow })
  rig.joints.hip.forEach((o) => { o.rotation.x = -p.hip })
  rig.joints.knee.forEach((o) => { o.rotation.x = p.knee })
}

/**
 * Which side of the body a muscle is on — for choosing the opening camera yaw.
 *
 * Framing a triceps exercise from the front shows you the front of a body with
 * nothing lit on it. The muscle is on the back; start there.
 */
const BACK: readonly number[] = [M.lats, M.traps, M.triceps, M.glutes, M.hamstrings, M.calves, M.soleus]
export function isBackMuscle(id: number): boolean {
  return BACK.includes(id)
}

/**
 * FRAME WHAT IS WORKING · the camera shot, computed from the rep itself.
 *
 * A curl and a squat were both drawn at whole-body zoom, so the thing the card
 * exists to show — one lit muscle — was a few dozen pixels in the middle of a
 * mannequin. The obvious fix is a lookup of "arms → this distance", and it is
 * the wrong one: it cannot know that an overhead press puts the hands a foot
 * above the head, that a hanging leg raise starts from full extension, or that
 * a squat drops the hips half a metre. Those are properties of the *pose over
 * time*, not of the muscle.
 *
 * So this measures instead of guessing: step through the rep, union the world
 * bounding box of the muscles actually working at each sample, and frame that.
 * Every pattern is handled without naming any of them, including ones added
 * later.
 *
 * The torso is always included at a low weight. A box drawn tightly around two
 * triceps is a close-up of two capsules with no body around them — you cannot
 * tell what you are looking at, which defeats the point of showing it on a
 * figure at all.
 */
export function frameRep(
  rig: Rig,
  active: number[],
  poseAt: (t: number) => Pose,
  samples = 12,
): { centre: THREE.Vector3; radius: number; yaw: number } {
  const box = new THREE.Box3()
  const wanted = new Set(active)
  const subject = rig.parts.filter((p) => wanted.has(p.id))
  // Nothing recognised — frame the whole figure rather than an empty box.
  const meshes = subject.length ? subject.map((p) => p.mesh) : rig.parts.map((p) => p.mesh)

  const tmp = new THREE.Box3()
  for (let i = 0; i <= samples; i++) {
    applyPose(rig, poseAt(i / samples))
    rig.group.updateMatrixWorld(true)
    for (const m of meshes) box.union(tmp.setFromObject(m))
  }

  // Context: the torso, so a close-up still reads as a body. Half-weighted by
  // shrinking it toward its own centre before the union.
  if (subject.length) {
    rig.group.updateMatrixWorld(true)
    const torso = new THREE.Box3().setFromObject(rig.joints.spine)
    const c = torso.getCenter(new THREE.Vector3())
    torso.min.lerp(c, 0.45)
    torso.max.lerp(c, 0.45)
    box.union(torso)
  }

  const centre = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  // Radius of a sphere that contains the box, which is what the camera has to
  // fit regardless of which way the figure is turned — framing on height alone
  // clips a wide shot the moment you drag it round to the side.
  const radius = Math.max(0.22, 0.5 * Math.hypot(size.x, size.y, size.z))

  const primaries = active.filter(isBackMuscle).length
  const yaw = subject.length && primaries > active.length / 2 ? Math.PI : 0
  return { centre, radius, yaw }
}
