import Tooltip from "../../Tooltip";
import "./WorkSearchScorecardPanel.css";

function WorkSearchScorecardPanel({ interactionScorecard }) {
  return (
    <div
      className="work-search-scorecard-panel result stack"
      aria-live="polite"
    >
      <h3>
        Interaction score card
        <Tooltip text="Shows checklist completion quality per interaction using a 1-5 star score." />
      </h3>
      {interactionScorecard ? (
        <>
          <p>Scored interactions: {interactionScorecard.interactions}</p>
          <p>
            Steps completed: {interactionScorecard.completed}/
            {interactionScorecard.total}
          </p>
          <p>
            Average rating: {interactionScorecard.averageStarsText} (
            {interactionScorecard.averageStars.toFixed(1)}/5)
          </p>
        </>
      ) : (
        <p className="muted">
          No scored interactions yet. Ratings appear after a case note is
          captured from Call Handling.
        </p>
      )}
    </div>
  );
}

export default WorkSearchScorecardPanel;
