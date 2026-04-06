# Poker Trainer — User Experience Vision
## Two Paths, One App
### Drafted April 5, 2026

---

## The Core Insight

Not every player wants the same thing. A casual bar player who shows up Tuesday nights wants to have fun and get a little better. A grinder who's studying ranges and plugging leaks wants focused, efficient training. The app needs to serve both — but not by forcing one through the other's experience.

---

## First Visit: The Fork

When a new user opens the app for the first time, they see a **welcome screen** that does two things:

1. Briefly explains what the app is ("Get better at poker, 5 minutes at a time")
2. Asks one question that forks their experience:

> **How do you play poker?**
>
> 🎲 **I play for fun** — I want to get better at my weekly game
>
> 🎯 **I'm here to train** — I want to study and fix my leaks

This choice sets their **player mode** (stored in profile, changeable in settings). It determines which home screen they see and how the app talks to them.

---

## Path A: The Casual Player ("I play for fun")

### Home Screen: Play Home
This is the Wordle screen. Bright, inviting, low pressure.

- **Daily Hands** — front and center, the main event. "5 hands, 60 seconds, how good are you?" This is their reason to come back every day.
- **Streak + IQ + Rank** — gamification that makes them feel progress without homework
- **Learn the Basics** — position fundamentals, terminology, "what does UTG mean?" Lives here because casual players are the ones who need it.
- **Quick Drill** — if they want to play more after the daily, easy access to a casual drill
- **What's New** — feature announcements, coming soon teasers

### What casual players DON'T see (unless they go looking):
- Skills Assessment
- Leak analysis
- Position-specific drills
- Advanced strategy concepts
- Player profile / style analysis

### The tone:
Fun, encouraging, light. "Nice streak!" not "Your early position discipline needs work."

---

## Path B: The Serious Player ("I'm here to train")

### Home Screen: Training Hub
This is the "I have 10-15 minutes, what should I work on?" screen.

- **Daily Hands** — still here, everyone gets this. But it's one option, not the whole screen.
- **Skills Assessment** — "Find your leaks" (~10 min). Dynamic hands, not the same 20 every time.
- **Fix My Leaks** — data-driven. Uses their assessment and drill history to recommend what to work on. "Your early position discipline is weak — drill 15 hands from UTG/UTG+1."
- **Position Drills** — pick a position, drill it. UTG, HJ, CO, BTN, SB, BB.
- **Short Stack Jam/Fold** — 10bb and 15bb push-or-fold scenarios. Specific, focused.
- **Advanced Concepts** — beyond the basics. 3-bet defense, squeeze spots, ICM basics. (Future content)

### What serious players get that casual players don't:
- **Player Profile** — built from their activity data. Style analysis: "You tend to play too loose from early position." "You're strong in blind defense but leak chips facing 3-bets."
- **Leak Tracking** — visual breakdown of their weakest categories with trend over time
- **Training Recommendations** — "Based on your last 50 hands, here's what to work on today"
- **Detailed Spot Review** — after every drill, see what you got wrong, what you picked vs. the correct answer, and why

### The tone:
Direct, efficient, coaching. "Your UTG discipline dropped 8% this week — drill it."

---

## The Bridge: Daily Hands

Daily Hands is the one thing both paths share. It's the Wordle mechanic — the daily reason to open the app. Same 5 hands for everyone, same day. Leaderboard. Streak. Sharable results.

**Critical:** These hands must be dynamically generated (already are, date-seeded). But they currently don't show the poker table visualization. They should — consistency matters.

---

## Data-Driven Player Profile (Serious Players)

### What we track:
- Every hand decision (position, stack depth, action taken, correct action)
- Accuracy by position (UTG through BB)
- Accuracy by stack depth (10bb, 15bb, 20bb, 30bb)
- Accuracy by scenario type (unopened, facing open, facing 3-bet)
- Accuracy by category (the 9 leak categories)
- Trends over time (7-day, 30-day)

### What we surface:
- **Play Style Summary:** "Tight-passive from early position, loose-aggressive on the button" — derived from their decision patterns
- **Leak Map:** Visual grid showing strong vs. weak spots by position × stack depth
- **Top 3 Leaks:** The three categories where they lose the most equity, with specific drill recommendations
- **Improvement Trend:** "Your overall accuracy improved from 62% to 74% this month"

### What we DON'T do for casual players:
- No homework. No "you should drill this." No guilt. Just the daily challenge, the streak, and gentle encouragement.

---

## Dynamic Hands: What Needs to Change

### Assessment (currently hardcoded — MUST fix)
- Same 20 hands every time → testers notice repeats
- Build dynamic assessment generator using the existing range tables and spot generator
- Keep the 9 leak categories as the testing framework
- Generate a pool of 40+ spots, randomly select 20 per session
- Ensure position/stack/scenario logic is flawless — every generated hand must have a clear correct answer backed by the GTO ranges
- Validate: no hand should ever have an ambiguous "correct" answer

### Drills (already dynamic — good)
- Already use Math.random() generator — different every time
- No changes needed to generation logic

### Daily Hands (already dynamic — good)
- Date-seeded, same for everyone per day
- Need to add poker table visualization to match drills/assessment

### Learn Quizzes (hardcoded — lower priority)
- Same questions every time, but these are educational content, not assessment
- Randomization is nice-to-have, not critical

---

## Navigation: Revised

### Bottom Nav (5 tabs):
| Tab | Casual Player Sees | Serious Player Sees |
|-----|-------------------|-------------------|
| **Home** | Play Home (daily challenge, basics, fun) | Training Hub (focused session launcher) |
| **Play** | Daily Hands (the Wordle moment) | Daily Hands (same) |
| **Train** | Hidden or simplified | Assessment, Drills, Leak Fix, Position Drills |
| **Progress** | Streak, IQ, simple stats | Full leak breakdown, player profile, trends |
| **More** | Settings, Feedback, About | Settings, Feedback, Coach (admin), About |

**Alternative:** Maybe only 4 tabs for casual (Home, Play, Progress, More) and 5 for serious (Home, Play, Train, Progress, More). Train tab only appears for serious players.

---

## Needs Decision (Chris + Chuck)

1. **Player mode switching** — can a casual player upgrade to serious? Where? Settings? A prompt after they hit a streak milestone?
2. **Guest experience** — which path do guests default to? Probably casual.
3. **Assessment gating** — should casual players be blocked from assessment, or just not shown it prominently?
4. **Profile data** — currently in localStorage. Needs to move to Supabase for serious players. When?
5. **Dynamic assessment quality** — who validates that generated hands are unambiguous? Need an automated validation step.

---

*This document captures the product vision discussed April 5, 2026. It should be reviewed with Chuck before implementation begins.*
