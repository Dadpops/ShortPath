import { randomUUID } from "crypto";
import type { Entry } from "../shared/types";
import type { StoreData } from "./schema";

function entry(fields: Omit<Entry, "id" | "createdAt" | "updatedAt">): Entry {
  const now = new Date().toISOString();
  return { ...fields, id: randomUUID(), createdAt: now, updatedAt: now };
}

const SEED_ENTRIES: Entry[] = [
  // Saved Replies
  entry({
    vertical: "saved-replies",
    title: "Billing inquiry — general",
    body: "Hi [Name],\n\nThanks for reaching out about your billing. I've pulled up your account and can see the charge in question.\n\nCould you let me know which specific charge you'd like me to look into? Once I have that detail I can walk you through exactly what it covers or process an adjustment if needed.\n\nLooking forward to sorting this out for you.",
    link: null,
    tags: "billing, charge, invoice",
    type: "reply",
  }),
  entry({
    vertical: "saved-replies",
    title: "Shipping delay apology",
    body: "Hi [Name],\n\nI'm sorry to hear your order hasn't arrived yet — that's frustrating and I completely understand.\n\nI've looked into your shipment and it appears there's been a delay with the carrier. Your updated estimated delivery is [DATE]. If it doesn't arrive by then, please reply here and I'll escalate this to get it resolved or arrange a replacement.\n\nThank you for your patience.",
    link: null,
    tags: "shipping, delay, delivery, apology",
    type: "reply",
  }),
  entry({
    vertical: "saved-replies",
    title: "Password reset instructions",
    body: "Hi [Name],\n\nNo problem — here's how to reset your password:\n\n1. Go to the login page and click \"Forgot password?\"\n2. Enter the email address on your account.\n3. Check your inbox for a reset link (check spam if you don't see it within a few minutes).\n4. Click the link and choose a new password.\n\nIf you run into any issues or the email doesn't arrive, let me know and I'll sort it out directly.",
    link: null,
    tags: "password, reset, login, account",
    type: "reply",
  }),
  entry({
    vertical: "saved-replies",
    title: "Refund confirmation",
    body: "Hi [Name],\n\nYour refund of [AMOUNT] has been approved and processed. Depending on your bank, it typically takes 3–5 business days to appear on your statement.\n\nIf you don't see it after 5 business days, please get back to us with your bank's reference number and we'll look into it right away.\n\nSorry again for the inconvenience — thanks for your patience.",
    link: null,
    tags: "refund, approved, payment",
    type: "reply",
  }),
  entry({
    vertical: "saved-replies",
    title: "Account cancellation confirmation",
    body: "Hi [Name],\n\nI've cancelled your account as requested. You won't be charged again and your access will remain active until [END DATE].\n\nIf you change your mind or need anything in the meantime, don't hesitate to reach out. We're sorry to see you go.",
    link: null,
    tags: "cancellation, cancel, account, offboarding",
    type: "reply",
  }),

  // Documentation
  entry({
    vertical: "documentation",
    title: "Refund policy",
    body: "Refunds are available within 30 days of purchase for unused accounts. Partial refunds are calculated on a pro-rata basis for annual plans. Refunds are not available for monthly plans after the billing date. To initiate a refund, the customer must contact support with their order number.",
    link: "https://example.com/refund-policy",
    tags: "refund, policy, 30 days, annual, monthly",
    type: "doc",
  }),
  entry({
    vertical: "documentation",
    title: "Supported browsers and devices",
    body: "Supported browsers: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+. Mobile: iOS 14+ (Safari), Android 10+ (Chrome). Internet Explorer is not supported. For the best experience, keep your browser up to date.",
    link: null,
    tags: "browsers, devices, compatibility, iOS, Android",
    type: "doc",
  }),
  entry({
    vertical: "documentation",
    title: "API rate limits",
    body: null,
    link: "https://example.com/docs/api/rate-limits",
    tags: "API, rate limit, developer",
    type: "link",
  }),
  entry({
    vertical: "documentation",
    title: "Getting started guide",
    body: null,
    link: "https://example.com/docs/getting-started",
    tags: "onboarding, setup, getting started, new user",
    type: "link",
  }),

  // Internal SOPs
  entry({
    vertical: "sops",
    title: "Escalation process",
    body: "Escalate to Tier 2 when:\n- Issue has not been resolved after two contact attempts\n- Customer is requesting a manager\n- Issue involves a data breach or security concern\n- Refund request exceeds $500\n\nHow to escalate:\n1. Tag the ticket with 'Escalation' in the helpdesk.\n2. Assign to the Tier 2 queue.\n3. Add a note summarising what was tried and why it needs escalation.\n4. Notify the customer that a specialist will follow up within 4 business hours.",
    link: null,
    tags: "escalation, tier 2, manager, process",
    type: "sop",
  }),
  entry({
    vertical: "sops",
    title: "Refund approval workflow",
    body: "Refunds under $100:\n- Agent can approve directly in the billing tool.\n- No manager sign-off required.\n- Process within the same support session.\n\nRefunds $100–$500:\n- Agent fills out the Refund Request form (link in Support Tools).\n- Approver (Team Lead) reviews within 2 business hours.\n- Agent notifies customer once approved.\n\nRefunds over $500:\n- Requires Finance approval.\n- Submit via the Finance Request channel in Slack.\n- SLA: 1 business day.",
    link: null,
    tags: "refund, approval, workflow, finance",
    type: "sop",
  }),
  entry({
    vertical: "sops",
    title: "VIP customer handling",
    body: "VIP accounts are tagged 'VIP' in the helpdesk. When handling a VIP ticket:\n1. Respond within 1 hour (not the standard 4-hour SLA).\n2. Do not put VIP tickets in the general queue — assign directly.\n3. Proactively offer account credit for any service disruption.\n4. Loop in the Account Manager before closing the ticket.",
    link: null,
    tags: "VIP, priority, SLA, account manager",
    type: "sop",
  }),
  entry({
    vertical: "sops",
    title: "Account suspension — steps",
    body: "Before suspending an account:\n1. Confirm with Team Lead that suspension is warranted.\n2. Document the reason in the ticket.\n3. Send the pre-suspension warning email (saved reply: 'Account suspension warning').\n4. Wait 24 hours for a response.\n5. If no response, proceed with suspension in the admin panel.\n6. Send suspension confirmation email.",
    link: null,
    tags: "suspension, suspend, account, policy",
    type: "sop",
  }),

  // Support Tools
  entry({
    vertical: "support-tools",
    title: "Admin panel",
    body: null,
    link: "https://admin.example.com",
    tags: "admin, dashboard, internal",
    type: "link",
  }),
  entry({
    vertical: "support-tools",
    title: "Status page",
    body: null,
    link: "https://status.example.com",
    tags: "status, uptime, incidents, outage",
    type: "link",
  }),
  entry({
    vertical: "support-tools",
    title: "Customer lookup",
    body: null,
    link: "https://admin.example.com/customers",
    tags: "customer, lookup, search, account",
    type: "link",
  }),
  entry({
    vertical: "support-tools",
    title: "Stripe dashboard",
    body: null,
    link: "https://dashboard.stripe.com",
    tags: "stripe, billing, payments, charges",
    type: "link",
  }),
  entry({
    vertical: "support-tools",
    title: "Refund request form",
    body: null,
    link: "https://forms.example.com/refund-request",
    tags: "refund, form, request",
    type: "link",
  }),
];

export function applySeed(store: StoreData): StoreData {
  return { ...store, entries: SEED_ENTRIES };
}
