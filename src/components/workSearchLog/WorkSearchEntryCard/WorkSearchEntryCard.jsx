import "./WorkSearchEntryCard.css";

function WorkSearchEntryCard({ entry, index, displayValue, renderStars }) {
  return (
    <article className="work-search-entry-card result stack">
      <div className="title-row">
        <h3>
          #{index + 1} · {displayValue(entry.firstName, "Unknown")}
        </h3>
        <span className="muted">
          Logged: {new Date(entry.loggedAt).toLocaleTimeString()}
        </span>
      </div>
      <p>
        <strong>First name reference:</strong>{" "}
        {displayValue(entry.firstName, "Unknown")}
      </p>
      <p>
        <strong>Redaction applied:</strong> {entry.redacted ? "Yes" : "No"}
      </p>
      <p>
        <strong>Reason for call:</strong> {displayValue(entry.reasonForCall)}
      </p>
      <p>
        <strong>Actions taken:</strong> {displayValue(entry.actionsTaken)}
      </p>
      <p>
        <strong>Important information:</strong>{" "}
        {displayValue(entry.importantInformation)}
      </p>
      <p>
        <strong>Next steps:</strong> {displayValue(entry.nextSteps)}
      </p>
      <p>
        <strong>Checklist completion:</strong>{" "}
        {entry.checklistCompletedSteps || 0}/{entry.checklistTotalSteps || 0}
      </p>
      <p>
        <strong>Field completion:</strong> {entry.synopsisCompletedFields || 0}/
        {entry.synopsisTotalFields || 5}
      </p>
      <p>
        <strong>Step rating:</strong> {renderStars(entry.stepRating || 1)} (
        {entry.stepRating || 1}/5)
      </p>
    </article>
  );
}

export default WorkSearchEntryCard;
