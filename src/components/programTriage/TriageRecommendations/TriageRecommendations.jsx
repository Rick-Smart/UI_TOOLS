import "./TriageRecommendations.css";
import AppButton from "../../ui/AppButton/AppButton";

function TriageRecommendations({ recommendations, copyStatus, onCopySummary }) {
  return (
    <div className="triage-recommendations result stack" aria-live="polite">
      <h3>Suggested program path(s)</h3>
      <ul className="list">
        {recommendations.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div className="actions-row">
        <AppButton type="button" variant="secondary" onClick={onCopySummary}>
          Copy summary
        </AppButton>
        {copyStatus ? <span className="muted">{copyStatus}</span> : null}
      </div>
    </div>
  );
}

export default TriageRecommendations;
