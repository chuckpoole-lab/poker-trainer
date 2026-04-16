# Poker Trainer — Project Plan & Roadmap
## Updated April 15, 2026

---

## CURRENT STATUS: UX Overhaul Phase (with hardening in parallel)

The app is live and in user testing. Retention remains the #1 problem — people visit but don't come back. The UX vision is set (two player paths — casual vs serious — warm Wordle-inspired design) and awaiting Chuck's sign-off before the 5-tab nav / palette swap begins.

While UX is blocked on review, the stability work has advanced. As of 2026-04-15 the Play mode is fully on Eastern Time (daily reset no longer flips at 8pm ET), Play-mode integrity is instrumented (any cards-vs-handCode mismatch auto-flags to Supabase with full scenario context), home-screen stats refresh live after a daily challenge, the admin dashboard now surfaces per-user Play-mode activity, and the `flagged_hands` Supabase migration is applied (instrumentation is wired end-to-end). The Facing Limpers and 3-Betting modules are live with their own Learn pages and Train launchers.

Next step: get Chuck's sign-off on the UX vision, then begin the palette + nav implementation. In parallel, watch `flagged_hands` for `AUTO_INTEGRITY_FAIL:` rows — that's the evidence trail for the recurring A♦3♦-vs-AA mismatch bug.

**UX Vision Document:** `Poker-Trainer-UX-Vision-v2.html` (sent to Chuck for review)

---

## THE TWO-PATH VISION

### Core Insight
Not every player wants the same thing. A casual bar player wants fun and a reason to come back. A grinder wants focused, efficient training. The app serves both — but not by forcing one through the other's experience.

### First Visit: The Fork
New users see a welcome screen with one question:
> **How do you play poker?**
> - "I play for fun" → Casual path
> - "I'm here to train" → Serious path

This sets their **player mode** (stored in profile, changeable in settings).

### Path A: Casual Player ("I play for fun")
- **Home:** Play Home — Daily Hands front and center, streak/IQ/rank, Learn the Basics, Quick Drill
- **Tone:** Fun, encouraging, light. "Nice streak!" not "Your early position discipline needs work."
- **Does NOT see:** Skills Assessment, leak analysis, position drills, player profile

### Path B: Serious Player ("I'm here to train")
- **Home:** Training Hub — Daily Hands (one option, not the whole screen), Skills Assessment, Fix My Leaks, Position Drills, Short Stack Jam/Fold
- **Tone:** Direct, efficient, coaching. "Your UTG discipline dropped 8% this week — drill it."
- **Gets:** Player Profile with style analysis, Leak Tracking with trends, Training Recommendations, Detailed Spot Review

### The Bridge: Daily Hands
Both paths share the daily challenge — 5 hands, same for everyone, date-seeded. This is the Wordle mechanic that brings people back every day.

---

## IMMEDIATE PRIORITIES (Next 1-2 Weeks)

### Priority 1: UX Overhaul (Retention is the #1 problem)

#### 1a. Visual Redesign — Warm Wordle-inspired palette
- Cream background (#faf8f5), felt green accents (#4a7c59), gold highlights (#e8a848)
- Replace dark charcoal theme across all screens
- Keep poker table green felt and brown rail — extend that warmth everywhere
- Mockup approved direction: `wordle-poker-mockup.html`

#### 1b. Navigation Redesign — 5 tabs, clear purpose
| Tab | Casual Player | Serious Player |
|-----|--------------|----------------|
| Home | Play Home (daily challenge, basics, fun) | Training Hub (focused session launcher) |
| Play | Daily Hands (the Wordle moment) | Daily Hands (same) |
| Train | Hidden or simplified | Assessment, Drills, Leak Fix, Position Drills |
| Progress | Streak, IQ, simple stats | Full leak breakdown, player profile, trends |
| More | Settings, Feedback, About | Settings, Feedback, Coach (admin), About |

#### 1c. Session Timeout Fix
- **DONE:** visibilitychange listener + refreshSession() in auth-context.tsx
- Needs: commit, push, deploy to Vercel

#### 1d. Table Visualization Consistency
- Show poker table on ALL hand decision screens (Daily Hands currently missing it)

### Priority 2: Content & Gameplay Fixes

#### 2a. Assessment Randomization (CRITICAL)
- Assessment is same 20 hands every time — testers notice repeats
- Build dynamic generator from range tables (like drills already have)
- Pool of 40+ spots, randomly pick 20 per session

#### 2b. Spot Review — Show what users got wrong
- After drills/assessment/daily: show "You chose X → Correct answer was Y" with explanation
- Infrastructure exists (answers stored) — just needs UI

#### 2c. Progress Tab — Real value
- Migrate from localStorage to Supabase
- Add IQ trend over time (7-day, 30-day)
- Add leak breakdown from drills (not just assessments)
- Add "recommended next action" based on weakest category

### Priority 3: Feedback & Polish

#### 3a. Simplified Feedback Form
Replace 5-question survey with:
1. Is this your first time? (Yes / No)
2. Did you have fun? (Meh / Yeah! / Loved it)
3. Will you be back? (Probably not / Maybe / Definitely)
4. Any suggestions? (freeform)

#### 3b. Settings — Wire up or remove placeholders
#### 3c. Leaderboard — Fix rank always showing #1
#### 3d. Post-Assessment Summary with analysis and recommendations

### Priority 4: Growth & Partnerships (after UX is solid)
- App name decision + domain purchase
- NPPT league outreach
- NPPT integration build (regions, venues, leaderboards)

---

## BLOCKING / NEEDS DECISION (Chris + Chuck)

| Item | Status |
|------|--------|
| Two-path UX vision (casual vs serious) | UX doc sent to Chuck — needs review |
| Nav structure (5-tab redesign) | Proposed in mockup, needs approval |
| Color direction (warm Wordle-light theme) | Mockup close, needs final sign-off |
| Player mode switching mechanics | When/how can casual upgrade to serious? |
| Guest default path | Probably casual — needs confirmation |
| Assessment gating for casual players | Hidden vs blocked? |
| Progress data → Supabase migration timing | Needed for serious player features |
| Dynamic assessment validation | Automated check that generated hands have unambiguous correct answers |
| App name | Brainstorm done, need to pick and buy domain |
| GitHub repo visibility | Repo is public — discuss making private |
| NPPT contact | Need to identify decision maker |

---

## SHORT TERM (Next 2-4 Weeks)

### App Development
- [ ] Implement warm color palette across all screens
- [ ] Build 5-tab navigation with two-path home screens
- [ ] Build welcome screen with player mode fork
- [ ] Dynamic assessment generator
- [ ] Spot review UI for drills, assessment, and daily hands
- [ ] Progress tab Supabase migration + trends
- [ ] Player profile and leak tracking for serious players
- [ ] Mobile responsiveness testing and fixes

### League Partnership
- [ ] Finalize app name and secure domain
- [ ] Build NPPT pitch deck / one-pager
- [ ] Identify NPPT decision maker and make contact
- [ ] Build region/venue database schema

---

## MEDIUM TERM (1-2 Months)

### Training Content
- [ ] Deploy Raise Sizing module
- [ ] Deploy 3-Betting Strategy module
- [ ] Deploy Facing Limpers module
- [ ] Build ICM and Bubble Play module
- [ ] Build Postflop Fundamentals module

### Platform
- [ ] Multi-league support
- [ ] League admin dashboard
- [ ] Push notifications for daily challenge reminders
- [ ] Progressive module unlocking

---

## LONGER TERM (3-6 Months)

### Advanced Training
- [ ] Stack-Aware Tournament Strategy
- [ ] Range Construction
- [ ] Exploitative Adjustments
- [ ] Multi-Table Tournament Pacing
- [ ] Postflop decision trees

### Product & Growth
- [ ] Finalize monetization model
- [ ] Second league partnership
- [ ] App Store / Play Store consideration
- [ ] Sound effects and haptic feedback
- [ ] Social features: challenge a friend, share hands

---

## KEY DECISIONS LOG

| Date | Decision | Reasoning |
|------|----------|-----------|
| Mar 25 | Target bar poker players, not online grinders | Biggest competitor is "no tool at all" — not GTO Wizard |
| Mar 29 | Two-audience strategy (Play + Train) | 85% casual players need entertainment that teaches |
| Mar 31 | "How do you poker?" front door | One question determines entire UX — no forms |
| Apr 1 | Dynamic scenario pipeline over handwritten content | Scales to hundreds of hands from existing range data |
| Apr 1 | Friendly coaching tone, not "leak detected" | "Not quite — here's the play" keeps players engaged |
| Apr 2 | Consistent Fold/Raise/All-in choices | Beginners need predictable UI, not context-switching |
| Apr 2 | League-first growth strategy | Leagues are distribution channels with built-in audiences |
| **Apr 5** | **Two-path UX: casual vs serious home screens** | **Different users want fundamentally different experiences** |
| **Apr 5** | **Warm Wordle-inspired visual design** | **Dark theme felt cold and uninviting — hurting retention** |
| **Apr 5** | **5-tab navigation replacing 8-tab** | **Too many tabs confused users; Home/Play were duplicates** |
| **Apr 5** | **Three-tier scoring: Best/Acceptable/Leak** | **Binary right/wrong discourages beginners; acceptable plays exist** |

---

## METRICS TO TRACK

### User Engagement
- Daily active users (DAU) and DAU/MAU ratio
- Daily challenge completion rate
- Average hands played per session
- Streak length distribution
- Return rate (% of users who come back day 2, day 7)

### Learning Effectiveness
- Poker IQ progression over time
- Accuracy improvement by category
- Leak category trends (7-day, 30-day)

### League Partnership
- Players per league
- Active rate within league
- Venue coverage

### Business
- Tester NPS
- Feature request themes
- Conversion from guest to signed-in user

---

*Last updated: April 5, 2026*
*Next review: April 7, 2026 — after Chuck reviews UX vision doc*
