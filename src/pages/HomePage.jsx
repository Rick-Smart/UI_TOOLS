import PageSection from "../components/layout/PageSection";
import ToolCard from "../components/ui/ToolCard";
import { topActions } from "../data/topActions";
import { homeCards } from "../data/toolRegistry";

function HomePage() {
  return (
    <PageSection
      title="AZDES UI Tools"
      description="Choose a tool below. Use the Document references section to confirm source pamphlet/form numbers as additional guidance is added."
    >
      <div className="result stack">
        <h3>Today&apos;s Top Actions</h3>
        <div className="tools-grid home-top-actions-grid">
          {topActions.map((item) => (
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
        <span className="pill">{homeCards.length} cards</span>
      </div>

      <div className="tools-grid home-tools-grid">
        {homeCards.map((card) => (
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
