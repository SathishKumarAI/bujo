# graphify
- **graphify** (`.claude/skills/graphify/SKILL.md`) - any input to knowledge graph. Trigger: `/graphify`
When the user types `/graphify`, invoke the Skill tool with `skill: "graphify"` before doing anything else.

# agents
- **data-engineer** (`.claude/agents/data-engineer.md`) — storage choice, schema,
  migrations, export/backup and restore, sync and conflict resolution, making
  data queryable. Use it before changing anything under `src/lib/storage.ts`,
  `supabase.ts`, `bujocloud.ts`, `fscloud.ts` or the export paths — this app has
  several write paths and silent divergence between them is the risk.
  Not for UI that merely reads data.

  The agent registry is read at session start, so a newly added agent is not
  invocable until the next session.
