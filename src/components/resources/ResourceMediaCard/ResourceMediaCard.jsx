import "./ResourceMediaCard.css";

function ResourceMediaCard({
  resource,
  toMediaUrl,
  workflowInstructionSets = [],
  showStandaloneImage = true,
}) {
  const hasSrc = typeof resource.src === "string" && resource.src.trim();
  const resourceUrl = hasSrc ? toMediaUrl(resource.src) : "";
  const openUrl = resource.openUrl || resourceUrl;
  const showCardTitle = resource.type !== "image-sequence";

  return (
    <div className="resource-media-card result stack">
      {showCardTitle ? <h3>{resource.title}</h3> : null}

      {showStandaloneImage && resource.type === "image" ? (
        <figure className="guide-image-block">
          <img
            className="guide-image"
            src={resourceUrl}
            alt={resource.alt || resource.title}
          />
          {resource.caption ? (
            <figcaption className="muted">{resource.caption}</figcaption>
          ) : null}
        </figure>
      ) : null}

      {resource.type === "image-sequence" ? (
        <div className="self-help-sequence-vertical">
          {(resource.images || []).map((imageItem, index) => {
            const stepLabel = `Step ${index + 1}`;
            const instructionSet = workflowInstructionSets[index];
            const heading =
              instructionSet?.heading ||
              imageItem.heading ||
              `Workflow step ${index + 1}`;
            const instructionSteps =
              instructionSet?.steps || imageItem.instructions || [];

            return (
              <article key={imageItem.id} className="stack">
                <div className="self-help-step-heading-row">
                  <span className="self-help-step-badge">{stepLabel}</span>
                  <h4 className="self-help-step-title">{heading}</h4>
                </div>
                {instructionSteps.length ? (
                  <ul className="list self-help-step-list">
                    {instructionSteps.map((step) => (
                      <li key={`${imageItem.id}-${step}`}>{step}</li>
                    ))}
                  </ul>
                ) : null}
                <figure className="guide-image-block">
                  <img
                    className="guide-image self-help-workflow-image"
                    src={toMediaUrl(imageItem.src)}
                    alt={imageItem.alt || imageItem.caption || resource.title}
                  />
                </figure>
              </article>
            );
          })}
        </div>
      ) : null}

      {resource.type === "pdf" && resource.embed ? (
        <iframe
          className="self-help-resource-frame"
          src={resourceUrl}
          title={resource.title}
        />
      ) : null}

      {resource.type === "video" && resource.embedUrl ? (
        <iframe
          className="self-help-resource-frame"
          src={resource.embedUrl}
          title={resource.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : null}

      {(resource.type === "pdf" || resource.type === "video") &&
      resource.caption ? (
        <p className="muted">{resource.caption}</p>
      ) : null}

      {resource.type !== "pdf" &&
      resource.type !== "video" &&
      resource.caption ? (
        <p className="muted">{resource.caption}</p>
      ) : null}

      <div className="actions-row">
        {openUrl ? (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="button-link"
          >
            Open resource
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default ResourceMediaCard;
