export const callGuideMeta = {
  title: "Unemployment Insurance Call Center Call Handling Guide",
  version: "V.2.2.2026",
  program: "VALOR",
};

export const managingCallSteps = [
  "Prepare",
  "Greet the caller",
  "Verify the caller",
  "Identify the reason for calling (RFC)",
  "General claim review",
  "Notate the case",
  "Close the call",
];

export const orderedCallChecklist = [
  "Confirm On Queue status and systems ready.",
  "Deliver correct greeting (Inbound or Callback).",
  "Verify caller identity (PIN flow, 5-point no-PIN flow, or employer flow).",
  "Confirm callback number.",
  "Capture and paraphrase reason for calling (RFC).",
  "Set hold expectation and complete general claim review.",
  "Provide status update and next steps in plain language.",
  "Remind claimant to continue weekly certifications.",
  "Add complete case note fields.",
  "Close call with closing script and transfer to survey.",
];

export const unableToVerifyProtocol = [
  "If claimant fails 5-point verification, stop case-specific discussion.",
  "Provide only general UI program information.",
  "Do not disclose claim-specific status, determinations, balances, or documents.",
  "Advise claimant to call back with required verification information.",
  "Document in notes that verification was not completed and general information only was provided.",
];

export const prepareChecklist = [
  "Set status to On Queue.",
  "Have all required systems/screens ready before taking calls.",
  "Use inbound greeting script for inbound calls.",
  "Use callback script for IVR callback requests.",
];

export const greetingScripts = {
  inbound:
    "Thank you for calling Arizona Unemployment. My name is [First Name]. Who am I speaking with today? How may I help you?",
  callback:
    "Hello, I’m with Arizona Unemployment returning your call. My name is [First Name]. Who am I speaking with today? How may I help you?",
  proxy:
    "If the claimant gives permission to speak with a proxy, obtain verbal approval and add a case note that permission applies to this interaction only.",
};

export const voicemailScripts = {
  voicemail:
    "Thank you for calling Arizona Unemployment. My name is [First Name]. A party at this number requested a callback from Unemployment. We’re sorry we missed you. Please call us back when available. If you have an established claim, please have your SSN and PIN ready. Toll-free: 1-877-600-2722. Hours: Monday-Friday, 8:00 a.m. to 4:00 p.m. Thank you.",
  ghost:
    "Hello, [claimant name]? (wait 3 seconds) Hello, [claimant name]? (wait 3 seconds) [Claimant name], I cannot hear you. Please call us back when you are available, and we will be happy to assist you. If you have an established claim, please have your SSN and PIN ready. Toll-free: 1-877-600-2722. Hours: Monday-Friday, 8:00 a.m. to 4:00 p.m. Thank you.",
};

export const verificationGuides = {
  pinVerified: [
    "I see that you verified with your SSN and PIN.",
    "Confirm callback number in case of disconnect.",
    "Verify last employer and alternate employer name if needed.",
    "Then proceed to reason for calling.",
  ],
  noPin: [
    "Collect SSN.",
    "Collect full name as shown on UI claim.",
    "Collect full mailing address as shown on UI claim.",
    "Collect full last employer name.",
    "Collect DOB.",
    "If claimant does not pass 5-point verification, provide only general UI program information.",
  ],
  employer: [
    "Verify claimant SSN.",
    "Verify full employee name.",
    "Verify employer name.",
  ],
};

export const rfcPrompts = {
  openers: [
    "How can I help you today?",
    "What questions do you have about your unemployment claim today?",
  ],
  followUps: [
    "When was the last date that you received a benefit payment?",
    "Can you log in to your online portal and do you have full access?",
    "Did you receive the letter sent on [date] requesting information?",
  ],
  paraphrase: "You are wondering ______. Is that correct?",
  holdInitial:
    "Can I place you on a brief hold while I review your case notes? This should take about 5-7 minutes.",
  holdCheckIn:
    "Thank you for your patience; I’m still reviewing your information. Would you mind holding for 3-5 more minutes?",
};

export const generalReviewChecklist = [
  "Review SSN, name, language, and PIN verification status.",
  "Review weekly certifications, including paper certs uploaded to portal.",
  "Review active issues, reasonable attempt history, prior employers, overpayments, notes, and fact-finding.",
  "If No Valid Certifications, advise claimant that weekly certifications are required.",
  "Paper weekly claims should be escalated through supervisor support to add certifications in system.",
  "Excessive Earnings / Decline to File / Declined-Returned to Work are not valid certifications for determination progression.",
  "Hidden separations require adjudication and may affect prior weeks.",
  "If denied and caller disagrees, provide appeal direction.",
  "If appeal already filed, provide Appeals contact information for status.",
  "Do not provide determination timeframes.",
];

export const noteRequirements = [
  "Agent name - FirstName_LastInitial",
  "Time of call",
  "Reason for call",
  "Actions taken (including dropped-call callback attempts)",
  "Important information for next team member",
  "Next steps",
  "Use approved abbreviations only",
];

export const noteDoNotInclude = [
  "Another team member name",
  "Personal comments/characterizations of claimant demeanor unless threat/safety concern exists",
];

export const closeScript =
  "Before I end the call, do you have any other questions or concerns? Thank you for calling and have a great rest of your day. I will transfer you to the survey now.";

export const difficultCallerScripts = {
  warning1:
    "Mr/Ms [Name], I am making every effort to keep our call professional in order to address the concerns you have expressed. I would appreciate that you do the same.",
  warning2:
    "Mr/Ms [Name], as I stated before, I am making every effort to keep our call professional. If you are unable to discuss this in a calm manner, I will need to disconnect the call and ask that you call back when you are able to discuss this professionally.",
  final:
    "I’m sorry Mr/Ms [Name], but I’m going to disconnect the call now due to repeated bad language/yelling/screaming. Please call back when you are able to discuss the matter calmly.",
  noteSuffix:
    "CLMT being unprofessional. Agent followed protocol. Advsd CLMT to call back when calm. Call ended by agent.",
};

export const customerServiceHighlights = [
  "Use a friendly tone and positive ownership statements.",
  "Defer final decisions to Department and Arizona law when discussing outcomes.",
  "Use active listening and reflect back caller concerns before resolution steps.",
  "Use funnel questions: open -> empathy bridge -> probing -> closed yes/no.",
  "Keep calls focused and summarize next step frequently.",
  "Provide hold updates every 5-10 minutes (every ~2 minutes for highly emotional calls if hold is required).",
  "When caller cannot hold, thank them, explain remaining tasks, capture callback number, and close professionally.",
  "Offer concrete next-step options instead of saying there is nothing that can be done.",
];

export const supportResources = [
  {
    name: "Nutrition, Cash and Medical Assistance",
    phone: "(855) 432-7587",
    url: "https://www.healthearizonaplus.gov",
  },
  {
    name: "DES Coordinated Hunger Relief Program",
    phone: "",
    url: "http://www.azfoodbanks.org",
  },
  {
    name: "Congregate and Home Delivered Meals",
    phone: "",
    url: "https://des.az.gov/services/older-adults/healthy-living/congregate-home-delivered-meals",
  },
  {
    name: "Short-Term Crisis Services",
    phone: "",
    url: "https://des.az.gov/services/child-and-family/short-term-crisis-services",
  },
  {
    name: "Community Resources",
    phone: "",
    url: "https://des.az.gov/services/community-resources",
  },
  {
    name: "Child Care Assistance",
    phone: "",
    url: "https://des.az.gov/services/child-and-family/child-care",
  },
];

export const contactInfo = {
  unemploymentPhones: [
    "Toll Free: 1 (877) 600-2722",
    "Phoenix: (602) 364-2722",
    "Tucson: (520) 791-2722",
    "Telecommunications Relay Service: 711",
  ],
  automatedSystem: [
    "Toll Free: 1 (877) 766-8477",
    "Phoenix: (602) 417-3800",
    "Tucson: (520) 884-8477",
  ],
  internalTransfers: [
    "BPC: 602-364-4300",
    "OARC: 800-236-1475",
    "UI Appeals: 877-528-3330 or 602-771-9019",
  ],
  emails: ["UIclaimDocs@azdes.gov"],
  mailingAddress: [
    "Department of Economic Security",
    "Unemployment Insurance Administration",
    "P. O. Box 29225",
    "Phoenix, Arizona 85038-9225",
  ],
  fax: [
    "Phoenix: (602) 364-1210 / (602) 364-1211",
    "Tucson: (520) 770-3357 / (520) 770-3358",
  ],
  website: "https://azui.gov",
};
