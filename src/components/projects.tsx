import { projects } from "@/lib/data";
import { ProjectCard } from "@/components/project-card";
import { RevealGroup, RevealItem } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";

export function Projects() {
  const featured = projects.filter((p) => p.featured);
  const rest = projects.filter((p) => !p.featured);

  return (
    <section id="projects" className="scroll-mt-20 border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Selected work"
          title="A few projects worth a closer look."
          description="Enterprise engagements are described at the level I'm able to share publicly; the open-source project links straight to source."
        />

        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2">
          {featured.map((project) => (
            <RevealItem key={project.slug}>
              <ProjectCard project={project} />
            </RevealItem>
          ))}
        </RevealGroup>

        <RevealGroup className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((project) => (
            <RevealItem key={project.slug}>
              <ProjectCard project={project} className="sm:h-full" />
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
