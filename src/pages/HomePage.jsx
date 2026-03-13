import PageSection from "../components/layout/PageSection";
import ToolCard from "../components/ui/ToolCard";
import { topActions as defaultTopActions } from "../data/topActions";
import { homeCards as defaultHomeCards } from "../data/toolRegistry";

/**
 * Editable section metadata for the Manager Portal.
 * Update sections here when the page's editable regions change.
 */
export const pageMeta = {
  id: "top-actions",
  label: "Home — Top Actions",
  description:
    "Featured shortcut cards displayed prominently at the top of the home page.",
  campaigns: ["ui-kb"],
  wireframe: "top-actions",
  sections: [{ key: "top_action", label: "Top Action", region: "top-actions" }],
};

function HomePage({ homeCards, topActionsItems }) {
  const resolvedHomeCards = homeCards ?? defaultHomeCards;
  const resolvedTopActions = topActionsItems ?? defaultTopActions;

  return (
    <PageSection
      title="AZDES UI Tools"
      description="Choose a tool below. Use the Document references section to confirm source pamphlet/form numbers as additional guidance is added."
    >
      <div className="result stack">
        <h3>Today&apos;s Top Actions</h3>
        <div className="tools-grid home-top-actions-grid">
          {resolvedTopActions.map((item) => (
            <ToolCard
              key={item.title}
              title={item.title}
              description={item.description}
              to={item.to}
              actionLabel="Start action"
            />
          ))}
        </div>
      </div>

      <div className="title-row">
        <h3>All tools</h3>
        <span className="pill">{resolvedHomeCards.length} cards</span>
      </div>

      <div className="tools-grid home-tools-grid">
        {resolvedHomeCards.map((card) => (
          <ToolCard
            key={card.to}
            title={card.title}
            description={card.description}
            to={card.to}
            actionLabel="Open tool"
            audience={card.audience}
          />
        ))}
      </div>
    </PageSection>
  );
}

export default HomePage;
