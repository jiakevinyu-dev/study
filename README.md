# Jia (Kevin) Yu — Personal Portfolio

A production-ready personal portfolio built with **Next.js (App Router)**, **TypeScript**, and **Tailwind CSS v4**.

## Sections

- **Hero** — value proposition, quick stats, and an animated SVG chart motif.
- **About** — bio, current role, and education.
- **Experience** — a timeline of roles from SDET/software engineering through data science.
- **Projects** — a grid of featured work (enterprise engagements described at a public-safe level, plus an open-source project linking to real source).
- **Skills** — grouped technology tags.
- **Contact** — direct links (email, phone, LinkedIn, GitHub) and an accessible form that opens a pre-filled email.

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
([`qq_plot.py`](./qq_plot.py)) — see the "Statistical Distribution Analysis Toolkit" project card on the
site, or run it directly:

```bash
pip install -r requirements.txt
python qq_plot.py
```
