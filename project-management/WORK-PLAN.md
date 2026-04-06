# Poker Trainer — Work Plan & Priorities
## Updated April 5, 2026

---

## NEXT SESSION: Pick Up Here (April 6-7)

1. **Commit + push session timeout fix** — auth-context.tsx is ready, just needs `git commit` and `git push` to deploy via Vercel
2. **Follow up with Chuck** — did he review the UX vision doc? Get sign-off on: color direction, 5-tab nav, two-path home screens
3. **Start implementing warm color palette** — begin with CSS variables / design tokens swap (cream background, felt green, gold accents)
4. **Build the 5-tab navigation** — replace current 8-tab layout, wire up path-dependent Home screen
5. **If Chuck approves:** build the welcome screen fork ("How do you play poker?")

**Reminders:**
- Attach `Poker-Trainer-UX-Vision-v2.html` to the Gmail draft to Chuck if not done yet (file is at: `C:\Users\rctha\Documents\poker-trainer\project-management\Poker-Trainer-UX-Vision-v2.html`)
- Delete the stale "(no subject)" Gmail draft that contains raw HTML

---

## PRIORITY 1: UX Overhaul (Retention is the #1 problem)

People are visiting but not coming back. Everything in this section directly addresses that.

### 1a. Visual Redesign — "Wordle for Poker" feel
- [ ] Implement warm light color palette (cream background, felt green accents, gold highlights)
- [ ] Replace dark charcoal theme across all screens
- [ ] Keep poker table green felt and brown rail — extend that warmth to the rest of the UI
- [ ] Ensure the app feels bright, inviting, and fun — not like a dark-mode dev tool
- [ ] Mockup approved direction: see `wordle-poker-mockup.html` in project-management folder
- **Status:** Mockup created, Chris says "getting a lot closer" — refine and implement

### 1b. Navigation Redesign — 5 tabs, clear purpose
Current 8-tab nav is confusing (Home = Play duplicate, too many choices). New structure:
- [ ] **Home** — personalized landing: greeting, daily challenge banner, "what do you want to work on?" quick actions, what's new / what's coming
- [ ] **Play** — Daily Hands only (the Wordle moment, daily reason to return)
- [ ] **Train** — focused session launcher for serious players: assessment, quick drill, fix my leaks, position drills, short stack jam/fold, learn basics. Pick one and go. No sub-tabs.
- [ ] **Progress** — stats, streaks, IQ trend, leak breakdown (needs data improvements, see 2d)
- [ ] **More** — settings, feedback, coach dashboard (admin), about
- [ ] Remove duplicate Home/Play routing
- **Decision needed:** Chris + Chuck confirm nav structure

### 1c. Session Timeout Fix — Stop the frozen screen
- [ ] Add visibility change listener — silently refresh Supabase auth token when user returns to tab
- [ ] If silent refresh fails, show friendly "Welcome back — tap to reconnect" prompt
- [ ] Consider auto-logout after 30+ min inactivity as fallback
- **Impact:** Directly causing users to abandon the app

### 1d. Table Visualization Consistency
- [ ] Show poker table with position badges on ALL hand decision screens (Daily Hands, Assessment, Drills)
- [ ] Currently only Assessment and Drills show the table — Daily Hands and Learn do not
- [ ] The table is the best visual in the app. Use it everywhere.

---

## PRIORITY 2: Content & Gameplay Fixes (Testers are noticing)

### 2a. Assessment Hands — HARDCODED, needs randomization
- [ ] Assessment is the same 20 hands every time — tester confirmed he's seeing repeats
- [ ] Build a dynamic assessment generator (like drills already have) that pulls from the range tables
- [ ] Keep the 9 leak categories but randomize which hands test each category
- [ ] Consider: generate a pool of 40+ spots, randomly pick 20 per session
- **Impact:** Solid players have no reason to retake the assessment right now

### 2b. Learn Quiz Questions — Also hardcoded
- [ ] Foundations quiz is same 14 questions every time
- [ ] Position quizzes are also hardcoded
- [ ] Lower priority than assessment, but should be randomized eventually
- **Note:** Drills are already random (confirmed). Daily Hands are date-seeded (correct by design).

### 2c. Spot Review — Show what the user got wrong
- [ ] After drills: no persistent review screen exists (only in-the-moment feedback)
- [ ] After assessment: review page shows correct answers but NOT the user's actual answers
- [ ] After Daily Hands: only shows color-coded grid, no individual hand review
- [ ] Fix: Show "You chose X → Correct answer was Y" with explanation in all review screens
- [ ] Infrastructure exists (user answers are stored) — just needs to be surfaced
- **Impact:** Users can't learn from mistakes without seeing what they got wrong

### 2d. Progress Tab — Needs real value
Current problems:
- [ ] All data stored in localStorage only — lost on browser/device switch
- [ ] Leak categories only populate from assessments (drills don't contribute)
- [ ] No historical trending ("am I getting better?")
- [ ] No actionable recommendations ("drill this next")
- [ ] Migrate progress data to Supabase so it persists across devices
- [ ] Add IQ trend over time (7-day, 30-day)
- [ ] Add "recommended next action" based on weakest leak category
- **Impact:** Progress page currently shows mostly zeros and "No data yet" for new users

---

## PRIORITY 3: Feedback & Polish

### 3a. Simplify Feedback Form
Current: 5 rating questions + freeform + name/email (too much friction)
- [ ] Replace with 4 simple questions:
  1. Is this your first time? (Yes / No)
  2. Did you have fun? (Meh / Yeah! / Loved it)
  3. Will you be back? (Probably not / Maybe / Definitely)
  4. Any suggestions? (freeform text box)
- [ ] Keep it under 30 seconds
- [ ] Mockup included in `wordle-poker-mockup.html`

### 3b. Settings — Wire up or simplify
- [ ] Only Drill Length currently works
- [ ] Complexity Mode (Core/Coach/Advanced) — UI only, not wired to anything
- [ ] Explanations (Plain English/Strategy/Exploit) — UI only, not wired
- [ ] Either: wire them up, or remove the "Coming soon" placeholders to avoid confusion
- [ ] Add inline explanations for each setting ("What does this do?")

### 3c. Leaderboard Fix
- [ ] Always shows rank #1 — needs to show actual "Place X of Y"

### 3d. Post-Assessment Summary
- [ ] Needs written summary with analysis and training recommendations after completing assessment

---

## PRIORITY 4: Growth & Partnerships (after UX is solid)

### App Name Decision
- [ ] Research domain availability for top 3 name candidates
- [ ] Check App Store / trademark conflicts
- [ ] Make final decision with Chuck by end of week
- [ ] Secure domain

### NPPT League Prep
- [ ] Identify who runs NPPT (owner / league operator contact)
- [ ] Draft outreach message — casual, player-to-player
- [ ] Prepare 2-minute demo walkthrough

### NPPT Integration Build (unblocks league outreach)
- [ ] Build region/venue database schema and run SQL migration
- [ ] Create league registration flow (select league → region → venues → nickname)
- [ ] Add nickname field to user profiles
- [ ] Build league-filtered leaderboards (by region, by venue)
- [ ] Test with NPPT data (13 regions, sample venues)

---

## BLOCKING / NEEDS DECISION

| Item | Owner | Status |
|------|-------|--------|
| Nav structure (5-tab redesign) | Chris + Chuck | Proposed in mockup, needs approval |
| Color direction (Wordle-light theme) | Chris + Chuck | Mockup close, needs final sign-off |
| App name | Chris + Chuck | Brainstorm done, need to pick and buy domain |
| GitHub repo visibility | Chris + Chuck | Repo is public — discuss making it private |
| NPPT contact | Chris | Need to identify decision maker |
| Monetization model | Chris + Chuck | Parking lot — revisit after league partnership |
| Mobile testing | Dev session | Schedule 30 min to test on actual phones |

---

## COMPLETED (April 3)

### Built & Deployed: Guest Session Tracking + Admin Stats Dashboard
- [x] Built `app_sessions` Supabase table — tracks every visit (guest + registered)
- [x] Built `session-tracker.ts` — device fingerprint, heartbeat every 60s, hands counter
- [x] Built new Stats tab on admin dashboard with 7-day trends
- [x] Committed and pushed to GitHub → Vercel auto-deployed

### Built: Facing-Open Range Gap Fix (Accuracy Critical)
- [x] Built automated validation script — tests 14,365 scenarios
- [x] Filled ALL 37 missing facing-open combos with GTO ranges
- [x] Re-validated: 0 CRITICAL, 0 GAP issues
- [x] Fixes Chuck's bug (BB with 66 vs BTN raise being told to fold)

### Housekeeping (April 5)
- [x] Fixed stale URL references — all docs now point to poker-trainer-ashy.vercel.app
- [x] Security audit — no exposed secrets, source maps disabled, RLS properly configured
- [x] Confirmed poker-trainer-six was an old Vercel deployment name, not another project
- [x] Investigated all tabs: Progress, Settings, Feedback, Spot Review — findings documented

---

## DAILY STANDUP CHECKLIST

1. **Check Stats tab** — how many sessions yesterday? Guests vs registered?
2. **Check Feedback tab** — any new survey responses?
3. **Play today's daily** — experience it as a user, note anything off
4. **Pick one thing to advance** — testing, league outreach, or a bug fix
5. **Update this plan** — check off what's done, add what's new

---

## REFERENCE LINKS

- **Live app:** https://poker-trainer-ashy.vercel.app
- **Admin dashboard:** https://poker-trainer-ashy.vercel.app/admin
- **GitHub repo:** https://github.com/chuckpoole-lab/poker-trainer
- **Supabase dashboard:** https://supabase.com/dashboard/project/zsougvzcbnravctjqhoa
- **NPPT website:** https://npptpoker.com
- **Color mockup:** project-management/wordle-poker-mockup.html
- **Dev log:** DEVLOG.md
- **Project plan:** PROJECT-PLAN.md

---

*Updated: April 5, 2026 — major reorganization after UX review session*
*Next review: April 7, 2026*
