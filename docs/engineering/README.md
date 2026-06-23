# bujo — engineering views

The same app, documented through five lenses, plus UML. Pick the view that
matches how you think.

| View | For | Doc |
|---|---|---|
| 👤 **User** | "What does each feature do and how do I use it?" | [user-view.md](user-view.md) |
| 🏗️ **Software / architecture** | components, data flow, state, modules, rendering | [architecture-view.md](architecture-view.md) |
| 🔌 **Backend** | API routes, auth, sync, storage, security boundaries | [backend-view.md](backend-view.md) |
| 🧮 **Data engineering** | the data model, persistence, schemas, export/import, pipelines | [data-engineering-view.md](data-engineering-view.md) |
| 🤖 **ML / analytics** | the analytics, the coach heuristics, and where real ML could go | [ml-analytics-view.md](ml-analytics-view.md) |
| 📐 **UML** | component, class/data-model, and sequence diagrams (Mermaid) | [uml.md](uml.md) |

**One-line summary:** bujo is a **local-first** React 19 + Vite SPA. The entire
journal is one `JournalData` JSON object in `localStorage`; optional, opt-in
cloud sync (Supabase / cloud folder / gist / self-host) layers on top with
end-to-end encryption where applicable. No required backend; the two Vercel
functions (`api/sync`, `api/feedback`) only ever see ciphertext or feedback text.

In-app, every **view** has a `?` help blurb in the top bar and every **card**
has an ⓘ popover explaining what it is — this documentation is the deep version
of those.

See also the canonical specs: [`../ARCHITECTURE.md`](../ARCHITECTURE.md),
[`../DATA_MODEL.md`](../DATA_MODEL.md), [`../SECURITY.md`](../SECURITY.md),
[`../FEATURES.md`](../FEATURES.md).
