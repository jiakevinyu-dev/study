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

## Q-Q Plot toolkit

This repo also contains a small, independent Python utility for Quantile-Quantile plots
([`qq_plot.py`](./qq_plot.py)), unrelated to the portfolio site:

```bash
pip install -r requirements.txt
python qq_plot.py
```
