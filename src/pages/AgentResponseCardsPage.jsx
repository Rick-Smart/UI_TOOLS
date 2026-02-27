import { useMemo, useState } from "react";
import Tooltip from "../components/Tooltip";

const cards = [
  {
    title: "Waiting week",
    response:
      "The first eligible weekly claim is a waiting week and is not payable. The first payable week is usually the week after the waiting week if all eligibility requirements are met.",
  },
  {
    title: "Work search minimum",
    response:
      "A weekly claim should include active, sustained work search efforts, and the online process expects contacts on at least four different days of the week.",
  },
  {
    title: "Report all earnings",
    response:
      "Claimants must report gross earnings for all work performed in the week claimed, even if not yet paid, including tips, commissions, odd jobs, and self-employment activity.",
  },
  {
    title: "Unresolved issue message",
    response:
      "Benefits cannot be paid while an eligibility issue is unresolved. Claimants should continue filing weekly claims to keep the claim active.",
  },
  {
    title: "Appeal timelines",
    response:
      "Appeal windows are generally 15 days for eligibility determinations and 30 days for tribunal or appeals board decisions. Late appeals require a written explanation.",
  },
  {
    title: "Overpayment review",
    response:
      "For a Notice of Potential Overpayment, claimants may request fact-finding review within 5 days excluding weekends and state holidays.",
  },
  {
    title: "Fraud warning",
    response:
      "Knowingly making false statements or withholding information may result in disqualification, repayment, and possible civil or criminal penalties.",
  },
  {
    title: "Address updates",
    response:
      "Claimants must keep mailing address current to receive determinations, tax forms, and notices.",
  },
  {
    title: "CACTUS first-time access",
    response:
      "If this is your first CACTUS login, use the official username/password recovery steps on the AZUI pages, then sign in and review your message center for required actions.",
  },
  {
    title: "ID.me verification hold",
    response:
      "If identity verification is pending, payment may pause until verification is completed and processed. Claimants should complete ID.me steps and continue filing weekly claims while waiting.",
  },
  {
    title: "Overpayment classifications",
    response:
      "Overpayments may be classified as administrative, non-fraud, or fraud. The determination notice explains the classification, amount due, and appeal rights.",
  },
  {
    title: "Overpayment repayment options",
    response:
      "Claimants should review the overpayment notice for repayment instructions, available options, and waiver information when applicable.",
  },
  {
    title: "1099-G tax form help",
    response:
      "1099-G forms are issued through the portal message center. Claimants should log in and open the form message to view or download the document.",
  },
  {
    title: "Legal representation in appeals",
    response:
      "Claimants may choose to obtain legal representation for the appeal process. The appeals resources page provides additional guidance on hearing preparation.",
  },
  {
    title: "Client Advocate routing",
    response:
      "For unresolved claim concerns after standard support steps, direct claimants to the official AZUI Client Advocate contact channel listed on the Contact Arizona UI page.",
  },
  {
    title: "Weekly claim not filed",
    response:
      "If a weekly claim was missed, claimants should review the weekly claim guidance page and complete required next steps as soon as possible to avoid delays.",
  },
];

function AgentResponseCardsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return cards;
    }

    return cards.filter(
      (card) =>
        card.title.toLowerCase().includes(normalized) ||
        card.response.toLowerCase().includes(normalized),
    );
  }, [query]);

  return (
    <section className="card stack">
      <div>
        <h2>Agent Response Cards</h2>
        <p className="muted section-copy">
          Quick, policy-aligned talking points for high-frequency claimant
          questions.
          <Tooltip text="Use these as consistent base language, then tailor to the caller’s exact situation." />
        </p>
      </div>

      <div className="compact-grid">
        <label htmlFor="card-search">
          Search response cards
          <Tooltip text="Search by claimant question topic (for example: appeal, earnings, waiting week, overpayment)." />
        </label>
        <input
          id="card-search"
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search topic or keyword"
        />
      </div>

      <div className="tools-grid" aria-live="polite">
        {filtered.map((card) => (
          <article key={card.title} className="tool-card">
            <h3>
              {card.title}
              <Tooltip text="Deliver this message clearly, then confirm understanding and next step." />
            </h3>
            <p className="muted">{card.response}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default AgentResponseCardsPage;
