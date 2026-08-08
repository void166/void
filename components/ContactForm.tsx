"use client";

import { useState } from "react";

const inputClass =
  "w-full border border-line bg-transparent px-3.5 py-2.5 font-mono text-sm text-paper outline-none transition-colors focus:border-line-strong focus:bg-white/[0.03]";

const labelClass = "mb-2 block font-mono text-[10px] uppercase tracking-[0.22em] text-fog";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="card-line p-10 text-center">
        <h3 className="display-title text-xl text-paper">Message sent</h3>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Thanks for reaching out — our team will get back to you shortly.
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
      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Name
        </label>
        <input id="contact-name" name="name" type="text" required className={inputClass} />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          Email
        </label>
        <input id="contact-email" name="email" type="email" required className={inputClass} />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="contact-subject" className={labelClass}>
          Subject
        </label>
        <input id="contact-subject" name="subject" type="text" className={inputClass} />
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea id="contact-message" name="message" rows={5} required className={inputClass} />
      </div>

      <div className="sm:col-span-2">
        <button type="submit" className="btn-solid cursor-pointer">
          Send message
        </button>
      </div>
    </form>
  );
}
