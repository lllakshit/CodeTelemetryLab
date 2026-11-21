/**
 * Copy and options for the contact page. Kept in one file so the page, the 3D scene and the tests read the same
 * wording. Nothing here is new: it is the text that was already on /contact, moved out of the page component.
 */

export const contactHeading = "Send a brief. Get a grounded reply."
export const contactLead =
  "Name, email, and a short description of the problem are enough. We respond within one business day with questions or a proposed next step."

/** What the visitor should put in the message. */
export const includeHints = [
  "The problem operators feel today",
  "Who uses the system and who owns decisions",
  "Deadline or launch window, even if approximate",
  "Tools that must connect (CRM, auth, payments, docs)",
] as const

export const responseNotes = [
  "Reply within one business day from someone who can discuss the work",
  "Clarifying questions or a proposed first slice—not a scripted pitch",
  "Optional details help scope; name, email, and message are enough to start",
] as const

export const contactFaqs = [
  {
    q: "What happens after I submit?",
    a: "We read the brief, check fit, and reply by email. If the work is a match, we propose a discovery call or a written first-slice plan. If it is not a match, we say so.",
  },
  {
    q: "What should I expect on a discovery call?",
    a: "Thirty to forty-five minutes on users, constraints, and success criteria. We will not pressure you into a package. Notes and next steps follow in writing.",
  },
  {
    q: "Do you sign NDAs?",
    a: "Yes for serious evaluations. Send the document with your brief or after the first reply.",
  },
] as const

export const contactLocation = "Jaipur-based · remote delivery across NA, Europe, UAE & Australia"

/** The five stages drawn in the 3D inquiry flow. The same list is rendered as plain text for readers without 3D. */
export const inquirySteps = [
  "Submit Inquiry",
  "We Review & Understand",
  "Discovery Call",
  "Proposal & Timeline",
  "Kickoff & Execution",
] as const

export const inquiryCaption = "Clear intake, realistic timelines, and a human response path."

export const projectTypeOptions = [
  "AI Development",
  "AI Automation",
  "LLM Applications",
  "AI Agents",
  "Custom Software Development",
  "SaaS Development",
  "MVP Development",
  "Full Stack Development",
  "React Development",
  "Next.js Development",
  "Node.js Development",
  "Python Development",
  "Workflow Automation",
  "CRM Development",
  "API Development",
  "Business Automation",
  "Startup Product Development",
  "Website Development",
  "Enterprise Software",
] as const

export const budgetOptions = ["$5k - $10k", "$10k - $25k", "$25k - $50k", "$50k+"] as const
export const timelineOptions = ["As soon as possible", "2-4 weeks", "1-2 months", "3+ months", "Exploring options"] as const
export const contactMethodOptions = ["Email", "Phone", "Video call"] as const

export const sentMessage = "Your inquiry was received. We will review it and reply in your inbox."
export const invalidMessage =
  "Please add a valid email, your name, and a short message so we can route the inquiry correctly."
