import { GraduationCap } from "lucide-react";
import { education, site } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export function About() {
  return (
    <section id="about" className="scroll-mt-20 border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading eyebrow="About" title="Statistics-trained, engineering-minded." />

        <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Reveal className="space-y-5 text-base leading-relaxed text-muted sm:text-lg">
            <p>
              I started my career testing financial software at Charles Schwab and building
              client-facing tools at HCSS &mdash; work that taught me how software actually
              breaks in production, and how to be careful about it. That instinct followed me
              into data science: first analyzing ticket revenue for the LA Clippers, then
              building forecasting models and, eventually, leading the model validation
              function protecting $1B+ of financial risk at Toyota Financial Services.
            </p>
            <p>
              Today, as a Senior Data Scientist at Digitas, I sit at the intersection of
              statistics and marketing technology &mdash; rebuilding how audience segments are
              built and activated at scale, and designing the experiments that prove whether
              they actually work.
            </p>
            <p>
              What ties it together is a bias toward models and systems that hold up under
              scrutiny: reproducible, explainable, and built for the people who have to trust
              them &mdash; whether that&rsquo;s a regulator, an executive, or another engineer.
            </p>
          </Reveal>

          <Reveal delay={0.1} className="space-y-6">
            <div className="rounded-2xl border border-border bg-bg-elevated p-6">
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                Currently
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-fg">
                {site.role} at <span className="font-medium">Digitas</span>, focused on
                marketing data science &mdash; audience strategy, experimentation, and
                pipeline automation.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-bg-elevated p-6">
              <h3 className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-accent">
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                Education
              </h3>
              <ul className="mt-4 space-y-4">
                {education.map((entry) => (
                  <li key={entry.school + entry.degree}>
                    <p className="text-sm font-medium text-fg">{entry.school}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {entry.degree}
                      {entry.period ? ` · ${entry.period}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
