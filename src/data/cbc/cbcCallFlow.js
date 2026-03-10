/**
 * CBC Help Desk Call Triage Flow
 * Source: CBC Help Desk Troubleshooting Guide flowchart (2026)
 *
 * Node types:
 *   "question" — presents options to the agent; has `options: [{ label, next }]`
 *   "end"      — terminal outcome; has `variant`: "accenture" | "success" | "info"
 *
 * Entry point: "start"
 */
export const cbcCallFlow = {
  // ─── ENTRY ────────────────────────────────────────────────────────────────────
  start: {
    id: "start",
    type: "question",
    text: "What is the caller's issue?",
    options: [
      { label: "Experiencing an error", next: "error-type" },
      {
        label: "Locked out of account / needs password reset",
        next: "account-locked",
      },
      {
        label: "Question about system functionality",
        next: "end-functionality",
      },
      { label: "Status request or explanation", next: "end-status" },
    ],
  },

  // ─── ERROR BRANCH ─────────────────────────────────────────────────────────────
  "error-type": {
    id: "error-type",
    type: "question",
    text: "What type of error is the user experiencing?",
    options: [
      {
        label: "Fingerprint Clearance Card error",
        next: "end-fcc-accenture",
      },
      {
        label: "Request submission error (e.g., signature issue)",
        next: "signature-match",
      },
      { label: "System error", next: "system-known" },
      {
        label: "User error (wrong data entered, wrong steps taken, etc.)",
        next: "user-manual-change",
      },
    ],
  },

  // FCC error
  "end-fcc-accenture": {
    id: "end-fcc-accenture",
    type: "end",
    variant: "accenture",
    text: "Gather additional information and submit ticket to Accenture.",
  },

  // Request submission error — signature path
  "signature-match": {
    id: "signature-match",
    type: "question",
    text: "Does the signature match the name on the account?",
    options: [
      {
        label: "No — signature does not match",
        next: "advise-signature",
      },
      {
        label: "Yes — signature matches",
        next: "end-request-accenture",
      },
    ],
  },
  "advise-signature": {
    id: "advise-signature",
    type: "question",
    text: "Advise the user to correct their signature and resubmit. Did this resolve the error?",
    options: [
      { label: "Yes — issue resolved", next: "end-finalize" },
      {
        label: "No — still experiencing the error",
        next: "end-request-accenture",
      },
    ],
  },
  "end-request-accenture": {
    id: "end-request-accenture",
    type: "end",
    variant: "accenture",
    text: "Gather additional information and submit ticket to Accenture.",
  },
  "end-finalize": {
    id: "end-finalize",
    type: "end",
    variant: "success",
    text: "Finalize call.",
  },

  // System error path
  "system-known": {
    id: "system-known",
    type: "question",
    text: "Is this a known system issue?",
    options: [
      { label: "No — not a known issue", next: "end-system-accenture" },
      { label: "Yes — known issue", next: "system-workaround" },
    ],
  },
  "end-system-accenture": {
    id: "end-system-accenture",
    type: "end",
    variant: "accenture",
    text: "Gather additional information and submit ticket to Accenture.",
  },
  "system-workaround": {
    id: "system-workaround",
    type: "question",
    text: "Is there a known workaround for this system issue?",
    options: [
      {
        label: "No — no workaround available",
        next: "end-system-accenture-2",
      },
      { label: "Yes — workaround exists", next: "end-workaround" },
    ],
  },
  "end-system-accenture-2": {
    id: "end-system-accenture-2",
    type: "end",
    variant: "accenture",
    text: "Gather additional information and submit ticket to Accenture.",
  },
  "end-workaround": {
    id: "end-workaround",
    type: "end",
    variant: "success",
    text: "Provide the end user with the known workaround.",
  },

  // User error path
  "user-manual-change": {
    id: "user-manual-change",
    type: "question",
    text: "Does resolving this user error require a manual backend change?",
    options: [
      { label: "Yes — manual change needed", next: "end-user-accenture" },
      {
        label: "No — user can correct and resubmit themselves",
        next: "end-assist-user",
      },
    ],
  },
  "end-user-accenture": {
    id: "end-user-accenture",
    type: "end",
    variant: "accenture",
    text: "Gather additional information and submit ticket to Accenture.",
  },
  "end-assist-user": {
    id: "end-assist-user",
    type: "end",
    variant: "success",
    text: "Assist the user in how to correctly complete and resubmit.",
  },

  // ─── LOCKED OUT / PASSWORD RESET BRANCH ──────────────────────────────────────
  "account-locked": {
    id: "account-locked",
    type: "question",
    text: "Is the account currently locked?",
    options: [
      { label: "Yes — account is locked", next: "unlock-step" },
      { label: "No — account is not locked", next: "know-credentials" },
    ],
  },

  // Account IS locked
  "unlock-step": {
    id: "unlock-step",
    type: "question",
    text: "Unlock the account and direct the user to complete the Forgot Password process. Do they know their security questions?",
    options: [
      {
        label: "Yes — they know their security questions",
        next: "end-complete-questions",
      },
      {
        label: "No — they do not know their security questions",
        next: "reset-step",
      },
    ],
  },
  "end-complete-questions": {
    id: "end-complete-questions",
    type: "end",
    variant: "success",
    text: "Direct them to complete their security questions and reset their password.",
  },
  "reset-step": {
    id: "reset-step",
    type: "question",
    text: "Reset the password from the backend. Were they successful in identifying the email used on the account?",
    options: [
      {
        label: "Yes — email identified successfully",
        next: "end-direct-email",
      },
      {
        label: "No — cannot identify the email used",
        next: "end-new-account",
      },
    ],
  },
  "end-direct-email": {
    id: "end-direct-email",
    type: "end",
    variant: "success",
    text: "Direct them to their email to complete the password reset process.",
  },
  "end-new-account": {
    id: "end-new-account",
    type: "end",
    variant: "info",
    text: "Direct the user to create a new account.",
  },

  // Account NOT locked
  "know-credentials": {
    id: "know-credentials",
    type: "question",
    text: "Do they know the credentials (email address) used to create the account?",
    options: [
      {
        label: "Yes — they know the email",
        next: "forgot-password-emails",
      },
      {
        label: "No — they do not know the email",
        next: "end-new-account-2",
      },
    ],
  },
  "forgot-password-emails": {
    id: "forgot-password-emails",
    type: "question",
    text: "Direct them to the Forgot Password flow using the possible email addresses they recall. Do they know their security questions?",
    options: [
      {
        label: "Yes — they know their security questions",
        next: "end-complete-questions-2",
      },
      {
        label: "No — they do not know their security questions",
        next: "reset-step",
      },
    ],
  },
  "end-complete-questions-2": {
    id: "end-complete-questions-2",
    type: "end",
    variant: "success",
    text: "Direct them to complete their security questions and reset their password.",
  },
  "end-new-account-2": {
    id: "end-new-account-2",
    type: "end",
    variant: "info",
    text: "Direct the user to create a new account.",
  },

  // ─── SIMPLE TERMINAL BRANCHES ─────────────────────────────────────────────────
  "end-functionality": {
    id: "end-functionality",
    type: "end",
    variant: "success",
    text: "Provide information on system functionality. Refer the user to CBC user guides and tutorials at des.az.gov/cbc.",
  },
  "end-status": {
    id: "end-status",
    type: "end",
    variant: "success",
    text: "Provide status information. If processing is pending, inform the user that some requests require a manual review that may take several days.",
  },
};
