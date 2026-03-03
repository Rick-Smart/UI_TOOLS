export const scriptTypeOptions = [
  { key: "inboundGreeting", label: "Greeting (Inbound)" },
  { key: "callbackGreeting", label: "Greeting (Callback)" },
  { key: "voicemail", label: "Voicemail" },
  { key: "ghostCall", label: "Ghost Call" },
  { key: "closing", label: "Closing" },
];

export const scriptTypeKeys = scriptTypeOptions.map((item) => item.key);

export const stepScriptTypeMap = {
  1: "inboundGreeting",
  9: "closing",
};

export const suggestedScripts = {
  inboundGreeting: [
    "Thank you for calling Arizona Unemployment. This is [First Name]. Who am I speaking with today, and how can I help?",
    "You’ve reached Arizona Unemployment. My name is [First Name]. Who am I speaking with, and what can I help with today?",
  ],
  callbackGreeting: [
    "Hello, this is Arizona Unemployment returning your callback request. My name is [First Name]. Who am I speaking with, and how can I assist?",
    "Hi, this is [First Name] with Arizona Unemployment returning your call. Who am I speaking with, and how may I help today?",
  ],
  voicemail: [
    "Thank you for calling Arizona Unemployment. This is [First Name]. We’re sorry we missed you. Please call us back when available. If you have an established claim, please have your SSN and PIN ready. Toll-free: 1-877-600-2722. Hours: Monday-Friday, 8:00 a.m. to 4:00 p.m. Thank you.",
  ],
  ghostCall: [
    "Hello, [claimant name]? (pause) Hello, [claimant name]? I cannot hear you. Please call us back when available, and we will be happy to assist you. If you have an established claim, please have your SSN and PIN ready. Toll-free: 1-877-600-2722. Hours: Monday-Friday, 8:00 a.m. to 4:00 p.m. Thank you.",
  ],
  closing: [
    "Before we end the call, do you have any other questions? Thank you for calling Arizona Unemployment. I will transfer you to the survey now.",
    "Is there anything else I can help with today? Thank you for calling, and I will transfer you to the survey now.",
  ],
};

function buildScriptEntries(approvedText, suggestedEntries, customEntries) {
  return [
    { source: "approved", text: approvedText },
    ...suggestedEntries.map((text) => ({ source: "suggested", text })),
    ...customEntries.map((text, customIndex) => ({
      source: "custom",
      text,
      customIndex,
    })),
  ];
}

export function buildScriptCatalog({
  greetingScripts,
  voicemailScripts,
  closeScript,
  customScriptsByType,
}) {
  return {
    inboundGreeting: buildScriptEntries(
      greetingScripts.inbound,
      suggestedScripts.inboundGreeting || [],
      customScriptsByType.inboundGreeting || [],
    ),
    callbackGreeting: buildScriptEntries(
      greetingScripts.callback,
      suggestedScripts.callbackGreeting || [],
      customScriptsByType.callbackGreeting || [],
    ),
    voicemail: buildScriptEntries(
      voicemailScripts.voicemail,
      suggestedScripts.voicemail || [],
      customScriptsByType.voicemail || [],
    ),
    ghostCall: buildScriptEntries(
      voicemailScripts.ghost,
      suggestedScripts.ghostCall || [],
      customScriptsByType.ghostCall || [],
    ),
    closing: buildScriptEntries(
      closeScript,
      suggestedScripts.closing || [],
      customScriptsByType.closing || [],
    ),
  };
}
