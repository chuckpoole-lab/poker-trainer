# Poker Trainer — Project Plan & Roadmap
## Updated April 2, 2026

---

## CURRENT STATUS: Ready for User Testing

The app is live with Play mode (Daily Hands, bonus rounds, onboarding, feedback collection) and Train mode (Learn, Assess, Drills, Progress). The scenario pipeline generates hundreds of unique hands from GTO range tables. Tester feedback system is in place.

---

## IMMEDIATE PRIORITIES (This Week)

### 1. Recruit & Launch User Testing
- Target: 8-12 testers from bar poker network
- Mix: ~5 casual bar players, ~4 competitive league players, ~2 online qualifiers
- Share app link + brief "play for a few days, then leave feedback" instructions
- Monitor feedback in admin dashboard
- Key metric: "Would you recommend this to someone in your league?" (Q4)

### 2. NPPT League Integration
Build the framework for the first league partnership.

#### NPPT Structure (from npptpoker.com):
- **13 Regions:** Palm Beach FL, Southwest FL, Central FL, Jacksonville FL, Broward/Dade FL, Treasure Coast FL, Gainesville FL, Tallahassee FL, Staten Island NY, Long Island NY, Coastal Carolina NC, New Jersey NJ, Chattanooga TN
- **Venues:** Organized by name, city, and day of week
- **Seasons:** Defined date ranges (current: Season 1, 2026)
- **Leaderboards:** Points-based rankings by region and overall
- **Events:** Weekly games, special events, championships, BPO qualifiers

#### Database Schema Needed:
- `league_regions` table: league_id, region_name, region_slug, state
- `league_venues` table: region_id, venue_name, address, city, game_days, game_times
- `user_league_profile` table: user_id, league_id, region_id, venue_ids (array), nickname, joined_at
- Update `profiles` to support multiple league memberships

#### Registration Flow:
1. User signs up / logs in
2. "Join a league" option → select league (NPPT)
3. Select your region (dropdown of NPPT regions)
4. Select your venue(s) (multi-select from venues in that region)
5. Enter your league nickname (the name that shows on BPO/online play)
6. Confirmation → player appears in league leaderboard with nickname

#### Leaderboard Enhancements:
- Filter by region within a league
- Filter by venue within a region
- Show nickname instead of display_name for league context
- "Players at your venue" section on Play home screen

### 3. League Value Proposition
Critical question: Why would a league operator partner with us?

#### Data Valuable to League Operators:
- **Player engagement metrics:** How many players are actively using the app, how often, retention rates
- **Skill distribution:** What percentage of their players are beginners vs intermediate vs advanced — helps them design better tournament structures
- **Regional activity:** Which regions/venues have the most engaged players — identifies growth opportunities and dead zones
- **Player retention correlation:** Do players who use the trainer attend more live events? (This is the killer metric)
- **New player pipeline:** How many new players discover the league through the app
- **Content engagement:** Which training modules are most popular — tells them what their players want to learn

#### How Adoption Improves Player Retention & Participation:
- **Beginners stay longer:** The #1 reason casual players quit leagues is feeling lost. Onboarding + daily challenges build confidence
- **Social hook:** Shareable daily scores create conversation at the table ("Did you get today's daily right?")
- **League identity:** Branded leaderboards make players feel part of something bigger than one Tuesday night game
- **Skill development:** Players who improve keep playing. Players who don't improve stop showing up
- **Venue discovery:** New players can find venues near them through the app — drives foot traffic

#### Partnership Model (to discuss):
- Free tier: League gets listed, players can affiliate, basic leaderboard
- Premium tier: Branded app experience, detailed analytics dashboard, custom tournaments
- Revenue share: If/when app monetizes, league partners get a cut of their players' subscriptions

### 4. App Naming
The app needs a name before we approach leagues. Current working title: "Poker Trainer"

#### Naming Criteria:
- Short, memorable, easy to say at a poker table
- Available as a domain (.com or .app)
- Not already a poker product
- Works for both casual and serious audiences
- Should suggest "practice" or "improvement" without being intimidating

#### Name Brainstorm (to discuss with Chuck):
- PokerPulse — daily engagement, always alive
- FeltIQ — poker table + intelligence
- PokerReps — like gym reps, practice makes better
- TableSmart — smart decisions at the table
- HandCheck — quick, action-oriented
- DailyFelt — daily practice on the felt
- PokerDrip — steady improvement, drip by drip
- SharkSchool — aspirational but fun
- CardSense — developing intuition
- FoldOrFire — the core decision

---

## SHORT TERM (Next 2-4 Weeks)

### App Development
- [ ] Build NPPT region/venue database and registration flow
- [ ] Add nickname field to league profile
- [ ] League-filtered leaderboards (by region, by venue)
- [ ] Survival Mode (arcade high-score game)
- [ ] Mobile responsiveness testing and fixes
- [ ] Integrate hand logger into Train mode with Supabase persistence
- [ ] Wire Complexity Mode and Explanation toggles in settings

### League Partnership
- [ ] Finalize app name and secure domain
- [ ] Build NPPT pitch deck / one-pager
- [ ] Identify NPPT decision maker and make contact
- [ ] Prepare demo with NPPT branding applied

### User Testing
- [ ] Collect and analyze tester feedback (target: 20+ survey responses)
- [ ] Identify top 3 improvement priorities from feedback
- [ ] Fix critical issues surfaced by testers
- [ ] Second round of testing with improvements applied

---

## MEDIUM TERM (1-2 Months)

### Training Content
- [ ] Deploy Raise Sizing module (content prototyped)
- [ ] Deploy 3-Betting Strategy module (content prototyped)
- [ ] Deploy Facing Limpers module (content prototyped)
- [ ] Build ICM and Bubble Play module (grinder tier)
- [ ] Build Postflop Fundamentals module (grinder tier)

### Platform
- [ ] Multi-league support (player can belong to multiple leagues)
- [ ] League admin dashboard (separate from app admin)
- [ ] Push notifications for daily challenge reminders
- [ ] Progressive module unlocking (competency gates)


---

## LONGER TERM (3-6 Months)

### Advanced Training Content
- [ ] Stack-Aware Tournament Strategy module
- [ ] Range Construction module (think in ranges, not hands)
- [ ] Exploitative Adjustments module (deviate based on opponent tendencies)
- [ ] Multi-Table Tournament Pacing module
- [ ] Postflop decision trees (continuation betting, board textures)

### Product & Growth
- [ ] Finalize monetization model (freemium, subscription tiers)
- [ ] Second league partnership (after NPPT proves the model)
- [ ] App Store / Play Store consideration (PWA vs native)
- [ ] Sound effects and haptic feedback
- [ ] "What Should I Do?" quick lookup tool
- [ ] Social features: challenge a friend, share hands
- [ ] Content creator / influencer partnerships in bar poker space

### League Platform
- [ ] League operator analytics dashboard
- [ ] Automated season tracking synced with league calendars
- [ ] Tournament structure recommendations based on player skill data
- [ ] New player discovery pipeline (app → nearest venue → first game)

---

## PARKING LOT (Ideas to revisit)

- Survival Mode (arcade-style endurance game)
- Hand logger for live sessions (Train mode)
- AI-powered hand analysis (paste a hand history, get coaching)
- Video content integration (short clips explaining concepts)
- Heads-up challenge mode (1v1 competitive)
- Seasonal tournaments within the app
- Integration with BPO/WSOP qualification tracking
- Dealer training module (separate audience, same platform)
- Fantasy poker league integration

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

---

## METRICS TO TRACK

### User Engagement
- Daily active users (DAU) and DAU/MAU ratio
- Daily challenge completion rate
- Average hands played per session (daily + bonus)
- Streak length distribution
- Onboarding completion rate vs skip rate

### Learning Effectiveness
- Poker IQ progression over time
- Accuracy improvement by category (position play, stack depth, facing opens)
- Which coaching tips get the most "aha" moments (tracked by correct answers on retry)

### League Partnership
- Players per league
- Active rate within league (% of registered players who play daily)
- League referral rate (players who join because of league affiliation)
- Venue coverage (% of league venues with active players)

### Business
- Tester NPS (Q4 survey question is effectively NPS)
- Feature request themes (what do users want most?)
- Conversion from guest to signed-in user
- Email capture rate from feedback form

---

*Last updated: April 2, 2026*
*Next review: After first round of tester feedback (target: April 9, 2026)*
