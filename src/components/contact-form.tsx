"use client";

import { FormEvent, useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { site } from "@/lib/data";

type Status = "idle" | "sent";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const message = String(data.get("message") ?? "");

    const subject = `Portfolio inquiry from ${name || "your site"}`;
    const body = `${message}\n\n— ${name} (${email})`;
    const mailto = `mailto:${site.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailto;
    setStatus("sent");
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Name" name="name" type="text" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="message" className="mb-2 block text-sm font-medium text-fg">
          Message <span className="text-accent">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="What are you working on?"
          className="w-full resize-none rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg placeholder:text-muted/70 transition-colors focus:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-1">
        <button
          type="submit"
          className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-fg px-6 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          Send message
          <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </button>
        <p role="status" aria-live="polite" className="flex items-center gap-1.5 text-sm text-muted">
          {status === "sent" && (
            <>
              <Check className="h-4 w-4 text-accent" aria-hidden="true" />
              Opening your email client&hellip;
            </>
          )}
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  autoComplete,
  required,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-2 block text-sm font-medium text-fg">
        {label} {required && <span className="text-accent">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        className="w-full rounded-xl border border-border bg-bg-elevated px-4 py-3 text-sm text-fg placeholder:text-muted/70 transition-colors focus:border-border-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
