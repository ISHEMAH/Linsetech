import { handleForm } from "@/lib/form-guard";
import { validateNewsletter } from "@/lib/forms";
import { deliverNewsletter } from "@/lib/mail";

/**
 * Newsletter sign-ups and unsubscribes (footer, news strip, fixed bar on /careers and /support): email, optional
 * firstName / lastName / company, topics from NEWSLETTER_TOPICS, action "subscribe" (default) | "unsubscribe".
 * Same guards and answers as /api/contact.
 * Delivery: POST to NEWSLETTER_WEBHOOK_URL when set, else an e-mail to CONTACT_TO over SMTP, else delivered: false.
 */
export async function POST(req: Request) {
  return handleForm(req, "newsletter", validateNewsletter, deliverNewsletter);
}
