import { documentReferences } from "../data/documentReferences";
import { defaultLinks } from "../data/defaultLinks";
import { topActions } from "../data/topActions";
import { trendsTips } from "../data/trendsTips";

function isActive(item) {
  if (!item.expiresOn) {
    return true;
  }

  const expires = new Date(`${item.expiresOn}T23:59:59`);
  return expires >= new Date();
}

function QuickReferencePage({ tools = [] }) {
  return (
    <section className="card stack print-friendly">
      <div className="title-row">
        <div>
          <h2>Campaign Quick Reference</h2>
          <p className="muted section-copy">
            Printable summary of top actions, tools, references, and active
            campaign tips.
          </p>
        </div>
        <button type="button" onClick={() => window.print()}>
          Print view
        </button>
      </div>

      <div className="result stack">
        <h3>Today&apos;s Top Actions</h3>
        <ul className="list">
          {topActions.map((item) => (
            <li key={item.title}>
              <strong>{item.title}:</strong> {item.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="result stack">
        <h3>Tool Directory</h3>
        <ul className="list">
          {tools.map((tool) => (
            <li key={tool.path}>
              <strong>{tool.title}:</strong> {tool.description}
            </li>
          ))}
        </ul>
      </div>

      <div className="result stack">
        <h3>Document References</h3>
        <ul className="list">
          {documentReferences.map((doc) => (
            <li key={doc.number}>
              <strong>{doc.number}</strong> — {doc.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="result stack">
        <h3>Key Links</h3>
        <ul className="list">
          {defaultLinks.map((link) => (
            <li key={link.url}>
              <strong>{link.name}:</strong> {link.url}
            </li>
          ))}
        </ul>
      </div>

      <div className="result stack">
        <h3>Active Trends & Tips</h3>
        <ul className="list">
          {trendsTips.filter(isActive).map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong> ({item.priority}) — {item.message}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default QuickReferencePage;
