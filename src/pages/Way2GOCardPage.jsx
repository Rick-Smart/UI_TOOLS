import PageSection from "../components/layout/PageSection";
import CopyButton from "../components/ui/CopyButton/CopyButton";

const scenarios = [
  {
    id: "address-change",
    title: "Claimant always had Debit Card — updated address after filing",
    badge: "Address Mismatch",
    badgeType: "warn",
    steps: [
      "Review the claimant's MAILING ADDRESS in CACTUS.",
      "Confirm whether the claimant updated their Residence Address but did NOT update their Mailing Address.",
      "If Mailing and Residence Addresses are the same, review both for accuracy.",
    ],
    note: "When the claimant has maintained the Debit Card as their ONLY payment option, CACTUS generates a third-party report to Comerica advising of any Mailing Address changes. The claimant must allow at least TWO business days for the changes to take effect.",
    escalate: false,
  },
  {
    id: "new-claim",
    title: "New claim (filed within last 30 days) — card not yet received",
    badge: "Timing / First Payment",
    badgeType: "info",
    steps: [
      "Open the PAYMENT REGISTER and locate the FIRST Payment Issue date.",
      "Confirm benefits have been released and issued to the Debit Card (Payment Status = PAID).",
      "Advise the claimant: UI does not trigger the Way2GO card mailing until the FIRST payment has been issued.",
      "From that issue date, allow an additional 10–12 business days for Comerica to mail the card.",
      "Remind the claimant the card arrives in a plain white envelope and will NOT be forwarded by USPS — if undeliverable it returns to Comerica.",
    ],
    note: "If the claimant has always had Debit Card selected but the FIRST payment in the Payment Register shows any status other than PAID — escalate. This indicates a delay in the Debit Card mailing trigger.",
    escalate: false,
    escalateConditional: true,
  },
  {
    id: "switched-from-dd",
    title:
      "Claimant switched from Direct Deposit to Debit Card, then updated address",
    badge: "Escalate",
    badgeType: "error",
    steps: [
      "Ask the claimant: What date did you change your Payment Option from Direct Deposit to Debit Card?",
      "Ask the claimant: What date did you update your Mailing Address?",
      "If the claimant does not know either date, note that in your Brief Description.",
      "Escalate — it is unclear whether address changes made after a Direct Deposit → Debit Card switch are reported through the third-party address change reporting process.",
    ],
    note: "Include both dates (or document that the claimant was unable to provide them) in your escalation's Brief Description.",
    escalate: true,
  },
  {
    id: "lost-stolen",
    title: "Claimant reports card lost or stolen",
    badge: "Refer to Comerica",
    badgeType: "error",
    steps: [
      "Advise the claimant that lost or stolen card issues must be handled directly by Comerica – Way2GO.",
      "We are unable to assist with lost or stolen cards.",
    ],
    note: "Direct the claimant to Comerica – Way2GO for all lost/stolen card inquiries. Do not attempt to process or escalate internally.",
    escalate: false,
    referExternal: true,
  },
];

const badgeClass = {
  warn: "badge badge--warn",
  info: "badge badge--info",
  error: "badge badge--error",
};

function buildSummary() {
  return [
    "Way2GO / Debit Card Issue — Scenario Reference",
    "",
    ...scenarios.map(
      (s) =>
        `[${s.badge}] ${s.title}\n  Steps:\n${s.steps.map((st) => `    • ${st}`).join("\n")}\n  Note: ${s.note}`,
    ),
  ].join("\n");
}

function Way2GOCardPage() {
  return (
    <PageSection
      title="Way2GO Debit Card Issues"
      description="Resolution guidance for claimants who have not received, lost, or have address issues with their Way2GO / EPC Debit Card."
      headerContent={
        <CopyButton getSummary={buildSummary} memoryKey="Way2GO Card Issues" />
      }
    >
      <div className="stack">
        <div className="result">
          <p className="muted">
            <strong>Important:</strong> Claimants do NOT receive a Way2GO Card
            until their <strong>FIRST PAYMENT</strong> has been approved,
            released, and issued to the Debit Card. Verify all payment activity
            in the claimant&apos;s <strong>Payment Register</strong> in CACTUS.
            From the First Payment Issue Date, allow an additional{" "}
            <strong>10–12 days</strong> for delivery. The card arrives in a
            plain white envelope and will <strong>not</strong> be forwarded by
            USPS.
          </p>
        </div>

        {scenarios.map((scenario) => (
          <div key={scenario.id} className="card stack">
            <div className="title-row">
              <h3 className="page-section-title">{scenario.title}</h3>
              <span className={badgeClass[scenario.badgeType] ?? "badge"}>
                {scenario.badge}
              </span>
            </div>

            <ol className="list">
              {scenario.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>

            {scenario.note && (
              <div className="result">
                <p className="muted">
                  <strong>Note:</strong> {scenario.note}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </PageSection>
  );
}

export default Way2GOCardPage;
