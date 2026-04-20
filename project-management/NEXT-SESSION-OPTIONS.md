# Next session — options for tasks #7 and #8

Prepared at end of 2026-04-19 session. Read this alongside SESSION-LOG.md at session start.

The integrity check fix, flag-pull automation, and Daily 5 option 1 all shipped today. Next up: admin Flags tab upgrade (#7) and scheduled daily flag digest (#8). Chris should pick one of the menus below per task — Claude will implement whichever is picked.

---

## Before starting next session — quick verification pass

The integrity check fix deployed today (commit `7ee5bbb`). Before #7 or #8 work, Chris should run `pull-flags.bat` and Claude should scan for:

1. Any new `AUTO_DOM_INTEGRITY_FAIL` rows — proof the DOM-level check fires. Zero rows means either (a) no desync happened in the window, or (b) the check is still blind. Either way, useful signal.
2. Any user-reported desync flags. These now carry `build=<sha7> | id=<hand.id> | domCards="..." | domSituation="..."` in the note field. If a desync recurs post-fix, these fields pinpoint the exact DOM state that was wrong.
3. Drop in open-flag volume vs the 2026-04-19 pull (8 total, 4 of which were desync-category complaints).

This verification belongs in task #5 and should happen regardless of which option is picked below.

---

## Task #7 — admin Flags tab upgrade

**Current state** (src/app/admin/page.tsx lines 597–702):
- 4-cell summary (open / agreed / adjusted / dismissed counts)
- Flat chronological list of flag cards
- Per-card: hand, position, stack, app action, user action, explanation excerpt, note, date, review buttons

**Gaps that motivated the upgrade:**
- No category grouping — "card/text desync" vs "wording complaint" vs "missing action" vs "disagrees with recommendation" all look the same
- `build=`, `id=`, `domCards=`, `domSituation=` fields we now inject into every flag are buried inside the note string — not surfaced as columns
- No filters (status, date, user, build, hand category)
- Auto-flags (`AUTO_INTEGRITY_FAIL:` / `AUTO_DOM_INTEGRITY_FAIL:`) aren't visually distinguished from user flags
- No bulk actions or per-user drill-down

### Option 7A — minimum viable upgrade (small, 1 session)
Just surface what we already collect. Three changes:
1. Parse the structured suffix out of `note` (`build=`, `id=`, `domCards=`, `domSituation=`) and render them as a small labeled row below the free-text note. If absent (older flags), skip.
2. Auto-flag detection: if `note` starts with `AUTO_INTEGRITY_FAIL:` or `AUTO_DOM_INTEGRITY_FAIL:`, render with a red "AUTO" badge and group them to the top of the list.
3. Add a single-select filter pill row: All / Open / Auto-flags / Has-user-note.

Stays in the existing tab. No schema change. Low risk. Probably 150–200 lines of admin/page.tsx diff.

### Option 7B — category-driven upgrade (medium)
7A plus:
- Heuristic category classifier that reads the free-text note and tags each flag as one of: `desync` (mentions "wrong card", "shown", rank mismatch), `wording` (mentions "wording", "text", "explanation"), `missing-action` (mentions "no option to", "can't choose", "missing"), `disagrees` (user just typed a disagreement), `no-note` (empty note).
- Summary grid expands from 4 cells (status) to 8 cells (4 status + 4 category).
- Filter pill row includes the 5 categories.

Classifier is pure client-side string matching — no DB columns needed. Can iterate the keyword lists over time.

### Option 7C — full admin tooling (big, probably 2 sessions)
7B plus:
- Per-user filter with user name column, click-to-filter
- Date range picker
- Build ID filter (to isolate flags from a specific deploy)
- Bulk action: select-all-matching → agree/dismiss in one stroke
- Export-to-CSV for offline triage
- Persistent sort preference (local storage)

Heavier. Would also benefit from migrating some derived fields out of the note string into real columns (`category`, `build_id`, `hand_object_id`) — schema change territory.

**Recommendation for next session:** ship 7A first (high-value, low-risk). 7B can stack on top the same day if there's appetite. 7C is a future investment once we have enough flag volume to justify it.

---

## Task #8 — scheduled daily flag digest

**Goal:** don't make Chris remember to double-click pull-flags.bat. Something runs on a cadence and surfaces only what's changed since the last run.

### Option 8A — Windows Task Scheduler (local, simplest)
- A Windows scheduled task runs `pull-flags.bat` every morning at 8 AM.
- The script writes the same daily JSON/MD files it does today. No delivery — Chris checks the folder when he wants.
- **Pros:** zero new infra; uses existing tooling. Can use the `schedule` skill to wire it up.
- **Cons:** no push — Chris still has to remember to look. Also only runs when Chris's machine is on. Chuck doesn't get it.

### Option 8B — Windows Task Scheduler + Gmail draft (local + push)
- 8A plus: the pull script, after writing the daily file, creates a Gmail **draft** to cthatcher1963@gmail.com summarizing (a) open flag count, (b) delta since yesterday's run, (c) any new `AUTO_DOM_INTEGRITY_FAIL` rows (priority-elevated).
- Uses the already-connected gmail MCP (`gmail_create_draft`) — no new auth.
- Draft, not send — Chris decides whether to forward to Chuck.
- **Pros:** push notification without fighting deliverability (it's a Gmail draft in Chris's own account). Same local-tooling trust model as the manual pull.
- **Cons:** still depends on Chris's machine being on. Draft needs Chris to open Gmail to see it.

### Option 8C — Supabase scheduled function + email (cloud)
- A Supabase edge function (or `pg_cron`) runs daily, queries `flagged_hands`, computes the delta, and sends an email via Supabase SMTP or a transactional-email provider.
- **Pros:** runs even when Chris's laptop is off. Scalable to Chuck too.
- **Cons:** new infra. Requires SMTP credentials, function deploy, cron job. 2× the surface area of 8A/8B.

### Option 8D — GitHub Actions scheduled workflow
- A `.github/workflows/flag-digest.yml` that runs on a cron, uses `SUPABASE_SERVICE_ROLE_KEY` from Actions secrets, queries flags, and either commits the daily file to a repo path or posts to a Discord/Slack webhook.
- **Pros:** GitHub already hosts the repo; Actions is free for public repos.
- **Cons:** the repo is public — would need to be careful about what the workflow writes (no user IDs). And adds a secret to Actions.

### Option 8E — Cowork `schedule` skill (experimental)
- Use the Cowork schedule skill to register a scheduled task that invokes `pull-flags.bat` and summarizes back into this chat on a cadence.
- **Pros:** lowest-friction path given the tooling in this environment.
- **Cons:** unclear if scheduled tasks run when Cowork isn't active. Read the schedule skill's SKILL.md before committing.

**Recommendation for next session:** 8B (Windows scheduled task + Gmail draft) is the best fit given constraints — zero new cloud infra, uses existing tooling, pushes a notification Chris will actually see. Falls back gracefully (if machine is off, it runs next time the machine is on). Total work probably 1 hour.

---

## If asked "should we do #7 or #8 first?"
Do #7 first. Reason: the integrity-fix verification in task #5 wants a good Flags tab for triage. If #7 ships first, the verification pass can use the upgraded tab directly. If #8 ships first, the digest would just push volume into Chris's inbox without a good way to action it.
