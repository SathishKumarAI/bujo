# Credits & Acknowledgments

**All source code in this repository was written from scratch for this project**
(including the SVG muscle map, charts wiring, and all components). No code was
copied from the projects below — they are credited as **inspiration** for
features and UX, or as **dependencies/assets** with their own licenses.

If you believe something here should carry additional attribution, please open
an issue and it will be corrected.

## Method & inspiration

| Source | Link | What it inspired |
|---|---|---|
| The Bullet Journal Method — Ryder Carroll | https://bulletjournal.com/ | Rapid logging, signifiers, migration, future log, index, collections |
| "My Minimalist Bullet Journal" (Elsa, van-life series) | https://www.youtube.com/watch?v=DRt8j7H1GvE | One-pen minimal style, location-per-month calendar, gratitude & daily-memory pages, mood/stress/sleep + intake trackers |
| "EASY Minimalist BULLET JOURNAL Set Up 2025 \| HOW TO START" | https://www.youtube.com/watch?v=6_SqKVS_8pM | Minimalist monthly setup & beginner spread structure |
| The Lazy Genius — "How to Bullet Journal" | https://www.thelazygeniuscollective.com/blog/how-to-bullet-journal | Index / future log / monthly log / signifiers / migration / threading / collections confirmation |
| GRIT (by 8sujan6) | https://github.com/8sujan6/GRIT | Fitness feature set: fast set logging, custom routines, exercise library, personal records, body-metrics tracking, 100% offline |
| wger | https://wger.de/en/software/features · https://wger.de/en/exercise/overview/ | Workout manager, **exercise database (search + images)**, **anatomical muscle diagrams** (base body + per-muscle highlight SVGs), nutrition / macro diary, body-weight tracking |

## Dependencies (their own licenses)

| Library | License | Use |
|---|---|---|
| [React](https://react.dev/) | MIT | UI |
| [Vite](https://vite.dev/) | MIT | Build/dev |
| [Tailwind CSS v4](https://tailwindcss.com/) | MIT | Styling |
| [Recharts](https://recharts.org/) | MIT | Charts |
| [lucide-react](https://lucide.dev/) | ISC | Icons |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) | MIT | PWA/offline |
| [Vitest](https://vitest.dev/) + Testing Library | MIT | Tests |

## Design assets

| Asset | License | Use |
|---|---|---|
| [Catppuccin](https://catppuccin.com/) palette (Mocha/Latte) | MIT | Theme colors |
| [Fraunces](https://fonts.google.com/specimen/Fraunces) | OFL | Display/serif titles |
| [Inter](https://fonts.google.com/specimen/Inter) | OFL | Body/UI text |
| [Caveat](https://fonts.google.com/specimen/Caveat) | OFL | Handwriting mode |

## Optional network services (off by default)

| Service | Link | Use |
|---|---|---|
| Open-Meteo | https://open-meteo.com/ | Weather (no key) |
| BigDataCloud reverse geocode | https://www.bigdatacloud.com/ | City label from coordinates |

The anatomical muscle diagrams shown in the Gym view are **wger's muscle SVG
images** (base body + per-muscle overlays), loaded from wger's public static
assets and used under **CC-BY-SA**. All surrounding code, layout, and the
split→muscle mapping are original to this project.
