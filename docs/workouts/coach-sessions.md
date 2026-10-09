# Coach sessions — the WhatsApp program

**Source:** a WhatsApp thread, 2024-02-24, from a coach. Pasted into this repo
on 2026-10-09 so it stops living in a chat export. **29 sessions.**

Nothing here has been entered into the app yet. This file is the *record*;
COD-302 is the work of turning it into `PULLUP_WORKOUTS`-style data under
`src/lib/`.

---

## Read this before encoding any of it

### The `a x b` notation is ambiguous, and resolving it wrongly builds a wrong program

The thread uses one separator for two different meanings:

| Written | Almost certainly means | Why |
|---|---|---|
| `Squat jumps 15x3` | **15 reps × 3 sets** | 15 sets of 3 squat jumps is not a thing |
| `Bird dogs 10x2 sets` | 10 reps × 2 sets | the word "sets" is on the second number |
| `Leg extension 5x15` | **5 sets × 15 reps** | 5 reps × 15 sets is not a thing |
| `Bench press 4x15` | 4 sets × 15 reps | same |
| `Leg press 5x15` | 5 sets × 15 reps | same |

So the rule is *not* positional — it is "the number that would be absurd as
sets is the reps". A parser cannot apply that, and **a human has to confirm each
of the `3x`/`4x`/`5x`-leading lines before they become data.** They are flagged
`⚠` in the tables below.

Encoding these the wrong way round turns "4 sets of 15" into "4 reps of 15
sets", which is not a typo in a document — it is a training programme nobody
can complete, shipped as if the coach had written it.

### Vocabulary

The thread is Telugu/Hindi written in Latin script, mixed with English.

| Written | Means |
|---|---|
| `cheyu`, `cheyali`, `chesi` | do / to do / having done |
| `karoo`, `karna` | do (Hindi) |
| `mintz` | minutes |
| `teskoni`, `tesko` | take / hold |
| `nd` | and |
| `tigh` | thigh |
| `dbell` | dumbbell |
| `ravali` | should reach (a target) |
| `padkoni` | lying down |
| `knchm` | a little |
| `alternative` | alternating |
| `Shruggs` | shrugs |
| `Burpeess` | burpees |
| `Super man` | superman (back extension) |

### Shape of a session

Most sessions are **cardio warm-up → mobility → main lifts → finisher cardio**.
The cardio bookends are part of the prescription, not preamble: twelve sessions
end with a named treadmill or cross-trainer duration.

---

## The sessions

Numbered in thread order. Titles are mine — the source has none.

### 1 · Back, posterior chain, pull
Bird dogs 10×2 · Superman back extension 10×2 · Squat jumps 15×3 · Pull-ups 10×3 ·
Front lat pulldown ⚠`15x4` · Close-grip lat pulldown ⚠`15x4` · One-arm dumbbell row 12×3 ·
Mid rowing ⚠`15x4` · Abdominal crunches 15×3 · Plank 45s × 2
**Finish:** 30 min treadmill

### 2 · Legs
**Warm-up:** cycle 15 min, then legs warm-up
Squat jumps 20×3 · Backward lunges 10×3 · Leg press ⚠`12x4` · Leg extension ⚠`5x15` ·
Glute bridges 20×3 · Calf raises 20×3
**Finish:** 25 min treadmill

### 3 · Shoulders
**Warm-up:** general warm-up, then shoulder mobility stretches
Burpees 10×3 · Mountain climbers 30×3 · Side plank 30s each side
Shoulder dumbbell press 15×3 · Dumbbell lateral side raises ⚠`12x4` ·
Plate front raise 20×3 · Shrugs · Tricep rope pushdown 15×3 · Overhead dumbbell press ⚠`15x4`

### 4 · Legs + core
**Warm-up:** cycle 10 min, then legs warm-up
Basic squats 20×3 · Leg extension ⚠`5x15` · Outer thigh 15×3 · Weighted squats ⚠`4x15` ·
Lying hamstring curl ⚠`4x15` · Hanging leg raises 12×3 · Abdominal crunches 20×4 · Calf raises 20×4
**Finish:** 25 min treadmill

### 5 · Conditioning / HIIT
Burpees 10×4 · Battle rope 30s · Alternating leg raises 30×4 · Squat jumps 20×4 ·
Mountain climbers 30×4 · Plank 45s × 3
**Finish:** 40 min treadmill

### 6 · Chest + triceps
**Warm-up:** cycle 10 min, then warm-up, then pushups 10×3
Flat bench press ⚠`15x4` · Incline dumbbell press 15×3 · Flat dumbbell press 12×3 ·
Cable crossover 12×3 · Tricep rope pushdown ⚠`4x15` · Overhead dumbbell extension ⚠`15x4` ·
Tricep bench dips 20×3
**Finish:** 30 min treadmill

### 7 · Back + shoulders, supersets
**Warm-up:** cycle 10 min, then shoulder mobility. Start with pull-ups 10×3.
1. Seated cable rowing **+** side lateral raises — 4 sets
2. Front lat pulldown **+** shoulder dumbbell press — 4 sets
3. T-bar row **+** bent-over flys with dumbbells — 3 sets
4. Close-grip lat pulldown **+** plate rotation — 4 sets
5. Incline bench, lying face-down, dumbbell in each hand: rowing **+** alternating face pulls — 3 sets
6. Shrugs — 3 sets
7. Hanging leg raises 15×3 · 8. Knee tucks 20×3
**Finish:** 30 min treadmill

### 8 · Core + chest + triceps
**Warm-up:** cycle 10 min
Abdominal crunches 20×3 · Basic pushups 20×3 · Burpees 10×4 · Kettlebell swings 25×3 ·
Incline dumbbell press 15×3 · Flat dumbbell press ⚠`4x12` · Cable crossover 15×3 ·
Rope pushdown 20×3 · Rod tricep extension 15×3 · Plank 45s × 3
**Finish:** 25 min cross trainer

### 9 · Legs + shoulders
**Warm-up:** cycle 10 min, then legs and shoulder warm-up
Basic squats 20×4 · Seated shoulder press ⚠`15x4` · Leg extension 20×5 ·
Single lateral raises ⚠`15x4` · Walking lunges 15×3 · Dumbbell front raises 15×3 ·
Leg press 20×4 · Face pulls 20×3 · Lying leg curl 15×3 · Calf raises 20×4 · Shrugs 20×4
**Finish:** 20 min cross trainer

### 10 · Back + biceps
**Warm-up:** cycle 10 min
Jumping jacks 50×4 · Pull-ups 10×3 · T-bar row 15×3 · Seated cable row ⚠`15x4` ·
Front lat pulldown ⚠`12x4` · Barbell bent-over row 15×3 · Reverse-grip lat pulldown 15×3 ·
Zig-zag rod close-grip bicep curl ⚠`15x4` · Incline dumbbell bicep curls 12×3 ·
Hammer curls ⚠`15x4` · Bird dogs ⚠`15x4` · Plank 1 min × 3
**Finish:** 30 min treadmill

### 11 · Shoulders
**Warm-up:** cycle 10 min
Mountain climbers 30×3 · Burpees 10×4 · Hanging leg raises 15×3 · shoulder mobility
1. Face pulls 15×3 · 2. Seated shoulder press ⚠`15x4` · 3. Side lateral ⚠`15x4` ·
4. Barbell bent-over flys 20×3 · 5. Shrugs 20×3
**Finish:** 30 min treadmill

### 12 · Chest
Pushups 10×4 · Flat bench press ⚠`15x4` · Cable crossover 12×3 ·
Decline dumbbell press 12×3 · Incline dumbbell flys 15×3

### 13 · Legs
Squat jumps 20×4 · Backward lunges 15×3 · Weighted squats ⚠`4x12` · Leg press ⚠`5x15` ·
Seated hamstring curl ⚠`3x15` · Mountain climbers 30×4 · Hanging leg raises 15×3 · Calf raises 20×4

### 14 · Chest + triceps
**Warm-up:** cycle 15 min, then pushups 10×4
Incline dumbbell press ⚠`15x4` · Cable crossover 12×3 · Bench press ⚠`5x12` ·
Parallel bar 12×3 · Incline chest press close grip 15×3 · Tricep rope pushdown ⚠`15x4` ·
Overhead dumbbell press 20×4 · Tricep dips 20×4 · Abdominal crunches 20×4 · Hanging leg raises 15×3

### 15 · Shoulders + triceps
**Warm-up:** cycle 20 min, then shoulder warm-up with 2 kg dumbbells
1. Seated shoulder press ⚠`4x15` · 2. Standing dumbbell front raises ⚠`3x12` ·
3. Side lateral raises **and** rope pushdown — drop-set both on the last set ·
4. Plate rotation 20×3 · 5. Upright row ⚠`3x15` · 6. Overhead dumbbell press 20×3 ·
7. Flat bench dumbbell skull crusher 20×3 · 8. Bench tricep dips
**Finish:** 20 min cross trainer

### 16 · Core + conditioning
**Warm-up:** treadmill 20 min
Bird dogs 10×3 · Superman extension 15×3 · Squat jumps 20×4 · Burpees 10×4 ·
Kettlebell swings 20×4 · Cable crunches 20×3 · Toe touches 20×3 · Shoulder taps 20×3 ·
Side plank 45s × 3
**Finish:** 20 min cross trainer

### 17 · Full body
Basic squats 20×3 · Pushups 10×3 · Incline dumbbell press 15×3 · Walking lunges 15×3 ·
Cable crossover 15×3 · Lying hamstring curl 20×4 · Bench press ⚠`4x15` · Leg press 20×4 ·
Parallel bar 10×2 · Bulgarian split squats 12×3 ·
**Failure pushups — 1 set, must reach at least 25** · Calf raises 20×3

### 18 · Conditioning + biceps
**Warm-up:** cycle 20 min
Burpees 10×4 · Mountain climbers 30×4 · Battle rope 30 taps · Decline crunches 20×4 ·
Pushups and shoulder taps 20×4 · Zig-zag rod bicep curl 15×3 · Incline bicep curl ⚠`15x4` ·
Hammer curls ⚠`15x4`

### 19 · Biceps + conditioning
Squat jumps 20×4 · Pull-ups 10×4 · Mountain climbers 30×4 · Battle rope 40s × 3 ·
Hanging leg raises 20×4 · Bicep barbell curl 15×3 · Inner hammer curls ⚠`15x4` ·
Preacher curl ⚠`15x4` · Concentration curl 12×3

### 20 · Back + shoulders
Pull-ups 10×3 · One-arm dumbbell row 15×3 · Back lat pulldown 15×3 · T-bar row 15×3 ·
Reverse-grip lat pulldown ⚠`4x15` · Arnold press 15×3 · Bent-over flys 20×3 ·
Side lateral raises 15×3 · Face pulls 20×3 · Shrugs 20×3 · Abdominal crunches 20×3

### 21 · Chest + triceps
Burpees 10×3 · Pushups 15×3 · Incline dumbbell press ⚠`15x4` · Incline cable flys ⚠`15x4` ·
Bench press ⚠`15x4` · Parallel bar 10×3 · Dumbbell skull crusher 15×3 ·
Rope cable pushdown 20×4 · Overhead dumbbell press 15×3 · Alternating leg raises 30×4 ·
Side plank 30s × 3

### 22 · Legs — leg-press pyramid
Basic squats 20×3 · Hip adduction machine, inner and outer thigh ⚠`3x15`
**Leg press, pyramid:** start at 25 kg each side and reach 50 total reps; then add 10 kg
each side and do 40 reps; keep adding, reducing reps, down to 10 reps.

### 23 · Legs (continues 22)
Bulgarian split squats **alternating with** leg extension ·
Goblet squats, heavier weight, 4 sets

### 24 · Hamstrings (continues 23)
Lying hamstring curl 20×4 — **drop the total weight on the last set**

### 25 · Glutes + biceps (continues 24)
Hip thrust 3 × 15 · Seated dumbbell bicep curls ⚠`15x4` ·
Zig-zag rod wide-grip bicep curl 15×3 · Preacher curl ⚠`15x4` · Calf raises 20×4

### 26 · Push, after cardio
Pushups 15×3 · Incline dumbbell press ⚠`4x12` · Cable lateral side raise ⚠`3x15` ·
Parallel bar 3 × 10 · Seated shoulder press ⚠`4x15` · Flat bench press ⚠`4x15` ·
Plate front raise 20×3 · Decline cable crossover ⚠`3x15` · Face pulls 20×3 ·
Hanging leg raises 20×3

### 27 · Legs + conditioning
Squat jumps 20×4 · Extension 20×5 · Sumo squats ⚠`3x20` · Battle rope 45s × 3 ·
Thrusters 20×4 · Leg extension 15×5 · Kettlebell swings 30×3 · Weighted squats 15×3 ·
Side plank 45s × 3 · Calf raises 20×4

### 28 · Back + biceps
Pull-ups 10×3 · Renegade row 15×3 · Seated cable row ⚠`4x15` · One-arm dumbbell row ⚠`3x15` ·
Front lat pulldown ⚠`15x4` · Straight-arm pulldown 15×3 ·
7-foot rod bicep curl — must reach 20 reps, 3 sets · Incline dumbbell curls ⚠`4x15` ·
Rope hammer curls 20×3 · Abdominal crunches 20×3 · Hanging leg raises 20×3

### 29 · Shoulders + triceps
Burpees 10×4 · Thrusters 20×4 · Arnold press ⚠`15x4` · Plate front raises 20×4 ·
Behind-neck smith machine press 15×3 · Bent-over flys 20×4 ·
Cable lateral side raises ⚠`5x15` · Shrugs 20×3 · Rope tricep extension ⚠`15x4` ·
Single-hand dumbbell extension 20×3 · Single-hand cable pressdown 15×3 · Kickbacks 20×3

---

## What encoding this needs, beyond the numbers

Checked against what the app already models (`src/lib/types.ts`,
`src/lib/homeExerciseData.ts`, `src/lib/pullups.ts`):

1. **Supersets.** Session 7 and session 15 pair two exercises under one set
   count. Nothing in the current `Workout` shape expresses "A+B, 4 sets".
2. **Pyramids and drop sets.** Session 22's leg press and session 24's hamstring
   curl are *schemes*, not rep counts.
3. **The cardio bookends.** Twelve sessions prescribe a specific finisher. Those
   are `Workout` entries of their own in this app's model, so one session maps to
   more than one record.
4. **Exercise names.** Several here are not in `homeExerciseData` — battle rope,
   renegade row, Bulgarian split squat, Arnold press, thrusters, hip adduction
   machine, behind-neck smith press. Each needs a muscle mapping or it will not
   show in the body view.
5. **"Failure" and "must reach" targets** (sessions 17, 28) are a different kind
   of prescription from a rep count and currently have nowhere to live.

None of these is a reason not to do it. They are the reason it is a feature and
not a data entry job, and they are why this file exists before the code does.

---

## Verbatim source

Kept because every normalisation above is an interpretation, and the original is
the only thing that cannot be wrong. Wrapped exactly as received.

```text
Hello
First do bird dogs 10x2 sets
Super man back extension 10x2
Squat jumps 15x3
Pull ups 10x3
Front lat pull down15x4
Close grip lat pull down 15x4
One arm dbell row 12x3
Mid rowing 15x4
Abdominal crunches 15x3
Plank 45seconds 2 sets
30 minutes treadmill

Hello
Do cycle for 15 mintz
Legs warmup cheyu
20x3 squat jumps
Back ward lunges 10x3
Leg press 12x4
Leg extension 5x15
Glute bridges 20x3
Calf raises 20x3
After leg workout 25 minutes treadmill cheyu

Warmup cheyu first then shoulder mobility streches cheyu
1.burpees 10x3
2.mountain climbers 30x3
3. Side plank 30 seconds each side
1. Shoulder dbell press 15x3
2. dbell lateral side raises 12x4
3. plate front raise 20x3
4. shruggs
5. tricep rope push down 15x3
6. over head dbell press 15x4

First cycle cheyu 10mintz
Then legs warmup cheyu
Basic squats 20x3
Leg extension 5x15
Outer tigh 15x3
Weighted squats 4x15
Lying hamstring curl 4x15
Hanging leg raises12x3
Abdominal crunches 20x4
Calf raises 20x4
Then treadmill 25mintz

Hello
1.burpees 10x4
2.battle rope 30seconds
3.alternative leg raises 30x4
4.squats jumps 20x4
5.mountain climbers 30x4
6.plank 45 seconds 3 tyms
After this do treadmill for 40minute

Hello 10 minutes cycle cheyu
Then warmup chesi pushups cheyu 10x3
1.flat bench press 15x4
2.incline dbell press 15x3
3.flat dbell press12x3
4.Cable cross over 12x3
5. Tricep rope pushdown 4x15
6. over head dbell extension 15x4
7. tricep bench dips 20x3
Do treadmill for 30mintz

Hello first cycle cheyu 10 mintz then shoulder mobility cheyu
Start with pull ups 10 x3
1.seated cable rowing and side lateral raises 4sets
2.front lat pull down and shoulder dbell press 4sets
3. Tbar row nd bent over flys with dbells 3 sets
4. close grip lat pull down and plate rotation 4 sets
5. incline lo reverse padkoni two hands lo dbell hold chesi rowing cheyali nd alternative face pulls cheyali 3 sets
6. Shruggs 3sets
7. Hanging leg raises 15x3
8. knee tucks 20x3
Last ki 30mintz treadmill cheyu

First cycle cheyu 10 mintz
Start with abdominal crunches 20x3
Basic pushups 20x3
Burpess 10x4
Kettle bell swings 25 x3
Incline dbell press15x3
Flat dbell press 4x12
Cable cross over 15x3
Rope pushdown 20x3
Rod tricep extension 15x3
Plank 45 seconds 3 sets
Last ki 25 minutes cross trainer cheyu

First cycle cheyu10 mintz
Legs nd shoulder warmup cheyu
Basic squats 20x4
Seated shoulder press 15x4
Leg extension 20x5
Singe lateral raises 15x4
Walking lunges 15x3
Dbell front raises 15x3
Leg press 20x4
Face pulls 20x3
Lying leg curl 15x3
Calf raises 20x4
Shruggs 20x4
Then cross trainer cheyu 20mintz

First cycle cheyu 10mintz
Jumping jacks 50x4
Pull ups 10x3
T bar row 15x3
Seated cable row 15x4
Front lat pull down12x4
Barbell bent over row 15x3
Reverse grip lat pull down 15x3
Zig zag rod close grip bicep curl15x4
Incline dbell bicep curls 12x3
Hammer curls 15x4
Bird dogs 15x4
Plank 1minute 3sets
Then do treadmill 30mintz

Cycle cheyu 10 mintz
Mountain climbers 30x3
Burpees 10x4
Hanging leg raises 15x3
Shoulder mobility cheyu
1.face pulls 15x3
2.seated shoulder press 15x4
3.side lateral 15x4
4.barbell bent over flys 20x3
5.shruggs 20x3
Treadmill 30mintz

Then pushups cheyu 10x4
Flat bench press 15x4
Cable cross over 12x3
Decline dbell press 12x3
Incline dbell flys 15x3

Squat jumps 20x4
Back ward lunges 15x3
Weighted squats 4x12
Leg press 5x15
Seated hamstring curl 3x15
Mountain climbers 30x4
Hanging leg raises 15x3
Calf raises 20x4

Warmup cheyu cycle 15 mintz
Pushups 10x4
Incline dbell press 15x4
Cable cross over 12x3
Bench press 5x12
Parallelbar 12x3
Incline chest presss close grip 15x3
Tricep rope pushdown 15x4
Over head dbell press 20x4
Tricep dips20x4
Abdominal crunches 20x4
Hanging leg raises 15x3

Cycle cheyu first 20mintz
Shoulder warmup karoo 2 kg dbells leke
1.seated shoulder press 4x15
2.standing dbell front raises3x12
3.side lateral raises aur rope push down last mai dono drop set karna
4.plate rotation 20x3
5. Upright row 3x15
6. over headdbell press 20x3
7. flat bench dbell skull crusher 20x3
8. bench tricep dips
20mintz cross trainer cheyu

Treadmill cheyu 20 mintz
Bird dogs 10x3
Super man extension 15x3
Squat jumps 20x4
Burpees 10x4
Kettle bell swings 20x4
Cable crunches 20x3
Toe touches 20x3
Shoulder taps 20x3
Side plank 45seconds 3 sets
Cross trainer 20 mintz

Basic squats 20x3
Pushups 10x3
Incline dbell press 15x3
Walking lunges 15x3
Cable cross over 15x3
Lying hamstring curl 20x4
Bench press 4x15
Leg press 20x4
Parallel bar 10x2
Bulgarian split squats 12x3
Failure pushups 1 set minimum 25 ravali
Calf raises20x3

Cycle cheyu 20mintz
Burpeess 10x4
Mountain climbers30x4
Battle rope 30 taps
Decline crunches 20x4
Pushups nd shoulder taps 20x4
Zigzag rod teskoni bicep curl cheyu15x3
Incline bicep curl 15x4
Hammer curls 15x4

Squat jumps 20x4
Pull ups 10x4
Mountain climbers 30x4
Battle rope 40seconds 3sets
Hanging leg raises 20x4
Bicep barbell curl 15x3
Innner hammer curls 15x4
Preacher curl 15x4
Concentrate curl 12x3

Pull ups 10x3
One arm dbell row 15x3
Back lat pull down15x3
T bar row 15x3
Reverse grip lat pull down 4x15
Arnold press 15x3
Bent over flys 20x3
Side lateral raises 15x3
Face pulls 20x3
Shruggs 20x3
Abdominal crunches 20x3

Burpees 10x3
Pushups15x3
Incline dbell press 15x4
Incline cable flys 15x4
Bench press 15x4
Parallel bar 10x3 sets
Dbell skull crusher 15x3
Rope cable pushdown20x4
Over headdbell press 15x3
Alternative leg raises30x4
Side plank30seconds 3sets

Basic squats 20x3
Hip aduction machine inner tigh n outer tigh 3x15
Leg press first 25kgs each side add cheyu total 50 reps ravali then each side 10 add nd 40 reps cheyu ala add chestu 10 reps varaku cheyali

Bulgarian split squats nd leg extension alternative
Goblet squats weigt knchm heavy tesko 4sets

Lying hamstring curl 20x4
Then last ki drop cheyali total weights

Hip trust 3sets 15 reps
Seated dbell bicep curls 15x4
Zizzag rod wide grip bicep curl 15x3
Preacher curl 15x4
Calf raises 20x4

After cardio start with pushups 15x3
Incline dbell press 4x12
Cable lateral side raise 3x15
Parallel bar 3sets 10 reps
Seated shouder press 4x15
Flat bench press 4x15
Plate front raise 20x3
Decline cable cross over 3x15
Face pulls 20x3
Hanging leg raises 20x3

Squats jumps 20x4
Extension 20x5
Sumo squats 3x20
Battle rope45seconds 3sets
Thrusters 20x4
Leg extension 15x5
Kettle bell swings30x3
Weighted squats 15x3
Side plank 45seconds 3 sets
Calf raises 20x4

Pull ups 10x3
Renegade row 15x3
Seated cable row 4x15
One arm dbell row 3x15
Front latpulldown15x4
Straight arm pull down15x3
7 feet rod teskoni bicep curl cheyu 20reps ravali 3sets
Incline dbell curls4x15
Rope hammer curls20x3
Abdominal crunches20x3
Hanging leg raises 20x3

Burpeess 10x4
Thrusters 20x4
Arnold press 15x4
Plate front raises 20x4
Behind neck smith machine press
15x3
Bend over flys20x4
Cable lateral side raises5x15
Shruggs20x3
Rope tricep extension15x4
Single hand dbell extension 20x3
Single hand cable press down15x3
Kick backs20x3
```
