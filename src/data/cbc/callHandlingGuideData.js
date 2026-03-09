export const callGuideMeta = {
  title: "Centralized Background Checks Call Center Call Handling Guide",
  version: "V.1.0.2026",
  program: "CBC",
};

export const managingCallSteps = [
  "Prepare",
  "Greet the caller",
  "Verify the caller",
  "Identify the reason for calling (RFC)",
  "General account review",
  "Notate the case",
  "Close the call",
];

export const orderedCallChecklist = [
  "Confirm On Queue status and systems ready.",
  "Deliver correct greeting.",
  "Verify caller identity.",
  "Confirm callback number.",
  "Capture and paraphrase reason for calling (RFC).",
  "Set hold expectation and complete account review.",
  "Provide status update and next steps in plain language.",
  "Add complete case note fields.",
  "Close call with closing script.",
];

export const unableToVerifyProtocol = [
  "If caller fails verification, stop account-specific discussion.",
  "Provide only general program information.",
  "Do not disclose account-specific status or documents.",
  "Advise caller to call back with required verification information.",
  "Document in notes that verification was not completed.",
];

export const prepareChecklist = [
  "Set status to On Queue.",
  "Have all required systems/screens ready before taking calls.",
  "Use inbound greeting script for inbound calls.",
];

export const greetingScripts = {
  inbound:
    "Thank you for calling Arizona Centralized Background Checks. My name is [First Name]. Who am I speaking with today? How may I help you?",
  callback:
    "Hello, I'm with Arizona Centralized Background Checks returning your call. My name is [First Name]. Who am I speaking with today? How may I help you?",
};

export const noteRequirements = [
  "Date and time of contact.",
  "Caller name and verification status.",
  "RFC — reason for call.",
  "Actions taken and outcome.",
  "Next steps provided to caller.",
];

export const voicemailScripts = {
  voicemail:
    "Thank you for calling Arizona Centralized Background Checks. My name is [First Name]. A party at this number requested a callback. We're sorry we missed you. Please call us back when available. [Add contact number and hours when available.]",
  ghost:
    "Hello, [caller name]? (wait 3 seconds) Hello, [caller name]? (wait 3 seconds) [Caller name], I cannot hear you. Please call us back when you are available, and we will be happy to assist you. [Add contact number and hours when available.]",
};

export const verificationGuides = {
  pinVerified: ["[Verification steps for PIN-verified callers — to be added.]"],
  noPin: [
    "[5-point verification steps for callers without a PIN — to be added.]",
  ],
  employer: ["[Employer verification steps — to be added.]"],
};

export const rfcPrompts = {
  openers: [
    "How can I help you today?",
    "What questions do you have about your background check today?",
  ],
  followUps: [
    "[Follow-up prompts to be added as CBC documentation becomes available.]",
  ],
  paraphrase: "You are wondering ______. Is that correct?",
  holdInitial:
    "Can I place you on a brief hold while I review your information? This should take about 5-7 minutes.",
  holdCheckIn:
    "Thank you for your patience; I'm still reviewing your information. Would you mind holding for 3-5 more minutes?",
};

export const generalReviewChecklist = [
  "[General account review steps to be added as CBC documentation becomes available.]",
];

export const noteDoNotInclude = [
  "Another team member name",
  "Personal comments or characterizations of caller demeanor unless a threat or safety concern exists",
];

export const closeScript =
  "Before I end the call, do you have any other questions or concerns? Thank you for calling and have a great rest of your day.";

export const difficultCallerScripts = {
  warning1:
    "Mr/Ms [Name], I am making every effort to keep our call professional in order to address the concerns you have expressed. I would appreciate that you do the same.",
  warning2:
    "Mr/Ms [Name], as I stated before, I am making every effort to keep our call professional. If you are unable to discuss this in a calm manner, I will need to disconnect the call and ask that you call back when you are able to discuss this professionally.",
  final:
    "I'm sorry Mr/Ms [Name], but I'm going to disconnect the call now due to repeated bad language/yelling/screaming. Please call back when you are able to discuss the matter calmly.",
  noteSuffix:
    "Caller being unprofessional. Agent followed protocol. Advised caller to call back when calm. Call ended by agent.",
};

export const customerServiceHighlights = [
  "Use a friendly tone and positive ownership statements.",
  "Defer final decisions to Department and applicable law when discussing outcomes.",
  "Use active listening and reflect back caller concerns before resolution steps.",
  "Keep calls focused and summarize next steps frequently.",
  "Provide hold updates regularly.",
  "When caller cannot hold, thank them, explain remaining tasks, and close professionally.",
];

export const supportResources = [];

export const contactInfo = {
  unemploymentPhones: ["[CBC main contact number — to be added.]"],
  automatedSystem: [],
  internalTransfers: [],
  emails: [],
  mailingAddress: [],
  fax: [],
  website: "https://des.az.gov",
};
