/**
 * Training Module Content — Prototypes for future Train mode modules
 * 
 * Each module follows the pattern:
 * 1. Strategy overview (shown first time, available as refresher)
 * 2. Key concepts with examples
 * 3. Drill hands that test the specific skill
 * 
 * NOT DEPLOYED — prototype content for review
 */

// ============================================================
// MODULE 1: RAISE SIZING STRATEGY
// ============================================================

export const RAISE_SIZING_MODULE = {
  id: 'raise_sizing',
  title: 'Raise Sizing',
  subtitle: 'How much to bet and why it matters',
  icon: '📐',
  
  overview: {
    title: 'Why Raise Size Matters',
    sections: [
      {
        heading: 'The basics',
        body: `When you raise, the amount you bet sends a message. A small raise says "I want to play cheap." A big raise says "I mean business." The right size depends on your position, your stack, and what happened before you.`,
      },
      {
        heading: 'Standard opening sizes',
        body: `With a deep stack (25-30 big blinds or more), a standard open raise is 2 to 2.5 times the big blind. This is enough to put pressure on the blinds without risking too many chips. As your stack gets shorter (15 big blinds or less), raising small stops making sense because you can't fold if someone re-raises — at that point, you either shove all-in or fold.`,
      },
      {
        heading: 'Raising over limpers',
        body: `When someone just calls the big blind (limps) ahead of you, you need to raise bigger to push them out. The standard formula is your normal raise size plus one big blind for each limper. So if you normally raise to 2.5x and two players limped, raise to 4.5x. If you raise too small over limpers, everyone calls and you end up in a messy pot with a mediocre hand.`,
      },
      {
        heading: 'When to go big',
        body: `Overbetting — raising much larger than normal — is a weapon for specific situations. When you have a very strong hand and a wet board (lots of draws possible), a big bet charges opponents the maximum to continue. When you are bluffing on a scary board, a big bet makes it harder for opponents to call. Overbetting is an advanced skill, but understanding that bet size is a tool you control is the first step.`,
      },
      {
        heading: 'The key takeaway',
        body: `Raise size is not random. Smaller raises when you open from late position (you want action), bigger raises when isolating limpers (you want them out), and all-in when your stack is too short for raise-fold poker. Every chip you put in should have a purpose.`,
      },
    ],
  },

  // Example drill scenarios for raise sizing
  drillExamples: [
    {
      situation: 'You are on the Button with A9 suited. Everyone folds to you. You have 28 big blinds.',
      question: 'What size should you raise?',
      choices: ['2x the big blind', '2.5x the big blind', '4x the big blind', 'All-in'],
      correct: 1,
      tip: 'With 28 big blinds on the Button, a standard 2.5x raise is perfect. It puts enough pressure on the blinds to fold weak hands but keeps the pot small if someone plays back at you. No need to go bigger — you only need two players to fold.',
    },
    {
      situation: 'You are in the Cutoff with KQ offsuit. Two players limped before you. You have 25 big blinds.',
      question: 'What size should you raise?',
      choices: ['2.5x the big blind', '4.5x the big blind', '6x the big blind', 'All-in'],
      correct: 1,
      tip: 'With two limpers, your standard 2.5x is not enough — they already showed they want to see a flop cheaply. Raise to 4.5x (your normal 2.5x plus 1x per limper). This prices out the weak hands that limped and isolates you against one opponent at most.',
    },
    {
      situation: 'You are Under the Gun with pocket Jacks. You have 12 big blinds.',
      question: 'What size should you raise?',
      choices: ['2.5x the big blind', '3x the big blind', 'All-in', 'Limp in'],
      correct: 2,
      tip: 'At 12 big blinds, a standard raise commits almost 25% of your stack. If someone re-raises, you are stuck — JJ is too strong to fold but you have already wasted chips. Shoving all-in solves this problem: you maximize fold equity and get your strong hand all-in before the flop. Below about 15 big blinds, simplify to shove-or-fold.',
    },
  ],
};

// ============================================================
// MODULE 2: 3-BETTING STRATEGY
// ============================================================

export const THREE_BETTING_MODULE = {
  id: 'three_betting',
  title: '3-Betting Strategy',
  subtitle: 'When to re-raise and why',
  icon: '🔥',

  overview: {
    title: 'The Power of the 3-Bet',
    sections: [
      {
        heading: 'What is a 3-bet?',
        body: `A 3-bet is a re-raise. The blinds are the first "bet," the initial raise is the second, and your re-raise is the third. When someone raises and you raise again, you are 3-betting. It is one of the most powerful plays in poker because it puts enormous pressure on the original raiser.`,
      },
      {
        heading: 'Why 3-bet?',
        body: `Three reasons. First, for value — when you have a premium hand (AA, KK, QQ, AK), you want to build a bigger pot. Second, as a bluff — when you 3-bet with a hand like A5 suited, you can win the pot right there if the raiser folds. Third, for isolation — when you want to play heads-up against the raiser instead of in a multiway pot.`,
      },
      {
        heading: 'Value 3-bets vs bluff 3-bets',
        body: `Your value 3-bets are the easy ones: AA, KK, QQ, AK — hands strong enough to play a big pot. Your bluff 3-bets are trickier. The best bluff 3-bet hands are suited aces like A5s, A4s, A3s. Why? Because the ace "blocks" your opponent from having AA or AK (making it less likely they have a premium hand), and if they call, your suited ace has backup equity — you can make a flush or a straight.`,
      },
      {
        heading: '3-bet sizing',
        body: `A standard 3-bet is about 3 times the original raise. If someone opens to 2.5 big blinds, you 3-bet to about 7-8 big blinds. From out of position (the blinds), go a little bigger — about 3.5 times — because you want to discourage calls from a player who will have position on you after the flop. At shorter stacks (20 big blinds or less), skip the small 3-bet and just shove all-in.`,
      },
      {
        heading: 'Adjust to the raiser',
        body: `Who opened matters. A raise from UTG (early position) means a strong range — tighten your 3-bet range and lean toward value. A raise from the Button (late position) means a wide range — you can 3-bet more bluffs because they are raising weak hands. The wider the opener, the more you can 3-bet them.`,
      },
      {
        heading: 'The key takeaway',
        body: `3-betting is not just for premium hands. A balanced 3-bet range includes strong hands for value and suited blockers for bluffs. The goal is to make the raiser's life difficult — they never know if your 3-bet is aces or a well-chosen bluff.`,
      },
    ],
  },

  drillExamples: [
    {
      situation: 'The Cutoff raises to 2.5x. You are on the Button with A5 suited and 25 big blinds.',
      question: 'What should you do?',
      choices: ['Fold', 'Call', '3-bet to 7x', 'All-in'],
      correct: 3,
      tip: 'A5 suited is a textbook 3-bet hand at 25 big blinds. The ace blocks AA and AK, the hand has backup equity with flush and wheel straight potential, and at 25bb a 3-bet commits too much of your stack — just shove. The CO folds a large chunk of their opening range to your all-in.',
    },
    {
      situation: 'UTG raises to 2.5x. You are in the Hijack with KJ offsuit and 30 big blinds.',
      question: 'What should you do?',
      choices: ['Fold', 'Call', '3-bet to 7x', 'All-in'],
      correct: 0,
      tip: 'KJo against a UTG open is a fold. UTG opens a tight range — AK, AQ, AJ, KQ, big pairs — and KJ is dominated by most of those hands. 3-betting here gets you into trouble because UTG is unlikely to fold premium hands and unlikely to be bluffing from first position. Discipline saves chips.',
    },
    {
      situation: 'The Button raises to 2.5x. You are in the Big Blind with QQ and 28 big blinds.',
      question: 'What should you do?',
      choices: ['Fold', 'Call', '3-bet to 9x', 'All-in'],
      correct: 2,
      tip: 'QQ in the BB against a Button open is a clear 3-bet for value. The Button opens wide (35%+ of hands), so QQ is way ahead of their range. 3-bet to about 9x (slightly bigger from out of position) to build the pot and charge draws. At 28bb you have enough stack to 3-bet without committing to all-in.',
    },
  ],
};

// ============================================================
// MODULE 3: FACING LIMPERS
// ============================================================

export const FACING_LIMPERS_MODULE = {
  id: 'facing_limpers',
  title: 'Facing Limpers',
  subtitle: 'Exploit the most common play in bar poker',
  icon: '🎯',

  overview: {
    title: 'Punishing the Limp',
    sections: [
      {
        heading: 'Why limpers are good for you',
        body: `Limping — just calling the big blind instead of raising — is the most common play in bar poker and one of the weakest. When someone limps, they are saying "I have a hand I want to see a flop with, but it is not strong enough to raise." This is an opportunity for you. A well-timed raise over limpers prints chips.`,
      },
      {
        heading: 'The isolation raise',
        body: `When one or more players limp, your goal is to "isolate" — raise big enough to push out everyone except maybe one weak player. You want to play heads-up, in position, against someone who already showed weakness. This is one of the most profitable situations in poker and it happens constantly in bar games.`,
      },
      {
        heading: 'How much to raise',
        body: `The standard formula: your normal raise size plus one big blind for each limper. If you normally open to 2.5x and there are two limpers, raise to 4.5x. If there are three limpers, raise to 5.5x. The extra big blinds per limper account for the dead money in the pot and the fact that limpers call wider than they should — you need to price them out.`,
      },
      {
        heading: 'Which hands to isolate with',
        body: `You do not need a premium hand to raise over limpers. Any hand you would normally open from your position works. In fact, from late position with limpers, you can raise even wider than your normal opening range because there is extra dead money in the pot. Strong aces, suited broadways, pocket pairs, and suited connectors are all great isolating hands. The hand matters less than the position and the initiative.`,
      },
      {
        heading: 'When NOT to isolate',
        body: `Do not isolate from early position with a marginal hand — you still have many players behind you who could wake up with a real hand. Do not isolate when you are short-stacked (under 15 big blinds) unless you are willing to go all-in — the raise-fold problem is worse with limpers because the pot is bigger. And if the table is full of calling stations who will not fold to any raise, consider just playing your strong hands for value rather than trying to thin the field.`,
      },
      {
        heading: 'The key takeaway',
        body: `Limpers are handing you an opportunity. When you see a limp, your default thought should be "can I raise here?" If you have position and a playable hand, the answer is almost always yes. Size your raise to isolate, play heads-up in position, and take the pot down.`,
      },
    ],
  },

  drillExamples: [
    {
      situation: 'Two players limp. You are on the Button with AT suited and 25 big blinds.',
      question: 'What should you do?',
      choices: ['Fold', 'Limp behind', 'Raise to 4.5x', 'All-in'],
      correct: 2,
      tip: 'AT suited on the Button with two limpers is a textbook isolation raise. You have position, a strong hand, and two weak players who showed weakness by limping. Raise to 4.5x (2.5x + 1x per limper) to thin the field. You want to play this heads-up against one limper, not in a 4-way pot.',
    },
    {
      situation: 'One player limps from early position. You are in the Hijack with 77 and 22 big blinds.',
      question: 'What should you do?',
      choices: ['Fold', 'Limp behind', 'Raise to 3.5x', 'All-in'],
      correct: 2,
      tip: 'Pocket 7s with one limper from the Hijack is a clear isolation raise. Raise to 3.5x (2.5x + 1x for the limper). Your pair is ahead of most limping ranges, you have position on the limper, and if you hit a set you can win a big pot. Limping behind invites more players and reduces your edge.',
    },
    {
      situation: 'Three players limp. You are in the Cutoff with K8 offsuit and 20 big blinds.',
      question: 'What should you do?',
      choices: ['Fold', 'Limp behind', 'Raise to 5.5x', 'All-in'],
      correct: 0,
      tip: 'K8 offsuit is too weak to isolate three limpers. A raise to 5.5x commits over 25% of your stack, and K8o plays poorly if someone calls — you will often make top pair with a bad kicker and lose a big pot. With three limpers, the pot is attractive but you need a stronger hand to justify the investment. Wait for a better spot.',
    },
  ],
};
