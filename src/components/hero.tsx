"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { heroStats, site } from "@/lib/data";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      <div
        className="bg-grid pointer-events-none absolute inset-0 -z-10 opacity-[0.35] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_10%,transparent_70%)]"
        aria-hidden="true"
      />
      <HeroChart />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1.5 text-xs font-medium text-muted"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          Senior Data Scientist &middot; open to select opportunities
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 max-w-3xl text-balance font-display text-4xl font-medium leading-[1.08] tracking-tight text-fg sm:text-6xl"
        >
          {site.tagline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 max-w-xl text-balance text-lg leading-relaxed text-muted"
        >
          I&rsquo;m {site.name}, a data scientist who has shipped models inside $1B+ risk
          programs and automated marketing systems reaching millions &mdash; grounded in
          statistics, built for production.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <a
            href="#projects"
            className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-fg px-6 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            View projects
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
          <a
            href="#contact"
            className="inline-flex h-11 items-center rounded-full border border-border px-6 text-sm font-medium text-fg transition-colors hover:border-border-strong hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Get in touch
          </a>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-border pt-8 sm:grid-cols-4"
        >
          {heroStats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl">
                {stat.value}
              </dd>
              <dd className="mt-1.5 text-sm leading-snug text-muted">{stat.label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>
    </section>
  );
}

function HeroChart() {
  return (
    <svg
      className="pointer-events-none absolute -right-16 top-24 -z-10 hidden h-[420px] w-[420px] text-border-strong opacity-70 sm:block lg:-right-4"
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="1">
        <line x1="20" y1="360" x2="380" y2="360" />
        <line x1="20" y1="20" x2="20" y2="360" />
      </g>
      <motion.path
        d="M20 320 C 80 300, 100 200, 150 210 S 230 120, 280 90 S 350 40, 380 20"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.4, ease: "easeInOut" }}
      />
      {[
        [20, 320],
        [70, 305],
        [120, 245],
        [150, 210],
        [200, 175],
        [250, 110],
        [280, 90],
        [330, 55],
        [380, 20],
      ].map(([cx, cy], i) => (
        <motion.circle
          key={`${cx}-${cy}`}
          cx={cx}
          cy={cy}
          r={cx === 380 ? 4.5 : 3}
          fill={cx === 380 ? "var(--accent)" : "currentColor"}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.5 + i * 0.09 }}
        />
      ))}
    </svg>
  );
}
