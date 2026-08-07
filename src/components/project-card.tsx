"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Lock } from "lucide-react";
import type { Project } from "@/lib/data";
import { cn } from "@/lib/utils";

export function ProjectCard({ project, className }: { project: Project; className?: string }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group flex h-full flex-col rounded-2xl border border-border bg-bg-elevated p-6 transition-colors hover:border-border-strong sm:p-7",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-accent">{project.org}</p>
          <h3 className="mt-2 text-balance font-display text-xl font-medium leading-snug text-fg sm:text-2xl">
            {project.title}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2 pt-1">
          {project.confidential && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted" title="Enterprise project — code not publicly available">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Private
            </span>
          )}
        </div>
      </div>

      <p className="mt-4 flex-1 text-sm leading-relaxed text-muted sm:text-base">
        {project.description}
      </p>

      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-3">
        {project.metrics.map((m) => (
          <div key={m.label}>
            <dt className="sr-only">{m.label}</dt>
            <dd className="font-display text-lg font-medium text-fg sm:text-xl">{m.value}</dd>
            <dd className="mt-0.5 text-xs leading-snug text-muted">{m.label}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span key={tag} className="rounded-full bg-bg-inset px-2.5 py-1 font-mono text-[11px] text-muted">
            {tag}
          </span>
        ))}
      </div>

      {project.demo && (
        <div className="mt-6 flex items-center gap-4 border-t border-border pt-5">
          <a
            href={project.demo}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fg transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Live demo
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      )}
    </motion.article>
  );
}
