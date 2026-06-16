// Curated no-equipment / bodyweight exercise library for the Home Workout view.
// Each exercise links to a professional YouTube demo via the shared video
// helpers (see `./video`); pin a specific clip by setting `yt`.

import { videoUrl, videoSearchUrl } from './video'

export type Muscle = 'chest' | 'legs' | 'glutes' | 'core' | 'back' | 'shoulders' | 'arms' | 'full body' | 'cardio'

export interface HomeExercise {
  id: string
  name: string
  emoji: string
  muscle: Muscle
  /** One-line form cue. */
  how: string
  /** Sensible default rep/time target shown when adding to a session. */
  reps: string
  /** Optional pinned YouTube video id; when absent we use a search link. */
  yt?: string
}

/** Professional demo link — a pinned clip if set, else a proper-form search. */
export function demoUrl(ex: HomeExercise): string {
  return videoUrl(ex.name, ex.yt)
}

/** Always-available "find more" search link (the fallback the user asked for). */
export function searchUrl(ex: HomeExercise): string {
  return videoSearchUrl(ex.name)
}

export const HOME_EXERCISES: HomeExercise[] = [
  { id: 'pushup', name: 'Push-ups', emoji: '💪', muscle: 'chest', how: 'Hands under shoulders, body in a straight line, lower chest to the floor, elbows ~45°.', reps: '3×12' },
  { id: 'kneepushup', name: 'Knee push-ups', emoji: '🧎', muscle: 'chest', how: 'Easier push-up from the knees; keep hips down and core tight.', reps: '3×12' },
  { id: 'pikepushup', name: 'Pike push-ups', emoji: '🔻', muscle: 'shoulders', how: 'Hips high (inverted V), lower the crown of your head toward the floor.', reps: '3×8' },
  { id: 'squat', name: 'Bodyweight squats', emoji: '🦵', muscle: 'legs', how: 'Feet shoulder-width, sit back and down, knees track over toes, chest up.', reps: '3×15' },
  { id: 'lunge', name: 'Forward lunges', emoji: '🚶', muscle: 'legs', how: 'Step forward, both knees ~90°, push through the front heel to stand.', reps: '3×10/side' },
  { id: 'reverselunge', name: 'Reverse lunges', emoji: '↩️', muscle: 'legs', how: 'Step back into a lunge — gentler on the knees than forward lunges.', reps: '3×10/side' },
  { id: 'wallsit', name: 'Wall sit', emoji: '🧱', muscle: 'legs', how: 'Back flat on a wall, thighs parallel to the floor, hold.', reps: '3×40s' },
  { id: 'calfraise', name: 'Calf raises', emoji: '🦶', muscle: 'legs', how: 'Rise onto the balls of your feet, pause at the top, lower slowly.', reps: '3×20' },
  { id: 'glutebridge', name: 'Glute bridge', emoji: '🍑', muscle: 'glutes', how: 'On your back, drive hips up squeezing glutes, ribs down.', reps: '3×15' },
  { id: 'donkeykick', name: 'Donkey kicks', emoji: '🐴', muscle: 'glutes', how: 'On all fours, kick one heel toward the ceiling, keep the knee bent.', reps: '3×12/side' },
  { id: 'plank', name: 'Plank', emoji: '🪵', muscle: 'core', how: 'Forearms down, body straight, brace the core — no sagging hips.', reps: '3×45s' },
  { id: 'sideplank', name: 'Side plank', emoji: '📐', muscle: 'core', how: 'On one forearm, stack feet, lift hips, hold; switch sides.', reps: '3×30s/side' },
  { id: 'bicycle', name: 'Bicycle crunches', emoji: '🚲', muscle: 'core', how: 'Opposite elbow to knee, extend the other leg, slow and controlled.', reps: '3×20' },
  { id: 'russiantwist', name: 'Russian twists', emoji: '🔄', muscle: 'core', how: 'Seated, lean back, rotate the torso side to side, heels up to progress.', reps: '3×20' },
  { id: 'superman', name: 'Superman', emoji: '🦸', muscle: 'back', how: 'Face down, lift arms and legs together, squeeze the lower back, pause.', reps: '3×12' },
  { id: 'birddog', name: 'Bird dog', emoji: '🐦', muscle: 'back', how: 'On all fours, extend opposite arm and leg, keep hips level.', reps: '3×10/side' },
  { id: 'tricepdip', name: 'Chair tricep dips', emoji: '🪑', muscle: 'arms', how: 'Hands on a chair edge, lower with elbows pointing back, press up.', reps: '3×12' },
  { id: 'jumpingjack', name: 'Jumping jacks', emoji: '⭐', muscle: 'cardio', how: 'Jump feet out while arms go overhead; steady rhythm.', reps: '3×40' },
  { id: 'highknees', name: 'High knees', emoji: '🏃', muscle: 'cardio', how: 'Run in place driving knees to hip height, fast arms.', reps: '3×30s' },
  { id: 'mountainclimber', name: 'Mountain climbers', emoji: '⛰️', muscle: 'cardio', how: 'Plank position, drive knees to chest alternately, hips low.', reps: '3×30s' },
  { id: 'burpee', name: 'Burpees', emoji: '🔥', muscle: 'full body', how: 'Squat, kick back to a plank, (push-up), jump feet in, jump up.', reps: '3×10' },
]
