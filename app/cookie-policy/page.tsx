import type { Metadata } from "next";
import { contact } from "@/lib/data/contact";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Dentsu Data Artist Mongol uses cookies on this website.",
};

export default function CookiePolicyPage() {
  return (
    <section className="py-20">
      <div className="container-page max-w-3xl">
        <div className="eyebrow text-brand-400">Legal</div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight">Cookie Policy</h1>
        <p className="mt-4 text-sm text-fog">
          This is a placeholder policy. Replace with counsel-reviewed content before launch.
        </p>

        <div className="mt-10 space-y-8 text-sm leading-relaxed text-mist">
          <div>
            <h2 className="text-lg font-semibold text-paper">1. What are cookies</h2>
            <p className="mt-2">
              Cookies are small text files stored on your device that help websites function and
              collect basic analytics about how visitors use the site.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-paper">2. How we use cookies</h2>
            <p className="mt-2">
              We use essential cookies required for the site to function, and may use analytics
              cookies to understand site usage and improve our content.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-paper">3. Managing cookies</h2>
            <p className="mt-2">
              You can control or delete cookies through your browser settings. Disabling cookies
              may affect some site functionality.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-paper">4. Contact</h2>
            <p className="mt-2">Questions about this policy can be directed to {contact.email}.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
