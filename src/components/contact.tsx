import { Mail, MapPin, Phone } from "lucide-react";
import type { ComponentType } from "react";
import { site } from "@/lib/data";
import { Reveal } from "@/components/reveal";
import { SectionHeading } from "@/components/section-heading";
import { ContactForm } from "@/components/contact-form";
import { LinkedinIcon } from "@/components/icons";

export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-border bg-bg-inset py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Contact"
          title="Let's talk about your data."
          description="Open to senior data science roles and select consulting work. The fastest way to reach me is email — the form below opens a pre-filled message in your mail client."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-16">
          <Reveal className="space-y-4">
            <ContactLink icon={Mail} label="Email" value={site.email} href={`mailto:${site.email}`} />
            <ContactLink icon={Phone} label="Phone" value={site.phoneDisplay} href={`tel:${site.phone}`} />
            <ContactLink icon={LinkedinIcon} label="LinkedIn" value="in/jiakevinyu" href={site.social.linkedin} external />
            <ContactLink icon={MapPin} label="Location" value={site.location} />
          </Reveal>

          <Reveal delay={0.1}>
            <ContactForm />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function ContactLink({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-bg-elevated text-accent">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span>
        <span className="block text-xs font-medium uppercase tracking-wide text-muted">{label}</span>
        <span className="mt-0.5 block text-sm font-medium text-fg">{value}</span>
      </span>
    </>
  );

  if (!href) {
    return <div className="flex items-center gap-4">{content}</div>;
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer noopener" : undefined}
      className="flex items-center gap-4 rounded-xl transition-colors hover:bg-bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </a>
  );
}
