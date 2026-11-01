import { handleForm } from "@/lib/form-guard";
import { validateContact } from "@/lib/forms";
import { deliverContact } from "@/lib/mail";

/**
 * Project briefs (contact drawer, /contact) and job applications (careers "Apply": need = "careers", role, cvUrl).
 * 200 { ok, delivered } · 400 { error: "validation", fields } · 413 · 429 (Retry-After) · 500.
 * Delivery is SMTP when SMTP_URL + CONTACT_TO are set (see .env.example); otherwise delivered: false and the UI asks
 * the visitor to write to us.
 */
export async function POST(req: Request) {
  return handleForm(req, "contact", validateContact, deliverContact);
}
