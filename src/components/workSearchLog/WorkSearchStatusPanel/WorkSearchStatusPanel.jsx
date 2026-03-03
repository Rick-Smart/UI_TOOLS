import Tooltip from "../../Tooltip";
import AppButton from "../../ui/AppButton/AppButton";
import "./WorkSearchStatusPanel.css";

function WorkSearchStatusPanel({
  entriesCount,
  redactedCount,
  copyStatus,
  onCopySummary,
  onClearEntries,
}) {
  return (
    <div className="work-search-status-panel result stack" aria-live="polite">
      <h3>
        Daily status
        <Tooltip text="This feed captures call summary details and automatically redacts PII/CPNI patterns such as SSN, phone, email, and PIN values." />
      </h3>
      <p>People helped (synopses): {entriesCount}</p>
      <p>Entries with redaction applied: {redactedCount}</p>
      <p className="muted">
        Call details are retained with automatic redaction where sensitive
        patterns are detected.
      </p>
      <div className="actions-row">
        <AppButton type="button" variant="secondary" onClick={onCopySummary}>
          Copy summary
        </AppButton>
        <AppButton
          type="button"
          variant="secondary"
          onClick={onClearEntries}
          disabled={!entriesCount}
        >
          Clear all
        </AppButton>
        {copyStatus ? <span className="muted">{copyStatus}</span> : null}
      </div>
    </div>
  );
}

export default WorkSearchStatusPanel;
