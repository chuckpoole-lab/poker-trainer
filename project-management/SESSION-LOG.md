# Poker Trainer — Session Log

This file is updated at the end of every work session. Read this first when starting a new session.

---

## Session: April 6, 2026
**Focus:** Bug fixes, UX overhaul (color palette + 5-tab nav), bar poker scoring direction

### What was done
- **Fixed daily stats timezone bug** — Coach dashboard was using UTC dates, causing player counts to reset at 7 PM Eastern instead of midnight. Fixed both client-side (session-tracker.ts → `America/New_York`) and server-side (Supabase `get_daily_stats` function → `AT TIME ZONE`). Deployed SQL update via Supabase dashboard.
- **Simplified feedback form** — Replaced 5 rating scales + name/email with 4 quick questions (first time? fun? coming back? suggestions?). Under 30 seconds. Reuses existing Supabase columns, no migration needed. *(committed prior session, pushed this session)*
- **Fixed session timeout** — Auth token refresh with Promise.race timeout guards, auto-reload after 2+ min away. *(committed prior session, pushed this session)*
- **UX overhaul: warm color palette** — Replaced entire dark charcoal theme with Wordle-inspired light theme. Cream backgrounds (#f0ebe3), forest green accents (#4a7c59), warm gold (#e8a848). Poker table felt/rail stays dark. Updated globals.css design tokens, action buttons, badges, shadows, all utility classes.
- **UX overhaul: 5-tab navigation** — Restructured from 8 tabs (Home, Play, Learn, Assess, Drills, Progress, Settings + Coach) to 5 tabs (Home, Play, Train, Progress, More). Train consolidates Learn + Assessment + Drills into a session launcher hub. More consolidates Settings + Feedback + About + Coach (admin).
- **New pages created:** `/train` (6-option session launcher), `/more` (settings hub), `/more/feedback`, `/more/about`
- **Fixed hardcoded dark colors** — Updated fallback hex values across page.tsx, play/page.tsx, Onboarding.tsx, FeedbackSurvey.tsx from dark slate to light theme values.
- **Updated work plan** — Added "Borderline Hand Scoring" as Priority 2a with three-phase roadmap (acceptable buffer → exploit mode → table-aware training). Added Preflop Pro integration notes.

### Commits pushed (4 total)
1. `ec4c6a8` Fix session timeout: add timeout guards and auto-reload on stale tab *(prior session)*
2. `1f3cc80` Simplify feedback form to 4 quick questions *(prior session)*
3. `770c1da` Fix daily stats timezone: use Eastern Time instead of UTC
4. `44b077f` UX overhaul: warm color palette + 5-tab navigation

### Decisions made
- Warm light theme approved — cream/green/gold palette live on Vercel
- 5-tab nav approved — Home, Play, Train, Progress, More
- Bar poker scoring: agreed to add "acceptable zone" for borderline hands (Phase 1). App shouldn't punish reasonable exploitative plays that work at bar poker tables. Full 3-phase roadmap captured.
- Poker table component keeps its dark felt/rail palette (intentional — that's the visual centerpiece)
- Old routes (/learn, /assessment, /drills, /settings) still work, just not in the tab bar

### What's next
- **Borderline hand scoring** — Add acceptable buffer to scoring logic (Phase 1, quick win)
- **Visual polish pass** — Some pages (assessment, drills, progress, admin) may need individual tweaks for the new light theme
- **Wire up Train hub** — Train options currently all route to existing pages; "Fix My Leaks" and "Position Drills" need specific drill configs passed through
- **Home page redesign** — Current home page is basic; mockup shows personalized landing with streak, daily challenge banner, quick actions
- **Get Chuck's feedback** — on the new warm palette and 5-tab nav live on the site

---

## Session: April 5, 2026 (Evening)
**Focus:** Bug fix, docs sync, missing commit

### What was done
- Fixed session timeout bug: added visibilitychange listener in auth-context.tsx that refreshes Supabase auth when user returns to a stale tab. Committed and pushed — live on Vercel.
- Committed and pushed all project docs: work plan, devlog, dashboard, UX vision, mockups synced to GitHub.
- Found and committed missing April 3 work: range-tables.ts (37 facing-open combos) and validate-ranges.py (14,365 scenarios). These had been done but never pushed.
- Three total commits pushed: session timeout fix, project docs, range gap fix.
- Created CLAUDE.md startup file so future sessions auto-load the work plan, set up todo list, recap last session.

### Decisions made
- Confirmed repo is clean and in sync with GitHub
- UX vision doc attachment to Chuck's Gmail draft still pending

### What's next
- Meeting with Chuck — walk through UX vision doc, get sign-off on color direction, 5-tab nav, two-path home screens
- Start implementing warm color palette (CSS variables / design tokens swap)
- Build the 5-tab navigation
- Build welcome screen fork ("How do you play poker?")

---

## Session: April 5, 2026 (Afternoon)
**Focus:** Codebase scan, folder portability check

### What was done
- Scanned all project-management files for hardcoded absolute paths — came back clean
- Confirmed safe to move the local folder without breaking anything
- Local folder path confirmed: C:\Users\rctha\Documents\poker-trainer\project-management

### What's next
- No action items from this session

---

## Session: April 3, 2026
**Focus:** GTO solver integration, range validation, app accuracy overhaul

### What was done
- Replaced entire hand-typed decision engine with GTO solver-generated ranges
- Built automated validation script testing 14,365 scenarios
- Filled all 37 missing facing-open combos with GTO ranges
- Fixed Chuck's bug: BB with 66 vs BTN raise was being told to fold
- Fixed A3s bug and all other edge cases systemically (not one by one)
- All 5 commits pushed to Vercel, live
- Validation: 0 CRITICAL, 0 GAP issues across all scenarios

### Decisions made
- GTO solver is now the source of truth for all preflop decisions
- Discussed building a standalone preflop Quick Reference app (separate from trainer)

### What's next
- See "NEXT SESSION" section in WORK-PLAN.md for full details
