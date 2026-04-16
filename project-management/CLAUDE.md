# Poker Trainer — Project Instructions

When starting a new session on this project:

1. **Run session-start checks FIRST** (see below) and flag any issues to Chris before doing anything else
2. Read SESSION-LOG.md — it has what happened last time and what's next
3. Read WORK-PLAN.md for the full priority list and open tasks
4. Set up a TodoList showing open tasks
5. Give Chris a brief recap: what was accomplished last session, what's next up, AND anything the session-start checks surfaced
6. Ask if he wants to pick up where we left off, tackle the backlog, or work on something else

## Session-start checks — ALWAYS DO THESE, ALWAYS REPORT
Chris is trusting Claude to be his memory. If Claude doesn't surface the state of the repo at the start of a session, nobody else will. Run these before the recap:

1. **Git state.** From cmd.exe in the repo root:
   - `"C:\Program Files\Git\cmd\git.exe" status -sb` — any uncommitted changes?
   - `"C:\Program Files\Git\cmd\git.exe" log origin/master..HEAD --oneline` — any unpushed commits?
   - `"C:\Program Files\Git\cmd\git.exe" log HEAD..origin/master --oneline` — has origin moved ahead (someone else pushed)?
2. **Last session's close state.** Scan the most recent `## Session:` block in SESSION-LOG.md for any "failed", "blocked", "still pending", "broken", "didn't push", "unfinished", "TODO", or "pending migration" notes. If the "What's next" or "End-of-day sync" sections flag anything as not-done, surface it.
3. **Build state.** If the last session mentioned a failed build or a skipped build, mention it and offer to run one.
4. **Deferred external actions.** Anything Chris was supposed to do (run a migration in Supabase, flip a Vercel env var, approve something with Chuck) that hasn't been marked done.

**Report format at session start:**
Give Chris a 4-line status block before the recap, e.g.:
```
Repo: clean, in sync with origin (or: 2 unpushed commits / 1 modified file / origin ahead by N)
Last session: closed clean (or: left X blocked / build failed at commit Y / migration still pending)
Deferred items: none (or: list)
Last session focus: [one-line recap]
```
If everything is clean, say so in one line — don't bury it. If anything is amiss, surface it UPFRONT in plain language — "There are 3 unpushed commits from Friday" — and ask whether to push them before starting new work.

## Session rules
- **At end of every session:** Update SESSION-LOG.md with what was done, decisions made, and what's next. Include an "End-of-day sync" subsection confirming git state (committed? pushed?), build state, and any deferred external actions.
- **If status or progress changed:** Update projects_data.json in the cowork_projects folder
- **If switching to another project:** Update this session log first before jumping
- **Never leave uncommitted changes without saying so.** If the session ends with dirty working tree or unpushed commits, the SESSION-LOG.md must say so explicitly so the next session's check catches it.

## Key files
- **SESSION-LOG.md** — session-by-session history (read this first)
- **WORK-PLAN.md** — current priorities and open tasks
- **PROJECT-PLAN.md** — full roadmap and strategy
- **DEVLOG.md** — development history
- **DASHBOARD.md** — quick reference links and stats

## Project context
- **App:** Poker Trainer for bar poker players (Next.js + Supabase + Vercel)
- **Live at:** https://poker-trainer-ashy.vercel.app
- **GitHub:** https://github.com/chuckpoole-lab/poker-trainer
- **Owners:** Chris Thatcher and Chuck Poole
- **Current phase:** UX Overhaul + User Testing
