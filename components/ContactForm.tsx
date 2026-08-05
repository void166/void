"use client";

import { useState } from "react";

const inputClass =
  "w-full rounded-md border border-line-strong bg-ink px-3.5 py-2.5 text-sm text-paper outline-none transition-colors focus:border-brand-400 focus:ring-2 focus:ring-brand-500/40";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-line bg-ink-2 p-10 text-center">
        <h3 className="text-xl font-semibold text-paper">Message sent</h3>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Thanks for reaching out — our team will get back to you shortly.
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
      <div>
        <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium text-mist">
          Name
        </label>
        <input id="contact-name" name="name" type="text" required className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium text-mist">
          Email
        </label>
        <input id="contact-email" name="email" type="email" required className={inputClass} />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-medium text-mist">
          Subject
        </label>
        <input id="contact-subject" name="subject" type="text" className={inputClass} />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium text-mist">
          Message
        </label>
        <textarea id="contact-message" name="message" rows={5} required className={inputClass} />
      </div>

      <div className="sm:col-span-2">
        <button
          type="submit"
          className="rounded-md bg-brand-500 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-lg hover:shadow-brand-500/20"
        >
          Send message
        </button>
      </div>
    </form>
  );
}
