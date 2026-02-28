export const selfHelpGuideContent = {
  title: "AZDES Self-Help Guide",
  description:
    "Quick guide for sign-in and profile lookup steps, including where to locate EIN after login.",
  loginUrl: "https://adselfservice.azdes.gov/",
  loginSteps: [
    "Go to the AZDES self-help login page.",
    "Enter your username using your C# (example: C0XXXXX) and your password.",
    "Confirm the environment is set to AZDESGOV.",
    "Select Login.",
  ],
  einLookupSteps: [
    "After login, open the Profile tab in the top navigation.",
    "Scroll to the Attributes section in the profile view.",
    "Locate EIN in the Attributes list.",
    "Use EIN value as needed for approved workflow steps.",
  ],
  troubleshootingNotes: [
    "Use Forgot your password? for password reset workflow.",
    "Use Account locked out? to recover access after lockout.",
    "If they cannot complete this process, contact the Resolution Center at 602.364.4419 to reset their password.",
    "If account access still fails, escalate through approved internal support path.",
  ],
};

/*
  Workflow resource authoring standard (use for all future workflows):
  - Use type: "image-sequence" for multi-step flows.
  - Keep images in process order (index maps to Step 1, Step 2, ...).
  - Keep each image's instructions in the page-level workflowInstructionSets array
    at the same index as the image.
  - Avoid adding duplicate heading/caption text that repeats Step badge labels.
*/
export const selfHelpMediaResources = [
  {
    id: "self-help-login-ein-sequence",
    title: "Screenshots: Login and Profile EIN process",
    type: "image-sequence",
    topic: "Login & Access",
    caption: "Step 1: Login screen. Step 2: Profile Attributes EIN location.",
    images: [
      {
        id: "self-help-login-image",
        src: "media/AZDES LOGIN.png",
        alt: "AZDES self-help login screen with username, password, and AZDESGOV environment selector",
        caption: "Step 1: Login screen reference.",
      },
      {
        id: "self-help-ein-image",
        src: "media/EIN path.jpg",
        alt: "AZDES profile screen showing where to find EIN in the Attributes section",
        caption: "Step 2: Profile/EIN reference.",
      },
    ],
  },
];

export const claimantResourcesContent = {
  title: "Claimant Resources",
  description:
    "Claimant-facing self-help guides and resources that agents can share during support calls.",
  quickShareLinks: [
    {
      label: "AZDES Self-Service Login",
      url: "https://adselfservice.azdes.gov/",
      topic: "Login & Access",
    },
    {
      label: "CACTUS Login Recovery (Video)",
      url: "https://www.youtube.com/watch?v=ap023-w8Vdk",
      topic: "Login & Access",
    },
    {
      label: "How to Retrieve Username and Password (PDF)",
      url: "media/claimant-cactus-how-to/How-to-Retrieve-Username-and-Password.pdf",
      isLocalMedia: true,
      topic: "Login & Access",
    },
  ],
};

/*
  Claimant resource standard:
  - Keep shareable links in claimantResourcesContent.quickShareLinks for quick copy.
  - For workflow media, use type: "image-sequence" and keep instructions aligned by index.
*/
export const claimantMediaResources = [
  {
    id: "claimant-cactus-login-recovery-video",
    title: "CACTUS login recovery walkthrough",
    type: "video",
    topic: "Login & Access",
    embedUrl: "https://www.youtube.com/embed/ap023-w8Vdk?si=KAHJUIxsA0Nep6TG",
    openUrl: "https://www.youtube.com/watch?v=ap023-w8Vdk",
    caption: "Claimant-facing video for recovering CACTUS login access.",
  },
  {
    id: "claimant-credentials-pdf",
    title: "Claimant guide: retrieve username and password",
    type: "pdf",
    topic: "Login & Access",
    src: "media/claimant-cactus-how-to/How-to-Retrieve-Username-and-Password.pdf",
    caption: "Claimant-facing quick guide PDF.",
    embed: true,
  },
];
