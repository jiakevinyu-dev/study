# Jia (Kevin) Yu — Personal Portfolio

A production-ready personal portfolio built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS v4**.

## Sections

- **Hero** — value proposition, quick stats, and an animated SVG chart motif.
- **About** — bio, current role, and education.
- **Experience** — a timeline of roles from SDET/software engineering through data science.
- **Projects** — a grid of featured work, described at a level safe to share publicly.
- **Skills** — grouped technology tags.
- **Contact** — direct links (email, phone, LinkedIn) and an accessible form that opens a pre-filled email.

## Stack

- Next.js 16 (App Router, Turbopack build)
- TypeScript
- Tailwind CSS v4 (CSS-based theme, class-based dark mode)
- Framer Motion for scroll-reveal and micro-interactions
- `next/font` (Fraunces, Inter, IBM Plex Mono) and `next/og` for the generated favicon

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Content

All resume-derived content (experience, projects, skills, education, contact/social links) lives in a single
typed file: [`src/lib/data.ts`](./src/lib/data.ts). Update it there and every section picks up the change —
no need to touch component markup for text edits. Social handles are marked in that file as best-effort
guesses; double-check `site.social` before shipping.

The résumé served from the "Resume" button is at [`public/resume.pdf`](./public/resume.pdf).

## Fantasy Football Redraft War Room

A dynamic draft-board tool at [`/fantasy`](./src/app/fantasy/page.tsx) for a 12-team superflex, PPR,
no-TE-premium redraft league — built as a live model, not a static list:

- **Sleeper sync** ([`src/lib/fantasy/sleeper.ts`](./src/lib/fantasy/sleeper.ts)) — pulls the real player pool
  (names, teams, age, live injury designations) and, optionally, a real league's roster slots and scoring
  straight from Sleeper's public API, entirely client-side.
- **Positional scarcity** ([`src/lib/fantasy/scarcity.ts`](./src/lib/fantasy/scarcity.ts)) — a roster-construction
  simulation (dedicated slots → FLEX → SUPERFLEX) finds each position's replacement level dynamically, so
  superflex correctly inflates QB value on its own rather than via a hardcoded multiplier.
- **Injury risk** ([`src/lib/fantasy/injury-risk.ts`](./src/lib/fantasy/injury-risk.ts)) — a transparent, documented
  0–100 heuristic (current designation + position/age curve + optional missed-games history), not a black box.
- **Strength of schedule** ([`src/lib/fantasy/sos.ts`](./src/lib/fantasy/sos.ts)) — computed only from schedule and
  defense-vs-position data you sync or import; nothing is shipped pre-loaded, since this repo was built without
  outbound network access to verify a real current-season schedule.
- **Scoring engine** ([`src/lib/fantasy/scoring.ts`](./src/lib/fantasy/scoring.ts)) — every league setting (PPR
  value, TE premium, roster slots, playoff weeks) is a live control in the UI; the whole board recomputes on
  every change.

CSV import (with downloadable templates) covers ADP/rankings, full stat projections, schedule, defense ratings,
and injury history for anyone who'd rather bring their own data than sync Sleeper. See the in-app
**Methodology & Data Sources** panel for exactly how each number is computed.

## Q-Q Plot toolkit

This repo also contains a small, independent Python utility for Quantile-Quantile plots
([`qq_plot.py`](./qq_plot.py)), unrelated to the portfolio site:

```bash
pip install -r requirements.txt
python qq_plot.py
```
