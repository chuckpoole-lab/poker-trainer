# Poker Trainer — Development Log

**Project:** Poker Trainer for Bar Poker Players
**Repo:** github.com/chuckpoole-lab/poker-trainer
**Stack:** Next.js 16 + Supabase + Vercel
**Owners:** Chuck Poole & Chris Thatcher
**Started:** March 24, 2026

---

## v0.1.0 — Foundation (March 24, 2026)

**Initial commit and deployment**
- Created Next.js app with TypeScript
- Deployed to Vercel with static export
- Built poker table UI with "Grandmaster's Lounge" dark design system
- Target audience: live tournament poker players

---

## v0.2.0 — Training Engine (March 25, 2026)

**Core learning and assessment system**
- Design system tokens and CSS variables
- UI component library: Card, Badge, Button, Icon, ProgressBar, DonutChart, StepCard, Modal, Skeleton
- Context-aware action buttons (Fold/Raise/Call/All-in per spot type)
- Learn module: Poker Foundations (14 questions — positions, terminology, strategy concepts)
- Learn module: Position Mastery (28 questions across Early, Middle, Late, Blinds)
- Assessment: 12 hand decision spots with full explanations
- Drills: Configurable drill sessions with module filtering
- Per-action "Why?" explanation system — explains why each wrong answer is wrong
- Progress tracking with localStorage persistence
- Results page with DonutChart scoring visualization
- Study plan generator based on assessment results

---

## v0.3.0 — Assessment Expansion (March 25, 2026)

**Deeper content and range data**
- Expanded assessment from 12 to 20 spots (added 8 facing-open scenarios)
- GTO range tables: 5 stack depths x 5 positions for opening ranges
- Facing-open ranges for 16 position/stack combinations
- Dynamic spot generator engine for infinite drill variety
- Explanation templates for dynamically generated hands
- Position quizzes expanded from 3 to 7 questions each

---

## v0.4.0 — Auth & Admin (March 26, 2026)

**Multi-user support and administration**
- Google OAuth sign-in via Supabase Auth
- Guest mode with localStorage fallback
- Cloud persistence: assessment results, drill history, streaks
- User profiles with auto-creation on signup
- Admin dashboard (Coach tab) — visible only to Chuck and Chris
- User stats: drills completed, spots practiced, accuracy, streak, assessment score
- Admin toggle: promote/demote admin status
- Row Level Security (RLS) on all tables — users see only their own data
- Guest-to-cloud data migration on sign-in
- Fixed auth session hang with navigator.locks bypass

---

## v0.5.0 — League Branding (March 28, 2026)

**White-label system for poker leagues**
- League management in admin dashboard (CRUD)
- Brand color auto-scraping from league websites
- Logo upload and storage via Supabase Storage
- League-specific welcome text, copyright, and website links
- Subdomain-based league detection (e.g., nppt.pokertrain.app)
- LeagueBrand component renders league or default branding throughout app
- Supabase tables: leagues, league RLS policies, storage bucket

---

## v0.6.0 — The Pivot: Play Mode (March 29-31, 2026)

**Two-audience strategy based on user research**

Key insight: 85% of bar poker players are casual (play for fun, won't study).
15% are improvers (want to get better, will use tools).

Decision: Build two experiences in one app.
- Play mode (casual): gamified daily challenges, bright/warm aesthetic
- Train mode (grinders): hand logger, drills, coaching — existing dark aesthetic

**What was built:**
- "How do you poker?" front door — mode selector on first visit
- Mode preference saved to profile and localStorage, auto-redirect on return
- Play mode home screen: stat pills (streak, IQ, rank), daily challenge CTA
- Daily Hands: 5-hand game flow with animated card reveals
- Coaching tips on every hand (friendly poker-buddy tone)
- Results screen with shareable Wordle-style score card
- Copy-to-clipboard share text with emoji squares
- Play (🃏) added to bottom nav bar
- Supabase tables: daily_challenge_results, hand_log_sessions, hand_log_entries, user_badges, survival_scores
- Leaderboard function (get_league_leaderboard) with league filtering
- Profile columns: preferred_mode, poker_iq, league_slug
- Play storage service: daily results, streaks, IQ, leaderboard, badges, hand logger
- Guest fallback for all Play mode features

**Bug fixes:**
- Playing card contrast: white cards with bold red/black suits
- Streak mismatch: results screen was double-incrementing
- Daily challenge UX: "Come back tomorrow" when today is done

---

## v0.7.0 — Scenario Pipeline (April 1, 2026)

**Dynamic hand generation replaces hardcoded content**
- Play scenario generator converts spot generator output to Play mode format
- Date-seeded daily hands: everyone gets same 5 hands per day (Wordle mechanic)
- Unlimited "Keep Playing" bonus rounds after daily 5
- Seeded RNG (Mulberry32) for deterministic daily generation
- Card parsing: hand codes → visual playing cards with random suits
- Situation text builder: position-aware descriptions
- Coaching tip templates dynamically reference correct hand code
- Hundreds of unique scenarios from 20 templates x 169 hands x 5 stack depths

**Position logic fixes (caught by Chris during testing):**
- UTG: "You're first to act" instead of "everyone folds to you"
- Facing-open: seat-gap awareness (CO raises, BTN acts — no one folded between them)
- Foundation for future limper and 3-bet scenario narration

---

## v0.8.0 — Onboarding & Feedback (April 1, 2026)

**New player onboarding flow:**
- Welcome screen: "Would you like a quick tour of the poker table positions?"
- Visual table map: oval table with color-coded position badges
  - Red = Blinds (tough spots)
  - Amber = Early/Mid (play tight)
  - Green = Late (profit seats)
- Position cards: abbreviation, full name, description, basic approach
- Key takeaway box reinforcing position = hand selection width
- 7-question quiz testing what they learned
- Skip option at every step for experienced players
- "Learn the Basics" refresher card on Play home screen
- Onboarding flag: shows once for new players, available anytime after

**Tester feedback system:**
- Welcome toast on first visit: "Thanks for testing our app"
- Floating purple "Feedback" button on Play home screen
- 5-question survey (1 = worst, 5 = best):
  1. How fun was the Daily Hands challenge?
  2. How easy was the app to use?
  3. How helpful were the coaching tips?
  4. How likely to recommend to someone in your league?
  5. How likely to come back and play tomorrow?
- Freeform text field for open feedback
- Optional name + email capture for launch notifications
- Feedback persists to Supabase (tester_feedback table)
- Admin dashboard: Feedback tab with averages and individual responses
- Color-coded scores: green (4-5), yellow (3), red (1-2)

---

## v0.9.0 — Polish & Preparation (April 2, 2026)

**UX improvements:**
- Standardized Play mode choices: Fold/Raise/All-in (unopened), Fold/Call/All-in (facing open)
- Removed poker jargon from button labels ("Raise to 2.5x" → "Raise")
- "Coming soon" labels on Complexity Mode and Explanations settings
- Exit button added to assessment page (was trapping users)
- Fixed home redirect hang when auth state loading
- Nav bar: tapping active page no longer re-mounts component

**"What's New & Coming Soon" section on Play home:**
- New features list (green checkmarks)
- Coming soon list (purple circles): Survival Mode, raise sizing, 3-betting, facing limpers, league leaderboards, hand logger
- Feature request input with Send button — saves to Supabase feedback table

**Prototype training modules (not deployed):**
- Raise Sizing Strategy: standard opens, isolating limpers, overbetting, stack-depth awareness
- 3-Betting Strategy: value vs bluff 3-bets, sizing, adjusting to raiser position
- Facing Limpers: isolation raises, sizing formula, hand selection, when NOT to isolate
- Each module: concise strategy overview → drill hands
- Interactive prototype built and reviewed

---

## Parking Lot (features discussed, not yet built)

- Survival Mode (arcade-style — how many hands can you survive?)
- Advanced grinder modules: ICM/bubble play, postflop fundamentals, stack-aware strategy, range construction, exploitative adjustments, MTT pacing
- Hand logger integration in Train mode with persistent storage
- League-branded leaderboards for distribution partnerships
- Sound effects and haptic feedback (multimedia tier 1)
- Progressive module unlocking (competency gates)
- "What Should I Do?" quick lookup tool

---

## Stats as of April 2, 2026

- **36 commits** across 9 days
- **74 files** changed
- **10,114 lines** added
- **4 SQL migrations** (schema, leagues, daily hands, feedback)
- **6 Supabase tables** + 36+ RLS policies
- **20 assessment spots** with full per-action explanations
- **GTO range tables** for 5 stack depths x 5 positions
- **Dynamic scenario generator** producing hundreds of unique hands
- **Two complete user experiences** (Play + Train)
- **Auth, admin, league branding, feedback collection** — all production
- **Live at:** poker-trainer-six.vercel.app
