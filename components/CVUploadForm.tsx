"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { jobs } from "@/lib/data/jobs";

export default function CVUploadForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="card-line p-10 text-center">
        <h3 className="display-title text-xl text-paper">Thanks for applying!</h3>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          We&apos;ve received your information and will be in touch if there&apos;s a match.
        </p>
      </div>
    );
  }

  return (
    <form
      className="grid grid-cols-1 gap-5 border border-line p-8 sm:grid-cols-2"
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
          className={`${inputClass} file:mr-3 file:border-0 file:bg-paper file:px-3 file:py-1.5 file:font-mono file:text-[10px] file:font-semibold file:uppercase file:tracking-[0.15em] file:text-black`}
        />
      </Field>

      <Field label="Additional Information" htmlFor="message" full>
        <textarea id="message" name="message" rows={4} className={inputClass} />
      </Field>

      <div className="sm:col-span-2">
        <button type="submit" className="btn-solid cursor-pointer">
          Send
        </button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full border border-line bg-transparent px-3.5 py-2.5 font-mono text-sm text-paper outline-none transition-colors focus:border-line-strong focus:bg-white/[0.03]";

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
      <label htmlFor={htmlFor} className="mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-fog">
        {label}
      </label>
      {children}
    </div>
  );
}
