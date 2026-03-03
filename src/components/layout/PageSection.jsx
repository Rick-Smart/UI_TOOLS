function PageSection({
  title,
  description,
  headerContent = null,
  className = "",
  children,
}) {
  const sectionClassName = ["card", "stack", className]
    .filter(Boolean)
    .join(" ");
  const hasCustomHeaderContent = Boolean(headerContent);
  const resolvedHeaderContent = hasCustomHeaderContent ? (
    headerContent
  ) : description ? (
    <p className="muted section-copy page-section-descriptor">{description}</p>
  ) : null;
  const showDescriptionBelow = Boolean(description && hasCustomHeaderContent);

  return (
    <section className={sectionClassName}>
      {(title || description || resolvedHeaderContent) && (
        <div className="title-row page-section-header">
          <div>
            {title ? <h2 className="page-section-title">{title}</h2> : null}
            {showDescriptionBelow ? (
              <p className="muted section-copy">{description}</p>
            ) : null}
          </div>
          {resolvedHeaderContent}
        </div>
      )}
      {children}
    </section>
  );
}

export default PageSection;
