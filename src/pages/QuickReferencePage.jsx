import { useState } from "react";
import { documentReferences } from "../data/documentReferences";
import { defaultLinks } from "../data/defaultLinks";
import { topActions } from "../data/topActions";
import { trendsTips } from "../data/trendsTips";
import { copyText } from "../utils/copyText";
import { addInteractionMemory } from "../utils/interactionMemory";

function isActive(item) {
  if (!item.expiresOn) {
    return true;
  }

  const expires = new Date(`${item.expiresOn}T23:59:59`);
  return expires >= new Date();
}

function QuickReferencePage({ tools = [] }) {
  const [copyStatus, setCopyStatus] = useState("");

  async function handleCopySummary() {
    const summary = [
      `Top actions: ${topActions.length}`,
      `Tool directory entries: ${tools.length}`,
      `Document references: ${documentReferences.length}`,
      `Key links: ${defaultLinks.length}`,
      `Active trends/tips: ${trendsTips.filter(isActive).length}`,
      "",
      "Quick reference snapshot generated.",
    ].join("\n");

    const copied = await copyText(summary);
    if (copied) {
      addInteractionMemory("Printable Quick Reference", summary);
    }
    setCopyStatus(copied ? "Summary copied." : "Copy unavailable.");
  }

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
        <button
          type="button"
          className="button-secondary"
          onClick={handleCopySummary}
        >
          Copy summary
        </button>
        {copyStatus ? <span className="muted">{copyStatus}</span> : null}
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
