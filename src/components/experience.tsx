import { experience } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export function Experience() {
  return (
    <section id="experience" className="scroll-mt-20 border-t border-border bg-bg-inset py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Experience"
          title="Six years across product, risk, and marketing data science."
          description="From automated testing to enterprise risk models to marketing systems reaching millions — a track record of shipping data work that survives contact with production."
        />

        <ol className="mt-16 space-y-0">
          {experience.map((role, i) => (
            <Reveal as="li" key={role.org + role.role} delay={Math.min(i * 0.05, 0.3)}>
              <div className="grid gap-4 border-t border-border py-10 first:border-t sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-10">
                <div>
                  <p className="font-display text-lg font-medium text-fg">{role.org}</p>
                  <p className="mt-1 text-sm text-muted">{role.role}</p>
                  <p className="mt-3 font-mono text-xs uppercase tracking-wide text-accent">
                    {role.period}
                  </p>
                </div>

                <div>
                  <ul className="space-y-3">
                    {role.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-3 text-sm leading-relaxed text-muted sm:text-base">
                        <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-border-strong" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {role.tech.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border px-2.5 py-1 font-mono text-[11px] text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
