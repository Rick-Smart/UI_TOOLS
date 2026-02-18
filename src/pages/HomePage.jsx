import { Link } from "react-router-dom";
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

      <div className="tools-grid">
        {homeCards.map((card) => (
          <article key={card.to} className="tool-card">
            <h3>{card.title}</h3>
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
