# UX Principles — Lava Leap (game + landing + future apps)

Standing design charter. Every new screen, feature, or app in this project is
built and reviewed against this document. The goal is software people enjoy
returning to because it is useful, transparent, and satisfying — never because
it manipulates them. Helping users accomplish their goals beats maximizing
time spent.

## Core philosophy

Every interaction should answer four questions for the user:

1. What just happened?
2. Why does it matter?
3. What should I do next?
4. How close am I to my goal?

The interface always reduces uncertainty.

## First-time experience (the first 60 seconds)

- Demonstrate real value inside the first minute.
- Let the user complete one meaningful task, show visible progress,
  celebrate it, and suggest the next logical step.
- No lengthy onboarding before the user experiences value.

## Progressive onboarding

Guide, don't lecture: perform action → show result → explain why it mattered →
unlock the next capability. Reveal advanced features only when the user is
likely to benefit.

## Progress & achievements

- Users always know how far they've come and what remains (completion,
  milestones, history, recently completed work).
- Reward meaningful accomplishments, not routine clicks. Each achievement
  states what was accomplished, why it matters, and what to try next.

## Daily motivation

Optional, relevant, easy to skip: daily challenge, tip of the day,
personalized suggestion. Never guilt-trip or fabricate urgency.

## Smart feedback

Every action gets an appropriate response: success animation, helpful
confirmation, inline error explanation, progress update, or time estimate.
Feedback clarifies the outcome — it doesn't just decorate.

## Empty & loading states

- Empty states teach what comes next (create first X, view example, learn how
  it works).
- Loading states inform: current step, estimated progress, useful tip —
  not a bare spinner.

## Microinteractions

Subtle animations that communicate state changes (hover, press, progress,
success). They support usability; they never distract. All animation honors
`prefers-reduced-motion`.

## Reduce cognitive load

One primary action per screen. Clear hierarchy, consistent spacing, plain
language, minimal unnecessary choices, progressive disclosure, contextual help.

## Trust — hard requirements

- Show autosave status, last-updated time, and data sources where applicable.
- Explain privacy plainly; state AI limitations; provide undo when possible.
- **Never**: dark patterns, hidden actions, misleading urgency, confusing
  defaults, fabricated data (e.g. fake leaderboards), or unverifiable claims.

## Accessibility — WCAG 2.2 AA minimum

Keyboard navigation, screen-reader support, high-contrast compatibility,
text scaling, reduced-motion preference, visible focus indicators. Core
requirement, not an afterthought.

## Performance

Fast initial render, optimistic UI where appropriate, lazy loading, efficient
caching, responsive animation, graceful degradation offline or when
dependencies are missing.

## Delight

Occasional and subtle, never interrupting work: milestone celebrations,
encouraging copy, positive reinforcement after hard tasks.

## Success metrics

Judge the experience by user success, not stickiness: time to first successful
outcome, task completion rate, return rate of productive users, feature
adoption, satisfaction, accessibility compliance, performance benchmarks,
error recovery rate.

## Final review gate

Before any screen ships, ask:

- Is this easy to understand?
- Is the next step obvious?
- Does this reduce effort?
- Does this increase confidence?
- Does this help users reach their goals?

If any answer is "no," redesign before shipping.
