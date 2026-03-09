/**
 * CBC Portal FAQ — sourced from https://cbc.az.gov/#homepagefaq
 * Categories match the tab labels on the portal: General, Individual, Employer, Agency, DES
 */
export const cbcFAQ = [
  // ─── GENERAL ────────────────────────────────────────────────────────────────
  {
    id: "general-what-is-cbc",
    category: "General",
    question: "What is the Arizona Centralized Background Checks (CBC)?",
    answer:
      "The Arizona Centralized Background Checks (CBC) is a web portal for Individuals, Employers, and Agencies to access background check results from the DCS Central Registry and Adult Protective Services (APS) Registry, and to receive Fingerprint Clearance Card (FCC) status updates from DPS.",
  },
  {
    id: "general-fee",
    category: "General",
    question: "Is there a fee for the CBC background checks?",
    answer:
      "No, there are no fees for CBC checks. However, there is a separate fee for the Fingerprint Clearance Card (FCC), which is processed by DPS — not through the CBC portal.",
  },
  {
    id: "general-who-can-use",
    category: "General",
    question: "Who can use the CBC?",
    answer:
      "Anyone who supports the following roles and functions can use the CBC:\n\n• Individual — a person who needs a background check to gain or retain employment, volunteer service, or for personal reasons.\n• Caregiver — an individual applying to become a DCS caregiver (foster parent, placement provider, or guardian).\n• Employer — an organization that initiates or manages background check requests for employees, applicants, or DCS caregivers.\n• Agency — an organization that oversees or monitors multiple employers' background check statuses.",
  },
  {
    id: "general-who-can-request",
    category: "General",
    question: "Who can request a background check?",
    answer:
      "A background check request can only be submitted by the person who needs the background check — to gain or retain employment, to become a DCS caregiver (foster parent, placement provider, or guardian), or for personal reasons. Employers do not submit requests on behalf of employees; instead, the employer shares their CBC email address so the employee can initiate the request themselves.",
  },
  {
    id: "general-process",
    category: "General",
    question: "What is the CBC background check process?",
    answer:
      "The CBC process has three steps:\n\n1. Create an Account — Determine your role (Individual, DCS Caregiver, Employer, or Agency) and create or log in to your account at cbc.az.gov. If you already have a DPS PSP account, log in with those credentials — no new account is needed.\n\n2. Submit a Request — For Employment: provide your employer's CBC email (and DES Division info if applicable). For Caregiver: provide the agency's CBC email and household adult information. For Personal: upload a signed notarized affidavit (form CSO-3663).\n\n3. Get Results — When results are available, CBC sends an email notification. Log in and check your Dashboard → Recent Notifications.",
  },
  {
    id: "general-get-started",
    category: "General",
    question: "How do I get started using the CBC?",
    answer:
      "Visit the DES CBC Resources page at des.az.gov/cbc and review the Quick Setup Guides:\n\n• CBC-1001A: Individual Quick Setup (3-step flyer)\n• CBC-1003A: Employer and Agency Quick Setup (4-step flyer)\n• CBC-1000A: Individual User Guide (full step-by-step)\n• CBC-1002A: Employer and Agency User Guide (full step-by-step)\n\nAll guides are available for download on the DES CBC Resources page.",
  },
  {
    id: "general-fcc-info",
    category: "General",
    question:
      "What Fingerprint Clearance Card information is available from the CBC?",
    answer:
      "Fingerprint Clearance Card (FCC) status in the CBC Portal is for informational purposes only. No result details or notifications will be provided through the CBC. For questions about FCC status, approval, or denial, individuals must contact DPS directly through the Public Services Portal at psp.azdps.gov.",
  },
  {
    id: "general-additional-sources",
    category: "General",
    question:
      "What if I need additional sources checked for positions with direct service to children or vulnerable adults?",
    answer:
      "The following sources are available for positions providing direct services to children or vulnerable adults:\n\n• DCS Central Registry — records of individuals found responsible for child abuse or neglect (checked via CBC)\n• APS Registry — substantiated abuse or neglect findings for vulnerable adults (automatically included in CBC requests)\n• DPS Fingerprint Clearance Card — criminal history background check through DPS (status available in CBC for informational purposes only)\n\nFor positions requiring FBI checks or additional clearances, contact the applicable licensing or regulatory agency.",
  },
  {
    id: "general-aps-auto",
    category: "General",
    question:
      "Why is the Adult Protective Services (APS) automatically included in the background check request?",
    answer:
      "The CBC is designed to provide more comprehensive background information for those serving vulnerable populations. Including APS Registry results alongside the DCS Central Registry check gives employers and agencies greater visibility and information to make informed decisions about individuals in direct-service roles.",
  },
  {
    id: "general-dcs-cr-removal",
    category: "General",
    question:
      "What is the process to remove someone from the DCS Central Registry?",
    answer:
      "For the DCS Central Registry: the individual may contact the DCS Protective Services Review Team to request a review of the background check finding. The CBC portal does not manage or process Central Registry appeals — those must be directed to DCS directly.",
  },
  {
    id: "general-accessibility",
    category: "General",
    question: "Is the CBC site accessible for a screen reader?",
    answer:
      "Yes. The CBC portal supports both the Non-Visual Desktop Access (NVDA) screen reader (available at nvaccess.org) and Job Access With Speech (JAWS). If a caller experiences accessibility issues on the site, direct them to CBC Technical Support at cbc.az.gov/contact-us.",
  },

  // ─── INDIVIDUAL ─────────────────────────────────────────────────────────────
  {
    id: "individual-request-status",
    category: "Individual",
    question: "How can I find the status of a background check request?",
    answer:
      "Log in to the CBC at cbc.az.gov and click 'Dashboard' in the upper right corner. The Dashboard has sections for each request type: Employment, Caregiver, and Individual/Personal. Check 'Recent Notifications' for any unread messages or result updates.",
  },
  {
    id: "individual-expired-request",
    category: "Individual",
    question: "A request is expired — what should I do?",
    answer:
      "An employment background check will expire if:\n• The ongoing Employee/Employer relationship is not confirmed within 5 calendar days of a recheck notification, or\n• The annual background check renewal is not submitted before the expiration date.\n\nIf a check has expired, the individual must log in to the CBC and submit a new background check request. All previously connected employers/agencies are notified of the expiration.",
  },
  {
    id: "individual-change-account-type",
    category: "Individual",
    question: "Can I change my account type if I set it up incorrectly?",
    answer:
      "To change your CBC account type (for example, from Individual to Employer), you must contact CBC Technical Support at cbc.az.gov/contact-us. Account type changes cannot be made by the account holder directly through the portal.",
  },
  {
    id: "individual-edit-contact",
    category: "Individual",
    question:
      "Can I edit the email address and/or phone number on my CBC account?",
    answer:
      "To update contact information on a CBC account: log in to cbc.az.gov, click 'Hi [your name]' in the upper right corner, and navigate to your profile settings. Note: if the account is linked to a DPS PSP account, some changes may need to be made at psp.azdps.gov first.",
  },
  {
    id: "individual-dps-support",
    category: "Individual",
    question:
      "Where should I reach out to get my DPS/FCC account unlocked or the password reset?",
    answer:
      "For technical assistance with the CBC application at cbc.az.gov (login issues, account access, portal questions), contact CBC Technical Support at cbc.az.gov/contact-us.\n\nFor issues specifically related to the DPS Public Services Portal (PSP) or Fingerprint Clearance Card, contact DPS directly through psp.azdps.gov.",
  },
  {
    id: "individual-locked-out",
    category: "Individual",
    question:
      "I got locked out of the portal. Will my account reset over a period of time, or do I have to call someone?",
    answer:
      "Your CBC account will unlock automatically after 24 hours. You will receive an email notification once it has been unlocked after your next successful login. If you cannot wait, contact CBC Technical Support at cbc.az.gov/contact-us for assistance.",
  },

  // ─── EMPLOYER ───────────────────────────────────────────────────────────────
  {
    id: "employer-share-email",
    category: "Employer",
    question:
      "How does an employee or applicant submit a background check request for my organization?",
    answer:
      "Employers do not submit requests on behalf of employees. Instead, share your organization's CBC account email address with the applicant or employee. They log in to the CBC and submit an Employment background check request using your CBC account email. If your organization is a DES contractor or service provider, also provide the DES Division name and your Solicitation/Contract/Provider ID.",
  },
  {
    id: "employer-group-email",
    category: "Employer",
    question: "What email address should I use for my CBC Employer account?",
    answer:
      "Use a group or company email address (not a personal email) for your Employer CBC account. This ensures business continuity when staff changes occur, since the CBC account email is what employees use to send background check requests to your organization.",
  },
  {
    id: "employer-add-agency",
    category: "Employer",
    question: "How does an Employer add a Connected Agency Account?",
    answer:
      "Log in to the CBC and click 'Continue' on the 'View Connected Agency Accounts' tile. Click 'Add Agency', enter the agency's CBC account email, and click 'Continue'. The agency connection will then be established.",
  },
  {
    id: "employer-recheck",
    category: "Employer",
    question:
      "What is the automated recheck process and what is an employer's responsibility?",
    answer:
      "The CBC runs automated rechecks twice per week on active employment background checks. If a recheck triggers a notification, the employer must log in to the Dashboard and either:\n• Select the employee checkbox and click 'Confirm Relationship', or\n• Select the employee checkbox and click 'Remove Relationship'.\n\nEmployers must respond within 5 calendar days. If no action is taken, the background check automatically expires and the individual is removed from the employer's dashboard. All connected parties are notified.",
  },
  {
    id: "employer-dps-psp-types",
    category: "Employer",
    question:
      "Are there any DPS PSP account types that cannot be used to log in to the CBC?",
    answer:
      "Yes. The following DPS PSP account types are routed to DPS — not the CBC portal — and cannot be used to create a CBC Employer account:\n• School Admin/HR\n• State Licensing Agency\n• APT Agency\n• School District\n\nIf an employer has one of these account types, direct them to contact CBC Technical Support at cbc.az.gov/contact-us.",
  },

  // ─── AGENCY ─────────────────────────────────────────────────────────────────
  {
    id: "agency-role",
    category: "Agency",
    question:
      "What is the difference between an Employer and an Agency in the CBC?",
    answer:
      "An Employer role is for organizations that initiate and manage background check requests for their own employees, applicants, or DCS caregivers. An Agency role is for organizations that oversee or monitor one or more employers' background check statuses — agencies do not submit background check requests directly. A single employer account can be connected to multiple agency accounts.",
  },
  {
    id: "agency-caregiver-request",
    category: "Agency",
    question:
      "What information is needed to submit a Caregiver background check request?",
    answer:
      "Caregiver background checks are submitted by the individual (not the agency). The individual needs:\n• The agency's CBC account email address\n• For each adult (18+) in the household: full name, date of birth, Social Security Number, FCC Application Number, any other names used\n• A signed affidavit for each adult household member (form CSO-3663 in English or CSO-3663S in Spanish), uploaded directly to the CBC portal.",
  },

  // ─── DES ────────────────────────────────────────────────────────────────────
  {
    id: "des-affiliation",
    category: "DES",
    question:
      "What DES affiliation options are available for Employer accounts?",
    answer:
      "DES contractors and service providers select their affiliation category when setting up an Employer account:\n• Current Contractor/Service Provider\n• Potential Contractor/Service Provider\n• DES HR\n• Not Affiliated\n\nIf affiliated, the employer also selects the applicable DES Division: DDD, DCC, DCAD, DAAS, DERS, AzEIP, or OP (Office of Procurement).",
  },
  {
    id: "des-divisions",
    category: "DES",
    question:
      "What are the DES Divisions listed in the CBC employer account setup?",
    answer:
      "DES Divisions available for selection in CBC employer accounts:\n• DDD — Division of Developmental Disability\n• DCC — Division of Child Care\n• DCAD — Division of Community Assistance and Development\n• DAAS — Division of Aging and Adult Services\n• DERS — Division of Employment and Rehabilitation Services\n• AzEIP — Division of Arizona Early Intervention Program\n• OP — Office of Procurement",
  },
  {
    id: "des-contract-info",
    category: "DES",
    question:
      "What Solicitation/Contract/Provider ID information do DES contractors provide to employees?",
    answer:
      "When an employer is a DES contractor or service provider, they share three pieces of information with employees so the employee can complete their Employment background check request:\n1. The employer's CBC account email address\n2. The DES Division name (e.g., DDD, DCC)\n3. The Solicitation Number, Contract Number, or Provider ID associated with the DES contract",
  },
];

export const cbcFAQCategories = [
  "General",
  "Individual",
  "Employer",
  "Agency",
  "DES",
];
