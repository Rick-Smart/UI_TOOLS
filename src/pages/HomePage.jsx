import { Link } from "react-router-dom";
import { topActions } from "../data/topActions";
import { homeCards } from "../data/toolRegistry";

function HomePage() {
  return (
    <section className="card stack">
      <div>
        <h2>AZDES UI Tools</h2>
        <p className="muted section-copy">
          Choose a tool below. Use the Document references section to confirm
          source pamphlet/form numbers as additional guidance is added.
        </p>
      </div>

      <div className="result stack">
        <h3>Today&apos;s Top Actions</h3>
        <div className="tools-grid home-top-actions-grid">
          {topActions.map((item) => (
            <article key={item.title} className="tool-card">
              <h3>{item.title}</h3>
              <p className="muted">{item.description}</p>
              <Link className="button-link" to={item.to}>
                Start action
              </Link>
            </article>
          ))}
        </div>
      </div>

      <div className="title-row">
        <h3>All tools</h3>
        <span className="pill">{homeCards.length} cards</span>
      </div>

      <div className="tools-grid home-tools-grid">
        {homeCards.map((card) => (
          <article key={card.to} className="tool-card">
            <div className="title-row">
              <h3>{card.title}</h3>
              {card.audience ? (
                <span className={`audience-badge audience-${card.audience}`}>
                  {card.audience === "agent" ? "Agent" : "Claimant"}
                </span>
              ) : null}
            </div>
            <p className="muted">{card.description}</p>
            <Link className="button-link" to={card.to}>
              Open tool
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

export default HomePage;
