"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { jobs } from "@/lib/data/jobs";

export default function CVUploadForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-line bg-ink-2 p-10 text-center">
        <h3 className="text-xl font-semibold text-paper">Thanks for applying!</h3>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          We&apos;ve received your information and will be in touch if there&apos;s a match.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid grid-cols-1 gap-5 rounded-2xl border border-line bg-ink-2 p-8 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <Field label="Position" htmlFor="position" full>
        <select id="position" name="position" required className={inputClass}>
          <option value="">Select a position</option>
          {jobs.map((job) => (
            <option key={job.slug} value={job.slug}>
              {job.title} ({job.type})
            </option>
          ))}
        </select>
      </Field>

      <Field label="Name" htmlFor="name">
        <input id="name" name="name" type="text" required className={inputClass} />
      </Field>

      <Field label="Email" htmlFor="email">
        <input id="email" name="email" type="email" required className={inputClass} />
      </Field>

      <Field label="Phone Number" htmlFor="phone">
        <input id="phone" name="phone" type="tel" className={inputClass} />
      </Field>

      <Field label="Upload CV" htmlFor="cv">
        <input
          id="cv"
          name="cv"
          type="file"
          accept=".pdf,.doc,.docx"
          className={`${inputClass} file:mr-3 file:rounded-md file:border-0 file:bg-brand-500 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white`}
        />
      </Field>

      <Field label="Additional Information" htmlFor="message" full>
        <textarea id="message" name="message" rows={4} className={inputClass} />
      </Field>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/20"
        >
          Send
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-line-strong bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40";

function Field({
  label,
  htmlFor,
  full,
  children,
}: {
  label: string;
  htmlFor: string;
  full?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : undefined}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-medium text-mist">
        {label}
      </label>
      {children}
    </div>
  );
}
