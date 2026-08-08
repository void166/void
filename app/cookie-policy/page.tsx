import type { Metadata } from "next";
import { contact } from "@/lib/data/contact";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Dentsu Data Artist Mongol uses cookies on this website.",
};

export default function CookiePolicyPage() {
  return (
    <section className="py-24">
      <div className="container-page max-w-3xl">
        <div className="eyebrow flex items-center gap-3 text-mist">
          <span className="inline-block h-px w-6 bg-line-strong" aria-hidden />
          Legal
        </div>
        <h1 className="display-title mt-6 text-4xl">Cookie Policy</h1>
        <p className="mt-4 font-mono text-xs tracking-[0.05em] text-fog">
          This is a placeholder policy. Replace with counsel-reviewed content before launch.
        </p>

        <div className="mt-12 space-y-8 border-t border-line pt-10 text-sm leading-relaxed text-mist">
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              1. What are cookies
            </h2>
            <p className="mt-3">
              Cookies are small text files stored on your device that help websites function and
              collect basic analytics about how visitors use the site.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              2. How we use cookies
            </h2>
            <p className="mt-3">
              We use essential cookies required for the site to function, and may use analytics
              cookies to understand site usage and improve our content.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              3. Managing cookies
            </h2>
            <p className="mt-3">
              You can control or delete cookies through your browser settings. Disabling cookies
              may affect some site functionality.
            </p>
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-paper">
              4. Contact
            </h2>
            <p className="mt-3">Questions about this policy can be directed to {contact.email}.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
