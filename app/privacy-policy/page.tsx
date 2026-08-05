import type { Metadata } from "next";
import { contact } from "@/lib/data/contact";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Dentsu Data Artist Mongol collects, uses, and protects your information.",
};

export default function PrivacyPolicyPage() {
  return (
    <section className="py-20">
      <div className="container-page max-w-3xl">
        <div className="eyebrow text-brand-400">Legal</div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-sm text-fog">
          This is a placeholder policy. Replace with counsel-reviewed content before launch.
        </p>

        <div className="prose-legal mt-10 space-y-8 text-sm leading-relaxed text-mist">
          <div>
            <h2 className="text-lg font-semibold text-paper">1. Information we collect</h2>
            <p className="mt-2">
              We may collect information you provide directly to us, such as your name, email
              address, phone number, and any information submitted through our contact or
              careers forms, including uploaded CVs.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-paper">2. How we use information</h2>
            <p className="mt-2">
              We use the information we collect to respond to inquiries, evaluate job
              applications, communicate with clients and partners, and improve our services.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-paper">3. Data sharing</h2>
            <p className="mt-2">
              We do not sell personal information. Information may be shared with Dentsu Group
              companies where necessary to deliver services or evaluate applications.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-paper">4. Your rights</h2>
            <p className="mt-2">
              You may request access to, correction of, or deletion of your personal information
              by contacting us at{" "}
              <a href={`mailto:${contact.email}`} className="text-brand-300 hover:text-brand-200">
                {contact.email}
              </a>
              .
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-paper">5. Contact</h2>
            <p className="mt-2">
              Questions about this policy can be directed to {contact.email} or {contact.phone}.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
