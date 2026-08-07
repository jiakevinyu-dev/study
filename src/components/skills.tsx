import { skillGroups } from "@/lib/data";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export function Skills() {
  return (
    <section id="skills" className="scroll-mt-20 border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading eyebrow="Toolkit" title="Skills & technologies." />

        <RevealGroup className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, i) => (
            <RevealItem
              key={group.title}
              className={
                "bg-bg-elevated p-6 sm:p-7" +
                (i === skillGroups.length - 1 ? " sm:col-span-2 lg:col-span-2" : "")
              }
            >
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
                {group.title}
              </h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li
                    key={item}
                    className="rounded-full bg-bg-inset px-3 py-1.5 text-xs font-medium text-fg sm:text-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
