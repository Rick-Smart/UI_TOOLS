function DocumentReferencesPanel({ focusedDocuments, documentReferences }) {
  const displayedDocuments = [
    ...focusedDocuments.relevant,
    ...focusedDocuments.other,
  ];

  return (
    <section className="card stack" aria-labelledby="doc-reference-heading">
      <div>
        <h2 id="doc-reference-heading">Document references</h2>
        <p className="muted section-copy">
          Focused for {focusedDocuments.contextLabel}. Most relevant references
          are shown first, followed by additional registry items.
        </p>
      </div>
      <div className="title-row">
        <span className="pill">
          Focused: {focusedDocuments.relevant.length}
        </span>
        <span className="muted">
          Total references: {documentReferences.length}
        </span>
      </div>
      <div className="docs-grid" aria-live="polite">
        {displayedDocuments.map((doc, index) => (
          <article key={doc.number} className="doc-card">
            <div className="doc-header">
              <span className="pill">{doc.number}</span>
              <span className="muted">Rev {doc.revision}</span>
            </div>
            <h3>{doc.title}</h3>
            <p className="muted">{doc.notes}</p>
            {index < focusedDocuments.relevant.length ? (
              <span className="pill">Relevant now</span>
            ) : null}
            <div className="actions-row">
              <a
                className="button-link"
                href={doc.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open source
              </a>
              <a
                className="button-secondary button-link"
                href={doc.searchUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Search number
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default DocumentReferencesPanel;
