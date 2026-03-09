import { useEffect, useMemo, useState } from "react";
import PageSection from "../../components/layout/PageSection";
import Tooltip from "../../components/Tooltip";
import {
  readManagedLinks,
  resetManagedLinks,
  subscribeManagedLinks,
  writeManagedLinks,
} from "../../utils/cbcLinksStore";

function CBCLinksPage() {
  const [links, setLinks] = useState(readManagedLinks);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [group, setGroup] = useState("");

  useEffect(() => {
    return subscribeManagedLinks(setLinks);
  }, []);

  const groupedCount = useMemo(() => {
    const unique = new Set(links.map((item) => item.group || "General"));
    return unique.size;
  }, [links]);

  function persist(nextLinks) {
    const saved = writeManagedLinks(nextLinks);
    setLinks(saved);
  }

  function addLink() {
    const safeName = name.trim();
    const safeUrl = url.trim();
    const safeGroup = group.trim() || "General";

    if (!safeName || !safeUrl) {
      return;
    }

    try {
      new URL(safeUrl);
    } catch {
      return;
    }

    const next = [{ name: safeName, url: safeUrl, group: safeGroup }, ...links];
    persist(next);
    setName("");
    setUrl("");
    setGroup("");
  }

  function removeLink(targetLink) {
    const next = links.filter(
      (item) =>
        !(
          item.name === targetLink.name &&
          item.url === targetLink.url &&
          (item.group || "General") === (targetLink.group || "General")
        ),
    );
    persist(next);
  }

  function resetLinks() {
    const reset = resetManagedLinks();
    setLinks(reset);
  }

  const grouped = useMemo(() => {
    const map = new Map();
    for (const link of links) {
      const g = link.group || "General";
      if (!map.has(g)) {
        map.set(g, []);
      }
      map.get(g).push(link);
    }
    return Array.from(map.entries());
  }, [links]);

  return (
    <PageSection
      title="Quick Links"
      description={
        <>
          Save frequently used CBC links in your local browser storage.
          <Tooltip text="Saved links are browser-local on this device; they are not synced across users or devices." />
        </>
      }
      headerContent={<span className="pill">{groupedCount} group(s)</span>}
    >
      <section className="card stack">
        <h3>Add a link</h3>
        <div className="compact-grid">
          <div>
            <label htmlFor="cbc-link-name">Name</label>
            <input
              id="cbc-link-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="CBC Portal"
            />
          </div>
          <div>
            <label htmlFor="cbc-link-url">URL</label>
            <input
              id="cbc-link-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://cbc.az.gov/"
            />
          </div>
          <div>
            <label htmlFor="cbc-link-group">
              Group
              <Tooltip text="Optional. Use group labels to organize links (e.g. CBC, DES, External)." />
            </label>
            <input
              id="cbc-link-group"
              type="text"
              value={group}
              onChange={(event) => setGroup(event.target.value)}
              placeholder="CBC"
            />
          </div>
        </div>
        <div className="actions-row">
          <button
            type="button"
            className="button-secondary"
            onClick={addLink}
            disabled={!name.trim() || !url.trim()}
          >
            Add link
          </button>
          <button
            type="button"
            className="button-secondary"
            onClick={resetLinks}
          >
            Reset to defaults
          </button>
        </div>
      </section>

      {grouped.map(([groupName, groupLinks]) => (
        <section key={groupName} className="card stack">
          <h3>{groupName}</h3>
          <div className="stack">
            {groupLinks.map((link) => (
              <article key={`${link.name}|${link.url}`} className="result">
                <div>
                  <p>
                    <strong>{link.name}</strong>
                  </p>
                  <p className="muted">{link.url}</p>
                </div>
                <div className="actions-row">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="button-link"
                  >
                    Open
                  </a>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => removeLink(link)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </PageSection>
  );
}

export default CBCLinksPage;
