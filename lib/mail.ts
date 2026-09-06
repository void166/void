/** Gmail's web compose window — one click lands the visitor in a ready-to-type
    mail instead of handing off to whatever desktop client the OS registered. */
export function gmailCompose(to: string, subject = "", body = "") {
  const params = new URLSearchParams({ view: "cm", fs: "1", to });
  if (subject) params.set("su", subject);
  if (body) params.set("body", body);
  return `https://mail.google.com/mail/?${params.toString()}`;
}
