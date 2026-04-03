# Poker Trainer — Work Plan & Priorities
## Week of April 3-9, 2026

---

## TODAY (April 2)

### Must Do
- [ ] Share app link with first 3-5 testers from your bar poker network
  - Send them: https://poker-trainer-six.vercel.app
  - Tell them: "Play the daily challenge for a few days, then tap the purple Feedback button"
  - Mix of casual players and competitive players
- [ ] Review PROJECT-PLAN.md with Chuck (emailed summary already)
- [ ] Discuss app naming with Chuck — pick top 3 from brainstorm list

### Quick Wins
- [ ] Play through today's daily challenge yourself — verify card bug fix is working
- [ ] Check admin dashboard Feedback tab — confirm it loads correctly
- [ ] Test onboarding flow as a new user (clear localStorage or use incognito)

---

## THIS WEEK (April 3-9)

### User Testing (Priority 1)
- [ ] Recruit 8-12 testers total (you should have 3-5 from today)
  - Target: 5 casual bar players, 4 competitive league players, 2 online qualifiers
  - Ask each to play daily for at least 3 days before giving feedback
- [ ] Check feedback dashboard daily for incoming responses
- [ ] Identify any critical bugs from tester reports — fix immediately
- [ ] After 5+ responses: review scores and freeform feedback with Chuck
  - What's the average "would recommend" score?
  - What are the top complaints?
  - What features are people asking for?

### App Name Decision (Priority 2)
- [ ] Research domain availability for top 3 name candidates
- [ ] Check App Store / trademark conflicts
- [ ] Make final decision with Chuck by end of week
- [ ] Secure domain

### NPPT League Prep (Priority 3)
- [ ] Identify who runs NPPT (owner / league operator contact)
- [ ] Draft outreach message — keep it casual, player-to-player
  - You play in the league, so this is a warm intro
  - Frame it as: "I built something for our players, want to check it out?"
- [ ] Prepare 2-minute demo walkthrough you can screen-record or show live

---

## NEXT WEEK (April 10-16)

### Based on Tester Feedback
- [ ] Fix top 3 issues identified from feedback
- [ ] Second round of testing with improvements applied
- [ ] Build any "quick win" features testers requested

### NPPT Integration Build
- [ ] Build region/venue database schema and run SQL migration
- [ ] Create league registration flow (select league → region → venues → nickname)
- [ ] Add nickname field to user profiles
- [ ] Build league-filtered leaderboards (by region, by venue)
- [ ] Test with NPPT data (13 regions, sample venues)

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

1. **Check feedback** — open admin dashboard, review any new responses
2. **Play today's daily** — experience it as a user, note anything off
3. **Pick one thing to advance** — testing, league outreach, or a bug fix
4. **Update this plan** — check off what's done, add what's new

---

## REFERENCE LINKS

- **Live app:** https://poker-trainer-six.vercel.app
- **Admin dashboard:** https://poker-trainer-six.vercel.app/admin
- **GitHub repo:** https://github.com/chuckpoole-lab/poker-trainer
- **Supabase dashboard:** https://supabase.com/dashboard/project/zsougvzcbnravctjqhoa
- **NPPT website:** https://npptpoker.com
- **Dev log:** C:\Users\rctha\Documents\poker-trainer\DEVLOG.md
- **Project plan:** C:\Users\rctha\Documents\poker-trainer\PROJECT-PLAN.md

---

*Created: April 2, 2026*
*Next review: April 5, 2026 (after first wave of tester feedback)*
