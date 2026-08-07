import { Mail } from "lucide-react";
import { site } from "@/lib/data";
import { LinkedinIcon } from "@/components/icons";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-5 sm:flex-row sm:justify-between sm:px-8">
        <p className="text-sm text-muted">
          &copy; {year} {site.name}. Built with Next.js &amp; Tailwind CSS.
        </p>
        <div className="flex items-center gap-5">
          <a href={`mailto:${site.email}`} aria-label="Email" className="text-muted transition-colors hover:text-fg">
            <Mail className="h-[18px] w-[18px]" />
          </a>
          <a
            href={site.social.linkedin}
            target="_blank"
            rel="noreferrer noopener"
            aria-label="LinkedIn"
            className="text-muted transition-colors hover:text-fg"
          >
            <LinkedinIcon className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>
    </footer>
  );
}
