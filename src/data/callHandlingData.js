export const greetingScripts = {
  inbound:
    "Thank you for calling Arizona Unemployment. My name is [First Name], Agent number [Deputy #]. Who am I speaking with today? How may I help you?",
  callback:
    "Hello, I’m with Arizona Unemployment returning your call. My name is [First Name], deputy number [Deputy #]. Who am I speaking with today? How may I help you?",
};

export const verificationScripts = {
  claimantPin: [
    "I see that you verified with your SSN and PIN.",
    "In case we get disconnected, is your phone number: [read back number]?",
    "Can you verify your last employer? If needed, ask for other employer names.",
  ],
  claimantNoPin: [
    "Before we begin, I need to verify your claim details.",
    "Collect: SSN, full name, full mailing address, last employer name, DOB.",
    "If verification does not pass, provide only general program information.",
  ],
  employer: [
    "Please verify the claimant SSN.",
    "Please verify the employee full name.",
    "Please verify the employer name.",
  ],
};

export const callFlowChecklist = [
  "Set status to On Queue and prepare systems",
  "Greet caller with name and deputy number",
  "Complete claimant/employer verification",
  "Confirm reason for calling and paraphrase back",
  "Place on hold with estimated time and reason",
  "Complete claim review and identify required actions",
  "Provide status update, next steps, and weekly filing reminder",
  "Add case note with required fields and actions",
  "Set wrap-up code",
  "Close call and route to survey",
];

export const rfcPrompts = [
  "How can I help you today?",
  "What questions do you have about your unemployment claim today?",
  "When was the last date you received a benefit payment?",
  "Are you able to log into your online portal with full access?",
  "Did you receive the letter/questionnaire requesting additional information?",
];

export const holdScripts = {
  initial:
    "Can I place you on a brief hold while I review your case notes? This should take about 5-7 minutes.",
  checkIn:
    "Thank you for your patience. I’m still reviewing your information. Would you mind holding for 3-5 more minutes?",
  extended:
    "I need to complete fact-finding steps and may need a 10-15 minute hold. Is that okay?",
};

export const closeScript =
  "Before I end the call, do you have any other questions or concerns? Thank you for calling and have a great rest of your day. I will transfer you to the survey now.";

export const difficultCallerScripts = {
  warning1:
    "I am making every effort to keep our call professional in order to address your concerns. I would appreciate that you do the same.",
  warning2:
    "As I stated before, I am making every effort to keep our call professional. If we cannot discuss this calmly, I will need to disconnect and ask that you call back when you are able to discuss this professionally.",
  final:
    "I’m sorry, but I’m going to disconnect the call now due to repeated yelling or abusive language. Please call back when you are able to discuss the matter calmly.",
};

export const callbackScripts = {
  voicemail:
    "Thank you for calling Arizona Unemployment. My name is [First Name], deputy number [Deputy #]. A party at this number requested a callback from Unemployment. We’re sorry we missed you. Please call us back when available. If you have an established claim, please have your SSN and PIN ready. Toll-free: 1-877-600-2722. Hours: Monday-Friday, 8:00 a.m. to 4:00 p.m.",
  dropped:
    "Hello, [Name]? (pause) Hello, [Name]? (pause) I cannot hear you. Please call us back when available and we will be happy to assist.",
};

export const contactNumbers = [
  { label: "UI Call Center (Toll-Free)", value: "1-877-600-2722" },
  { label: "UI Call Center (Phoenix)", value: "602-364-2722" },
  { label: "UI Call Center (Tucson)", value: "520-791-2722" },
  { label: "Relay Service", value: "711" },
  { label: "Automated System (Toll-Free)", value: "1-877-766-8477" },
  { label: "Automated System (Phoenix)", value: "602-417-3800" },
  { label: "Automated System (Tucson)", value: "520-884-8477" },
  { label: "Benefit Payment Control", value: "602-364-4300" },
  {
    label: "Office of Accounts Receivable and Collections",
    value: "800-236-1475",
  },
  { label: "UI Appeals", value: "877-528-3330 / 602-771-9019" },
  { label: "Claim Docs Email", value: "uiclaimdocs@azdes.gov" },
];

export const wrapUpCodes = [
  {
    code: "UIB-1099-G Request/Issue",
    use: "Caller requests help with 1099 form issues.",
  },
  {
    code: "UIB-1272 Review",
    use: "Manual review request for submitted paper weekly certifications.",
  },
  {
    code: "UIB-Appeal CLMT",
    use: "Claimant appeal filing support or direction.",
  },
  {
    code: "UIB-Appeal ER",
    use: "Employer appeal filing support or direction.",
  },
  {
    code: "UIB-Banking Info",
    use: "Direct deposit or Way2Go card assistance.",
  },
  {
    code: "UIB-Callback: Busy Tone",
    use: "Callback attempt reached busy tone.",
  },
  { code: "UIB-Callback: No Answer", use: "Callback attempt had no answer." },
  {
    code: "UIB-CLMT Docs",
    use: "Caller advises requested documents were submitted.",
  },
  {
    code: "UIB-CLMT No active Issue",
    use: "Claimant call with no active issue on claim.",
  },
  {
    code: "UIB-CLMT Timely Claim",
    use: "Claimant active issue age 21 days or less.",
  },
  {
    code: "UIB-CLMT Untimely Claim",
    use: "Claimant active issue older than 21 days.",
  },
  { code: "UIB-CWC Request", use: "Combined wage claim assistance request." },
  { code: "UIB-Dropped Call", use: "Call dropped during active interaction." },
  { code: "UIB-ER Call", use: "Inbound employer call." },
  {
    code: "UIB-Gen Claim Info",
    use: "General claim filing questions before online filing.",
  },
  {
    code: "UIB-Ghost Call",
    use: "No response from caller after ghost call scripting.",
  },
  { code: "UIB-IDme", use: "Caller reports ID.me issues and needs direction." },
  {
    code: "UIB-Missing Pymt",
    use: "Claim review request due to missing payment.",
  },
  {
    code: "UIB-Password / Login Issue",
    use: "Portal password or login help only.",
  },
  {
    code: "UIB-Revise Information",
    use: "Direction on updating claimant demographic information.",
  },
  { code: "UIB-UI OP", use: "Overpayment balance discrepancy follow-up." },
];
