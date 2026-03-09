export const cbcResourcesMeta = {
  title: "CBC Portal Resources",
  description:
    "Setup guides and reference resources for the Arizona Centralized Background Checks (CBC) web portal.",
  portalUrl: "https://cbc.az.gov/",
  desPageUrl: "https://des.az.gov/cbc",
  technicalSupportUrl: "https://cbc.az.gov/contact-us/",
};

/**
 * Quick-share links agents can provide to callers.
 */
export const quickShareLinks = [
  {
    label: "CBC Portal — Sign In / Sign Up",
    url: "https://cbc.az.gov/",
    topic: "Portal Access",
  },
  {
    label: "DES CBC Resources Page (User Guides)",
    url: "https://des.az.gov/cbc",
    topic: "Portal Access",
  },
  {
    label: "CBC Technical Support / FAQs",
    url: "https://cbc.az.gov/contact-us/",
    topic: "Support",
  },
  {
    label: "DPS Fingerprint Clearance Portal (PSP)",
    url: "https://psp.azdps.gov/",
    topic: "Fingerprint Clearance",
  },
  {
    label: "Personal Background Check Affidavit (English — CSO-3663)",
    url: "https://dcs.az.gov/sites/default/files/DCS-Forms/CSO-3663_0.pdf",
    topic: "Personal Request",
  },
  {
    label: "Personal Background Check Affidavit (Spanish — CSO-3663S)",
    url: "https://dcs.az.gov/sites/default/files/DCS-Forms/CSO-3663S_0.pdf",
    topic: "Personal Request",
  },
];

/**
 * Setup process steps for Individual callers (from CBC-1001A).
 */
export const individualSetupSteps = [
  {
    step: 1,
    title: "Create an Account",
    details: [
      "If a Fingerprint Clearance Card (FCC) is required AND the caller already has a DPS Public Services Portal (PSP) account: no new account needed — log in at cbc.az.gov with DPS PSP credentials.",
      "If an FCC is required but no DPS PSP account exists: create one at psp.azdps.gov first, then log in to cbc.az.gov.",
      "If no FCC is required: create an account directly at cbc.az.gov using a personal email address.",
    ],
  },
  {
    step: 2,
    title: "Submit a Background Check Request",
    details: [
      "Log in to cbc.az.gov and click 'Services' in the upper right corner.",
      "Select the request type: Employment (for jobs/volunteering), Caregiver (for DCS foster/adoption/guardian), or Personal.",
      "For Employment: provide the employer's CBC account email. If DES-affiliated, also provide the DES Division name and Solicitation/Contract/Provider ID.",
      "For Caregiver: provide the agency's CBC account email plus info for each adult (18+) in the home: name, DOB, SSN, FCC Application Number, other names used, and a signed affidavit.",
      "For Personal: upload a signed and notarized affidavit (CSO-3663 in English or CSO-3663S in Spanish).",
    ],
  },
  {
    step: 3,
    title: "Get Background Check Results",
    details: [
      "When results are ready, CBC sends an email notification.",
      "Log in to cbc.az.gov, click 'Dashboard' in the upper right header.",
      "View the 'Recent Notifications' section for unread messages and result links.",
    ],
  },
];

/**
 * Setup process steps for Employer/Agency callers (from CBC-1003A).
 */
export const employerSetupSteps = [
  {
    step: 1,
    title: "Create an Account",
    details: [
      "If the caller already has a DPS PSP account: no new account needed — log in at cbc.az.gov.",
      "Employer role: responsible for hiring and managing background checks for applicants/employees, or completing DCS caregiver checks.",
      "Agency role: responsible for oversight/monitoring of an employer's background checks (does not submit requests directly).",
      "Use a group company email address for the CBC account — not a personal email.",
    ],
  },
  {
    step: 2,
    title: "Communicate with Applicants / Employees",
    details: [
      "Share the CBC account email address with applicants/employees so they can submit employment background check requests.",
      "If a DES contractor/service provider: also provide the DES Division name and Solicitation/Contract/Provider ID.",
    ],
  },
  {
    step: 3,
    title: "Add Connected Agency Accounts (if applicable)",
    details: [
      "Log in to CBC and click 'Continue' on the 'View Connected Agency Accounts' tile.",
      "Click 'Add Agency', enter the agency's CBC account email, and click 'Continue'.",
    ],
  },
  {
    step: 4,
    title: "Get Background Check Results",
    details: [
      "When results are ready, CBC sends an email notification.",
      "Log in to cbc.az.gov and click 'Dashboard' in the upper right header.",
      "View 'Recent Notifications' for unread messages.",
    ],
  },
];

/**
 * Account & portal reference information.
 */
export const portalNotes = [
  {
    title: "DPS PSP accounts are shared with CBC",
    detail:
      "The same account is used to log in to both the DPS Public Services Portal (psp.azdps.gov) and the CBC portal (cbc.az.gov). Profiles, employer/employee relationships, and account settings are shared between the two portals.",
  },
  {
    title: "OTP login required",
    detail:
      "After entering email and password, a One-Time Passcode (OTP) is sent via text or email to verify identity. OTP messages reference 'AZ DPS' — this is expected since the account is shared.",
  },
  {
    title: "Session timeout: 5 minutes of inactivity",
    detail:
      "The CBC logs out automatically after 5 minutes of inactivity. A countdown popup appears with a 5-minute window to click 'Continue Working'.",
  },
  {
    title: "Password requirements",
    detail:
      "8–20 characters, at least 1 uppercase letter, 1 lowercase letter, and 1 special character or number.",
  },
  {
    title: "Annual recheck & expiration",
    detail:
      "Employment background checks are due for renewal 12 months from the last result report. Notifications are sent 90 days before expiration. If the individual does not submit a new request by the due date, the check expires and all connected parties are notified.",
  },
  {
    title: "Automated recheck process",
    detail:
      "The CBC runs automated rechecks twice per week. Employers may receive a notification to confirm or remove an employee relationship. Employers must respond within 5 calendar days — if no response, the background check auto-expires and the individual is removed from the employer's dashboard.",
  },
  {
    title: "Forgot password",
    detail:
      "Callers need their security question answers to reset a password. Process: Forgot Password → enter email → click link in email → answer security questions → set new password → log back in with OTP.",
  },
  {
    title: "Account locked out",
    detail:
      "Accounts unlock automatically after 24 hours. The caller will receive an email once it unlocks after the next successful login.",
  },
  {
    title: "Account type change",
    detail:
      "To change account type (e.g., Individual to Employer), the caller must contact CBC Technical Support at cbc.az.gov/contact-us.",
  },
  {
    title: "Name change",
    detail:
      "Name changes on accounts linked to DPS must be processed through the DPS PSP at psp.azdps.gov before they can be applied in the CBC.",
  },
];

/**
 * DES divisions used in employer account affiliation (from CBC-1002A).
 */
export const desDivisions = [
  { short: "DDD", name: "Division of Developmental Disability" },
  { short: "DCC", name: "Division of Child Care" },
  { short: "DCAD", name: "Division of Community Assistance and Development" },
  { short: "DAAS", name: "Division of Aging and Adult Services" },
  { short: "DERS", name: "Division of Employment and Rehabilitation Services" },
  { short: "AzEIP", name: "Division of Arizona Early Intervention Program" },
  { short: "OP", name: "Office of Procurement" },
];

/**
 * CBC portal user guides and quick setup flyers (CBC-1000A through CBC-1009A).
 * The desPageUrl is the source for all documents; direct PDF links to be added if retrieved.
 */
export const userGuides = [
  {
    id: "guide-individual-full",
    number: "CBC-1000A",
    title: "CBC Individual User Guide",
    revision: "03/25",
    role: "Individual",
    description:
      "Full step-by-step guide: account creation, employment/caregiver/personal requests, dashboard, FCC tracking, message center.",
    url: "https://des.az.gov/cbc",
  },
  {
    id: "guide-individual-full-es",
    number: "CBC-1000A-S",
    title: "CBC Individual User Guide (Spanish)",
    revision: "03/25",
    role: "Individual",
    description: "Spanish-language version of the CBC Individual User Guide.",
    url: "https://des.az.gov/cbc",
  },
  {
    id: "guide-individual-quick",
    number: "CBC-1001A",
    title: "CBC Quick Setup — Individual",
    revision: "06/25",
    role: "Individual",
    description:
      "One-page quick reference: 3-step process for individual account setup and request submission.",
    url: "https://des.az.gov/cbc",
  },
  {
    id: "guide-individual-quick-es",
    number: "CBC-1001A-S",
    title: "CBC Quick Setup — Individual (Spanish)",
    revision: "06/25",
    role: "Individual",
    description:
      "Spanish-language version of the Individual Quick Setup flyer.",
    url: "https://des.az.gov/cbc",
  },
  {
    id: "guide-employer-full",
    number: "CBC-1002A",
    title: "CBC Employer and Agency User Guide",
    revision: "03/25",
    role: "Employer / Agency",
    description:
      "Full guide: employer/agency account creation, employee management, caregiver requests, dashboard, recheck confirmations, DPS PSP setup.",
    url: "https://des.az.gov/cbc",
  },
  {
    id: "guide-employer-quick",
    number: "CBC-1003A",
    title: "CBC Quick Setup — Employer and Agency",
    revision: "01/25",
    role: "Employer / Agency",
    description:
      "One-page quick reference: create account, share CBC email with employees, add agency connections, receive results.",
    url: "https://des.az.gov/cbc",
  },
  {
    id: "guide-recheck",
    number: "CBC-1009A",
    title: "CBC Recheck Process",
    revision: "05/25",
    role: "Employer",
    description:
      "Explains automated recheck process: employers must confirm or remove employees within 5 calendar days or the background check auto-expires.",
    url: "https://des.az.gov/cbc",
  },
];
