# Poker Trainer — Work Plan & Priorities
## Week of April 3-9, 2026

---

## TODAY (April 3) — COMPLETED

### Built & Deployed: Guest Session Tracking + Admin Stats Dashboard
- [x] Synced repo from GitHub (pulled Chuck's range-tables update)
- [x] Built `app_sessions` Supabase table — tracks every visit (guest + registered)
- [x] Built `session-tracker.ts` — device fingerprint, heartbeat every 60s, hands counter
- [x] Wired tracking into app layout (auto-starts on load) and Play page (counts hands)
- [x] Built new **Stats tab** on admin dashboard — first tab you see when you open Coach
  - Sessions today (total, registered, guests) with trend vs. yesterday
  - Hands played (total + avg per session)
  - Average session duration
  - Returning visitors
  - Play vs. Train mode breakdown
  - 7-day trend chart with daily breakdown
- [x] Ran SQL migration on Supabase (table + RLS policies + 2 helper functions)
- [x] Committed and pushed to GitHub → Vercel auto-deployed

### Built: Facing-Open Range Gap Fix (Accuracy Critical)
- [x] Built automated validation script (scripts/validate-ranges.py) — tests 14,365 scenarios
- [x] Identified 37 of 52 facing-open position/stack combos were missing (6,253 hands defaulting to FOLD)
- [x] Filled ALL 37 missing combos with GTO ranges — BB defense, SB defense, all positions
  - UTG opens → HJ, CO, BTN, SB, BB (4 stacks each)
  - HJ opens → CO, BTN, SB, BB (4 stacks each)
  - CO opens → SB, BB (4 stacks each) + BTN 30bb
  - BTN opens → BB 15bb, SB 30bb
  - SB opens → BB (4 stacks each)
- [x] Fixed AQo/99 jam ranges at 15bb for several spots
- [x] Re-validated: 0 CRITICAL, 0 GAP issues. Validation report saved to project-management folder
- [x] This directly fixes Chuck's bug (BB with 66 vs BTN raise being told to fold)

### Known Issues (logged, not yet fixed)
- [ ] Leaderboard always shows rank #1 — needs to show "Place X of Y"
- [ ] No Poker IQ trend visualization on Play home screen
- [ ] Post-assessment needs written summary with analysis and training recommendations
- [ ] Table visualization inconsistency in drills (needs design discussion — Option A: drop tables, Option B: enhanced visuals)
- [ ] Remaining 76 heuristic warnings in validation — mostly borderline 15bb jam-or-fold debates (not user-facing bugs)

### Still Open from April 2
- [ ] Share app link with first 3-5 testers (word of mouth + social media)
- [ ] Review PROJECT-PLAN.md with Chuck
- [ ] Discuss app naming with Chuck — pick top 3 from brainstorm list

---

## THIS WEEK (April 3-9)

### User Testing (Priority 1)
- [ ] Recruit 8-12 testers total
  - Target: 5 casual bar players, 4 competitive league players, 2 online qualifiers
  - Ask each to play daily for at least 3 days before giving feedback
- [ ] Check Stats tab daily — monitor guest vs. registered traffic
- [ ] Check Feedback tab daily for incoming responses
- [ ] Identify any critical bugs from tester reports — fix immediately
- [ ] After 5+ responses: review scores and freeform feedback with Chuck

### App Name Decision (Priority 2)
- [ ] Research domain availability for top 3 name candidates
- [ ] Check App Store / trademark conflicts
- [ ] Make final decision with Chuck by end of week
- [ ] Secure domain

### NPPT League Prep (Priority 3)
- [ ] Identify who runs NPPT (owner / league operator contact)
- [ ] Draft outreach message — casual, player-to-player
- [ ] Prepare 2-minute demo walkthrough

---

## NEXT WEEK (April 10-16)

### NPPT Integration Build (Priority 1 — unblocks league outreach)
- [ ] Build region/venue database schema and run SQL migration
- [ ] Create league registration flow (select league → region → venues → nickname)
- [ ] Add nickname field to user profiles
- [ ] Build league-filtered leaderboards (by region, by venue)
- [ ] Test with NPPT data (13 regions, sample venues)

### Based on Tester Feedback
- [ ] Fix top 3 issues identified from feedback
- [ ] Second round of testing with improvements applied
- [ ] Build any "quick win" features testers requested

### League Partnership
- [ ] Initial conversation with NPPT operator
- [ ] If positive: schedule demo or share app link with NPPT branding applied
- [ ] Prepare one-pager on value to leagues (use PROJECT-PLAN.md content)

---

## BLOCKING / NEEDS DECISION

| Item | Owner | Status |
|------|-------|--------|
| App name | Chris + Chuck | Brainstorm done, need to pick and buy domain |
| NPPT contact | Chris | Need to identify decision maker |
| Monetization model | Chris + Chuck | Parking lot — revisit after league partnership |
| Mobile testing | Dev session | Schedule 30 min to test on actual phones |

---

## DAILY STANDUP CHECKLIST

Use this every morning to stay focused:

1. **Check Stats tab** — how many sessions yesterday? Guests vs registered?
2. **Check Feedback tab** — any new survey responses?
3. **Play today's daily** — experience it as a user, note anything off
4. **Pick one thing to advance** — testing, league outreach, or a bug fix
5. **Update this plan** — check off what's done, add what's new

---

## REFERENCE LINKS

- **Live app:** https://poker-trainer-six.vercel.app
- **Admin dashboard:** https://poker-trainer-six.vercel.app/admin
- **GitHub repo:** https://github.com/chuckpoole-lab/poker-trainer
- **Supabase dashboard:** https://supabase.com/dashboard/project/zsougvzcbnravctjqhoa
- **NPPT website:** https://npptpoker.com
- **Dev log:** DEVLOG.md
- **Project plan:** PROJECT-PLAN.md

---

*Updated: April 3, 2026 (evening — after range gap fix)*
*Next review: April 5, 2026 (after first wave of tester feedback)*
