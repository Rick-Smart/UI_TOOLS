import { useEffect, useState } from "react";
import PageSection from "../components/layout/PageSection";
import AppButton from "../components/ui/AppButton/AppButton";
import CopyButton from "../components/ui/CopyButton/CopyButton";
import { documentReferences } from "../data/documentReferences";
import { topActions } from "../data/topActions";
import { trendsTips } from "../data/trendsTips";
import { readManagedLinks, subscribeManagedLinks } from "../utils/linksStore";

function isActive(item) {
  if (!item.expiresOn) {
    return true;
  }

  const expires = new Date(`${item.expiresOn}T23:59:59`);
  return expires >= new Date();
}

function QuickReferencePage({ tools = [] }) {
  const [managedLinks, setManagedLinks] = useState(readManagedLinks);

  useEffect(() => {
    return subscribeManagedLinks(setManagedLinks);
  }, []);

  function buildSummary() {
    return [
      `Top actions: ${topActions.length}`,
      `Tool directory entries: ${tools.length}`,
      `Document references: ${documentReferences.length}`,
      `Key links: ${managedLinks.length}`,
      `Active trends/tips: ${trendsTips.filter(isActive).length}`,
      "",
      "Quick reference snapshot generated.",
    ].join("\n");
  }

  return (
    <PageSection
      title="Campaign Quick Reference"
      description="Printable summary of top actions, tools, references, and active campaign tips."
      className="print-friendly"
      headerContent={
        <div className="actions-row">
          <AppButton type="button" onClick={() => window.print()}>
            Print view
          </AppButton>
          <CopyButton
            getSummary={buildSummary}
            memoryKey="Printable Quick Reference"
          />
        </div>
      }
    >
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
          {managedLinks.map((link) => (
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
    </PageSection>
  );
}

export default QuickReferencePage;
