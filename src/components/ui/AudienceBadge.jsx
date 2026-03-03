function getAudienceLabel(audience) {
  if (audience === "agent") {
    return "Agent Tool";
  }

  if (audience === "claimant") {
    return "Claimant Support";
  }

  return "";
}

function AudienceBadge({ audience }) {
  const label = getAudienceLabel(audience);
  if (!label) {
    return null;
  }

  return <span className={`audience-badge audience-${audience}`}>{label}</span>;
}

export default AudienceBadge;
