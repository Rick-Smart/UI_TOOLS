import CBCCallHandlingPage from "../../pages/cbc/CBCCallHandlingPage";

export const cbcToolRegistry = [
  {
    path: "/call-handling",
    navLabel: "Call Handling",
    title: "CBC Call Handling Guide",
    description:
      "Scripts, verification flow, case notation, and call workflow support for CBC agents.",
    microGuide:
      "Use this page during live calls for scripts, note standards, and checklist completion.",
    component: CBCCallHandlingPage,
    audience: "agent",
  },
];

export const cbcSidebarSections = [
  { key: "agent", title: "Agent Tools", audience: "agent" },
];

export function buildCBCNavItems(basePath) {
  return [
    { to: `${basePath}/`, label: "Home", end: true, home: true },
    ...cbcToolRegistry.map((tool) => ({
      to: `${basePath}${tool.path}`,
      label: tool.navLabel,
      audience: tool.audience,
    })),
  ];
}

export function buildCBCHomeCards(basePath) {
  return cbcToolRegistry.map((tool) => ({
    to: `${basePath}${tool.path}`,
    title: tool.title,
    description: tool.description,
    audience: tool.audience,
  }));
}
