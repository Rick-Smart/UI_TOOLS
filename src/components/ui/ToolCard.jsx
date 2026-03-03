import AudienceBadge from "./AudienceBadge";
import AppButton from "./AppButton/AppButton";

function ToolCard({ title, description, to, actionLabel, audience }) {
  return (
    <article className="tool-card">
      <div className="title-row">
        <h3>{title}</h3>
        <AudienceBadge audience={audience} />
      </div>
      <p className="muted">{description}</p>
      <div className="tool-card-action-wrap">
        <AppButton
          to={to}
          variant="secondary"
          className="button-link tool-card-action"
        >
          {actionLabel}
        </AppButton>
      </div>
    </article>
  );
}

export default ToolCard;
