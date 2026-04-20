# Bar Poker Research — Homework for the Module Rebuild

Prepared: 2026-04-16 (Chris asleep, asked for homework before the deep dive)
Purpose: Ground the Facing Limpers + 3-Betting rebuild in how bar poker actually
plays, not in GTO heads-up ranges. Chris's working thesis (his own words):

> "They all like cheap flops, can't fold top pair and never met an ace they
> didn't love. They can't spell GTO let alone play GTO ranges. We are going
> to have to loosen everything up and we are going to need better context in
> the hands."

Everything below is organized around the three specific problems Chris flagged
when he asked to hide the modules:

1. **Ranges were wrong on almost every hand** → the underlying range charts
   are GTO-shaped, not bar-poker-shaped. Need to loosen value ranges and
   basically eliminate bluffs against a player pool that won't fold.
2. **Action descriptions didn't match the recommended action** → the explanation
   templates don't give the player the *why* in terms they recognize ("you're
   not going to fold out a station with A7o by betting, so just check and let
   him keep putting money in with worse"). They read like GTO commentary on
   a GTO solution. Need a bar-poker voice.
3. **Single-limper assumption** → the generator almost always models 1 limper
   when in a real bar game, one limper means 2-3 limpers. Multi-way changes
   the math on iso-sizing, hand selection, and postflop strategy.

---

## Part 1 — The bar poker player pool

### What bar poker players actually do

The consistent picture across every source: low-stakes / no-money-on-the-line
tournaments (freerolls, bar leagues, home games) attract a player pool that is
**loose, passive, and call-happy**. Specific tendencies worth encoding:

- They limp a massive range. Fish routinely limp *any Ace, any suited hand,
  any connector*, small pairs, broadways, even ace-rag offsuit. Some players
  limp every two suited cards. The first limper's range is especially wide
  and weak, though a small percentage of the time it's a slowplayed premium.
- They call too much preflop and postflop. Calling stations "call with a wide
  range and rarely fold" — they'll float with middle pair, bottom pair, ace-high,
  gutshots, runner-runner draws.
- They overvalue top pair, especially top-pair-with-any-ace-kicker. They also
  overvalue ace-high hands and pocket pairs regardless of board texture.
- They bluff infrequently. When they raise or 3-bet, it's almost always value.
- In free/league formats the variance is even higher — players treat it as a
  crapshoot, especially early, because there's no money on the line.

### What this means for our module content

- **Value-bet relentlessly, bluff almost never.** This is the single biggest
  exploit and every source agrees. Our current explanations that recommend
  "balanced 3-bet bluffing" or "c-bet as bluff on dry boards" are actively
  wrong for this pool.
- **Size up for value.** Stations call big bets with marginal hands; we leave
  money on the table by using GTO-sized value bets.
- **Don't try to fold them off top pair.** The explanation text needs to stop
  saying things like "apply pressure to fold out their range" — it's not going
  to happen.
- **Tighten up calling 3-bets and big raises.** When this pool raises, it's a
  made hand. GTO "defend wide vs 3-bet" does not apply.
- **Prefer in-position multiway pots with speculative hands.** That's where our
  edge comes from — set mining, suited connectors, suited aces for flushes.
  Not from fold equity.

---

## Part 2 — Facing limpers: the real picture

### Sizing with multiple limpers (live/bar standard)

The **live-game** formula, consistent across every strategy source:

```
In position: raise to 4bb + 1bb per limper
Out of position: raise to 5bb + 1bb per limper
```

Examples (bar poker, blinds at 100/200, 4bb = 800):

- 1 limper, we're on the BTN: raise to 5bb (1000)
- 2 limpers, we're on the BTN: raise to 6bb (1200)
- 3 limpers, we're on the BTN: raise to 7bb (1400)
- 2 limpers, we're in the SB: raise to 7bb (5bb + 2bb)

Online the default is smaller (3bb + 1bb per limper) but our users play live.
**Our current generator appears to be producing scenarios that don't match this
sizing** — Chris, double-check when we pick this up.

### Iso-raise hand selection (loosened for bar poker)

The GTO textbook approach ("iso with the top 15% of hands") is too tight for
bar poker because (a) limpers fold less than solvers predict, so we get called
and see flops multiway, and (b) our edge is big enough postflop that we can
afford to widen value hands and add semi-speculative hands that flop well.

Tentative loosened iso-raise ranges (in position, 1 limper, eff 30bb+):

- **Always iso:** 77+, AJo+, ATs+, KQ, KJs, QJs
- **Usually iso (widen vs tighter limper):** 55+, A9s+, A8s, KTs+, QTs+, JTs,
  T9s, KQo
- **Fold/overlimp:** everything else

With 2+ limpers, tighten the iso range but **widen the overlimp range** (see
below). Don't iso into 3 callers with 99 — you'll get called everywhere, flop
unimproved on an overcard most of the time, and lose the pot.

### Overlimping candidates (this is where we're probably missing coverage)

When 2+ players have limped and we're in late position with a speculative hand,
overlimping is often the best play. The explicit list from multiple sources:

- Suited connectors 54s through T9s (play for straights/flushes multiway)
- Suited one-gappers (64s, 75s, 86s, 97s, T8s, J9s)
- Suited aces A2s-A8s (flush draws; some straights)
- Small/mid pairs 22-88 that aren't strong enough to iso (set-mine; need the
  **15/25/35 rule** — need 15x+ effective stacks vs the biggest caller to make
  set-mining profitable)
- Suited kings K9s-KTs in spots where a raise gets 3-bet too often

Overlimping is **positionally sensitive**: much better in late position (fewer
players left who can squeeze). In early position behind 1-2 limpers, fold these
speculatives instead.

### Multi-way math (the thing Chris called out specifically)

Chris's exact feedback: *"where there is one limper there are more."* In bar
poker the modal scenario is 2-3 limpers, not 1. The generator needs to model:

- 2 limpers (most common): iso-raise to 6bb, or overlimp behind
- 3 limpers: iso-raise to 7bb *only* with premiums; otherwise overlimp or fold
- 4+ limpers ("limp fest"): tighten iso to QQ+/AK; overlimp more liberally

Multi-way postflop is a different game from heads-up. Key shifts:

- **Check more as the preflop raiser** in 3+ way pots. Our c-bet frequency
  should drop, especially with air. Pure bluff c-bets "are ineffective multiway
  — you need stronger value bets, and stronger bluffs, with solid drawing
  equity except on the river."
- **Smaller c-bet sizing** when we do bet — 25-33% pot, rarely >50%. This
  capitalizes on our perceived range strength and doesn't bloat pots we'll
  often lose.
- **Pot share shrinks with more players.** 3-way avg pot share is 35-40%;
  4-5 way is 20-25%. So even with top pair, we need to be more cautious about
  stacking off.
- **Tighten defensive thresholds.** In multiway you don't need to defend nearly
  as wide — tighter calls, stronger betting range.
- **Straightforward, "ABC poker" wins.** Make hands, bet them for value, don't
  bluff multiway.

---

## Part 3 — 3-betting in bar poker

Chris flagged this module alongside Facing Limpers. The situation is the same
shape: the GTO solver's 3-bet strategy assumes balanced opponents who defend
and 4-bet. Bar poker opponents don't do that.

### Opening the 3-bet (us 3-betting)

Against the typical bar poker pool:

- **Cut 3-bet bluffs almost entirely.** A bar poker player isn't going to fold
  AJ to a 3-bet, so "balanced 3-bet with A5s as a bluff" loses money. Keep
  3-bets value-heavy: JJ+, AQs+, AKo.
- **Widen value where feasible.** Against a loose opener, add TT, AJs, KQs,
  maybe even 99 if they're very loose. "The more call-happy they are, the
  stronger you should 3-bet."
- **Size up.** Small 3-bets (3x) don't get folds from this pool anyway and
  give them correct odds to call speculatively. Go 4-4.5x in position,
  5x+ out of position. In limped pots, 3-bet to ~12-15bb.

### Facing the 3-bet (them 3-betting us)

This is where the current module is probably the most wrong, because the solver
says "defend wide against 3-bets" and that's catastrophically bad advice here.

- **Fold a lot.** Most low-stakes players don't 3-bet bluff. A 3-bet = a made
  hand. Multiple sources: "folding more often than GTO recommends is highly
  profitable."
- **4-bet only with QQ+/AK, maybe JJ against a truly maniac 3-bettor.**
- **Calling ranges tighten sharply.** Pocket pairs for set-mining (if stacks
  are deep enough — 15/25/35 rule), suited broadways IP, but ditch the "call
  with KTs/ATo" stuff.
- **Positional effect is huge.** OOP vs a 3-bet in bar poker, fold almost
  everything that isn't a premium. IP, give yourself a little more room with
  set-mining pairs.

### Short-stacked 3-bet dynamics (bar poker tournaments)

Bar poker tournaments run short-stacked fast because of the clock. At 15-20bb
the 3-bet decision is really a 3-bet-shove or fold decision:

- 15bb or less: Nash push/fold applies, but opponents call way tighter than
  Nash, so **shove wider** than Nash says.
- 20-27bb: mix of raise/fold, raise/call, limp, and open-shove ranges.
- If they only call our SB shove with aces, shove near-100%.
- The training app should probably have a dedicated short-stack module at some
  point — bar poker players spend a lot of time in that band.

---

## Part 4 — Better hand context (the explanation-template rewrite)

Chris said the "description of the action was off." Reading the commit message
and the modules they're tied to, I think the issue is that our explanation
templates are GTO-flavored prose about mixed strategies and balance, when what
a bar-poker player needs to hear is the *exploitative why* in their own
language.

Template voice to avoid:
> "By raising, we deny equity to the caller's defending range and extract
> thin value from weak hands in a balanced line."

Template voice to adopt (bar poker register):
> "This table will call a raise here with A7o, suited junk, and small pairs.
> That's fine — raising puts chips in with you as the favorite, and they won't
> fold. Don't try to bluff the flop against three callers; just bet your pairs
> for value and check the rest."

Concrete context bits we should include in the explanation for every hand:

- **What the opponent range looks like here** ("at your table, a limp is
  usually A-rag, suited trash, or a small pair")
- **Why GTO doesn't apply** when relevant ("the solver folds out the 3-bet
  caller's range, but your table won't fold")
- **What to expect postflop** ("if you iso and get called, expect 2-3 way pots;
  bet small on good boards, check on bad ones")
- **The stack-depth implication** ("you're 22bb deep — this is really a
  shove-or-fold decision, not a 3-bet-call decision")
- **The specific exploit** ("your fold equity is nearly zero, so don't bluff;
  your value bets can be bigger than normal")

The explanation should make a player walking into a bar league for the first
time immediately recognize the situation, not feel like they're reading a
solver output.

---

## Part 5 — Punch list for the module rebuild

Mapping everything above back to WORK-PLAN.md Priority 1e so the next session
can move fast:

### (A) Range audit
- Rebuild iso-raise, overlimp, and fold ranges per position × stack-depth band
  using loosened bar-poker values (Part 2 above). The whole matrix — 96 cells
  for Facing Limpers (multiple positions × multiple limper counts), 144 cells
  for 3-Betting (position × opener type × stack depth).
- Treat GTO ranges as the *starting point* and apply consistent exploitative
  widening (value) and tightening (bluff) adjustments.
- Build the ranges around Chris's three heuristics: cheap-flops-wanted,
  can't-fold-top-pair, loves-every-ace.

### (B) Explanation template audit
- Rewrite the `getActionExplanation` outputs and any static templates in the
  bar-poker voice described in Part 4.
- Remove any phrasing that leans on GTO concepts (balance, mixed strategies,
  denying equity) unless we explain them in plain language.
- Add the five context bits to every template output (opponent range, why GTO
  doesn't apply, postflop expectation, stack-depth implication, specific exploit).

### (C) Multi-way limper modeling
- `play-scenario-generator.ts` and `spot-generator.ts` need to produce multi-
  limper scenarios with realistic frequency: 1 limper ~25%, 2 limpers ~45%,
  3 limpers ~25%, 4+ limpers ~5%.
- Iso-raise sizing must follow the 4bb + 1bb/limper live formula (OOP: 5bb +
  1bb/limper). Verify the generator outputs sizes that match.
- Add overlimp as a recommended action for the speculative-hand cells (SC,
  small pairs not strong enough to iso, suited Ax).
- Add a "how many limpers?" input to the explanation template so the text can
  reference it ("With 3 limpers already in, iso-raising with 99 gets called
  everywhere and plays poorly...").

### (D) 3-bet rebuild
- Us-3-betting: value-heavy, cut bluffs, size up. JJ+/AQs+ as baseline, widen
  only vs very loose opens.
- Facing-3-bets: fold way more than GTO. 4-bet QQ+/AK. Call only with
  set-mining pairs IP when 15/25/35 allows.
- Explanations should call out the pool-level "they don't 3-bet bluff" fact
  explicitly.

### (E) Re-enablement checklist (before the flag comes back off)
1. All 96 + 144 range cells audited and loosened
2. All explanation templates rewritten in bar-poker voice
3. Generator produces realistic multi-limp distribution
4. Iso-sizing matches 4bb+1bb/limper live formula
5. Facing-limp overlimp option available for speculative hands
6. 3-bet defense tightened; 3-bet open narrowed to value-heavy
7. Build clean, 24 routes
8. Chris and Chuck manually play through 30+ daily hands in each module and
   confirm ranges/explanations feel like bar poker
9. Remove the `ADMIN_ONLY_*` sets in learn/train/drills/play pages
10. Remove the `adminMode` collapse branches in play-scenario-generator and
    spot-generator (or keep them with the logic flipped to the new normal)

---

## Sources

Bar poker / low-stakes player pool:
- [Adjusting to Loose-Passive Players — CardsChat](https://www.casino.us/cardschat/cash-games-11/adjusting-loose-passive-players-560394/)
- [Top Adjustments for Beating Calling Stations — PokerCoaching](https://pokercoaching.com/blog/calling-stations-in-poker/)
- [Calling Stations In Poker (Loose-Passive) — betandbeat](https://betandbeat.com/poker/strategy/playing-styles/loose-passive/)
- [Five Ways to Beat Calling Stations in Your Home Game — PokerNews](https://www.pokernews.com/strategy/five-ways-to-beat-calling-stations-in-your-home-game-26167.htm)
- [How to Beat $1/$2 No-Limit Holdem — PokerListings](https://www.pokerlistings.com/poker-strategies/cash-game-nl-holdem/ultimate-guide-to-crushing-live-12)
- [The Loose/Passive Fish — Lay The Odds](https://www.laytheodds.com/online-poker/articles/the-loosepassive-fish/)
- [Free poker tournaments — why bother? — Poker.org](https://www.poker.org/poker-strategy/free-poker-tournaments-why-bother-aHt6K9v2Q07j/)

Iso-raising and limper strategy:
- [How to Maximize Your Winnings Versus Multiple Limpers — Upswing Poker](https://upswingpoker.com/vs-multiple-limpers/)
- [Iso-Raising in Poker: All You Need to Know — 888poker](https://www.888poker.com/magazine/strategy/iso-raising-poker-all-you-need-know)
- [How to Play Against Limpers in Poker Tournaments — PokerNews](https://www.pokernews.com/strategy/how-to-play-against-limpers-in-live-poker-tournaments-50800.htm)
- [What To Raise Against Many Limpers Preflop? — Red Chip Poker](https://redchippoker.com/raising-preflop-limp-fest-pots/)
- [How to Handle Loose-Passive Limpers — GTO Wizard](https://blog.gtowizard.com/how-to-handle-loose-passive-limpers/)
- [Which Hands Should I Limp Behind With? — SplitSuit](https://www.splitsuit.com/what-should-i-limp-behind-with)
- [Over-Limping Poker Strategy — SoMuchPoker](https://somuchpoker.com/poker-term/mastering-over-limping-poker-strategic-guide)

Multiway pots:
- [10 Tips for Multiway Pots in Poker — GTO Wizard](https://blog.gtowizard.com/10-tips-multiway-pots-in-poker/)
- [Monkey in the Middle: 3-Way Pot Heuristics — GTO Wizard](https://blog.gtowizard.com/monkey-in-the-middle-3-way-pot-heuristics/)
- [Multi-Way vs. Heads-Up Pots — PokerNews](https://www.pokernews.com/strategy/multi-way-vs-heads-up-pots-five-key-strategic-differences-23528.htm)
- [Limped Pots: How to Adjust Your Strategy — Upswing Poker](https://upswingpoker.com/limped-pots-postflop-strategy/)
- [How To Play Multi-Way Pots — PokerCoaching](https://pokercoaching.com/blog/how-to-play-multi-way-pots-at-the-poker-table/)

Set mining / speculative hands:
- [Poker set mining and the 15/25/35 rule — Mike Fowlds](https://mikefowlds.medium.com/poker-set-mining-for-fun-and-profit-and-the-rule-of-15-25-35-bf0f8ba85eff)
- [5 Mistakes with Suited Connectors — Upswing Poker](https://upswingpoker.com/suited-connectors-poker-strategy/)
- [Debunking Myths About Implied Odds — Thinking Poker](https://www.thinkingpoker.net/articles/debunking-myths-implied-odds/)
- [How to Play Low Pocket Pairs in Cash Games — Upswing Poker](https://upswingpoker.com/low-pocket-pairs-how-to-play/)

3-betting / exploitative:
- [3-Bet Preflop Strategy & Range Charts — Upswing Poker](https://upswingpoker.com/3-bet-strategy-aggressive-preflop/)
- [The 5 Most Profitable Preflop Adjustments for Small-Stakes — PokerCoaching](https://pokercoaching.com/blog/most-profitable-preflop-adjustments-for-small-stakes-poker/)
- [Exploit: Battle-Tested Tactics to Crush Live Poker — Upswing Poker](https://upswingpoker.com/crush-live-poker-games-exploitative-tactics/)
- [GTO vs Exploitative Play — Upswing Poker](https://upswingpoker.com/gto-vs-exploitative-play-game-theory-optimal-strategy/)
- [The Low-Stakes Poker Playbook — Red Chip Poker](https://redchippoker.com/low-stakes-poker-playbook/)

Short-stack tournament:
- [Open-Raising with a Short Stack in Tournaments — Upswing Poker](https://upswingpoker.com/open-raising-with-a-short-stack-tournaments/)
- [10 Push Fold Charts for Poker Tournaments — Upswing Poker](https://upswingpoker.com/push-fold-tournament-strategy-charts/)
- [Shoving vs Min-Raising With 15BB — Red Chip Poker](https://redchippoker.com/shoving-vs-min-raising-with-15bb/)
- [How To Play GTO When Short Stacked — PokerCoaching](https://pokercoaching.com/blog/how-to-play-gto-when-short-stacked-in-poker-tournaments/)

Top pair / ace-high calling:
- [Low Stakes MTT Strategy — Pokerology](https://www.pokerology.com/poker/strategy/low-stakes/)
- [How to Play Top Pair Top Kicker — Upswing Poker](https://upswingpoker.com/top-pair-top-kicker/)
- [When Should You Call With Just Ace-High? — Upswing Poker](https://upswingpoker.com/when-to-call-with-ace-high/)
- [Combating Calling Stations — Jonathan Little](https://jonathanlittlepoker.com/combatingcallingstations/)
