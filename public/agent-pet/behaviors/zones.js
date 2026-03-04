const FORM_AND_CALCULATOR_ROUTES = [
  "/base-period",
  "/benefit-award",
  "/weekly-payable",
  "/monetary-eligibility",
  "/date-helper",
  "/appeals-helper",
  "/document-search",
  "/program-triage",
];

export const PET_ROUTE_ZONES = {
  LEFT_ASSIST: "left-assist",
  RIGHT_SUMMARY: "right-summary",
  HEADER_PERCH: "header-perch",
  BOTTOM_ROAM: "bottom-roam",
  ROAM_FREE: "roam-free",
};

export function resolveRouteZone(pathname = "") {
  const route = String(pathname || "");

  if (route.includes("/call-handling")) {
    return PET_ROUTE_ZONES.LEFT_ASSIST;
  }

  if (route.includes("/work-search-log")) {
    return PET_ROUTE_ZONES.RIGHT_SUMMARY;
  }

  if (route.includes("/quick-reference")) {
    return PET_ROUTE_ZONES.HEADER_PERCH;
  }

  if (
    FORM_AND_CALCULATOR_ROUTES.some((candidate) => route.includes(candidate))
  ) {
    return PET_ROUTE_ZONES.BOTTOM_ROAM;
  }

  return PET_ROUTE_ZONES.ROAM_FREE;
}
