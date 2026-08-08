import type { Metadata } from "next";
import { contact } from "@/lib/data/contact";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Dentsu Data Artist Mongol collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="py-24">
      <div className="container-page max-w-3xl">
        <div className="eyebrow flex items-center gap-3 text-mist">
          <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
          Legal
        </div>
        <h1 className="display-title mt-6 text-4xl">Privacy Policy</h1>
        <p className="mt-4 font-mono text-xs tracking-[0.05em] text-fog">
          This is a placeholder policy. Replace with counsel-reviewed content before launch.
        </p>

        <div className="mt-12 space-y-8 border-t border-line pt-10 text-sm leading-relaxed text-mist">
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              1. Information we collect
            </h2>
            <p className="mt-3">
              We may collect information you provide directly to us, such as your name, email
              address, phone number, and any information submitted through our contact or
              careers forms, including uploaded CVs.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              2. How we use information
            </h2>
            <p className="mt-3">
              We use the information we collect to respond to inquiries, evaluate job
              applications, communicate with clients and partners, and improve our services.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              3. Data sharing
            </h2>
            <p className="mt-3">
              We do not sell personal information. Information may be shared with Dentsu Group
              companies where necessary to deliver services or evaluate applications.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              4. Your rights
            </h2>
            <p className="mt-3">
              You may request access to, correction of, or deletion of your personal information
              by contacting us at{" "}
              <a
                href={`mailto:${contact.email}`}
                className="text-paper underline-offset-4 hover:underline"
              >
                {contact.email}
              </a>
              .
            </p>
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              5. Contact
            </h2>
            <p className="mt-3">
              Questions about this policy can be directed to {contact.email} or {contact.phone}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
