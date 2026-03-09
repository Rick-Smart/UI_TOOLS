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

export const supportResources = [];

export const contactInfo = {
  phones: [],
  emails: [],
  website: "https://des.az.gov",
};
