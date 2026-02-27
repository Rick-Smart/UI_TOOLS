import { useEffect, useMemo, useState } from "react";
import Tooltip from "../components/Tooltip";
import {
  readManagedLinks,
  resetManagedLinks,
  subscribeManagedLinks,
  writeManagedLinks,
} from "../utils/linksStore";

function LinksPage() {
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

  return (
    <section className="card stack">
      <div className="title-row">
        <div>
          <h2>Quick Links</h2>
          <p className="muted section-copy">
            Save frequently used links in your local browser storage.
            <Tooltip text="Saved links are browser-local on this device; they are not synced across users or devices." />
          </p>
        </div>
        <span className="pill">
          {links.length} links / {groupedCount} groups
        </span>
      </div>

      <div className="input-grid">
        <div>
          <label htmlFor="link-name">Link name</label>
          <input
            id="link-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            type="text"
            placeholder="UI Claim Portal"
          />
        </div>
        <div>
          <label htmlFor="link-url">URL</label>
          <input
            id="link-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            type="url"
            placeholder="https://..."
          />
        </div>
        <div>
          <label htmlFor="link-group">
            Group
            <Tooltip text="Use groups like UI, Employment, Phone, or Team to organize links for faster scanning." />
          </label>
          <input
            id="link-group"
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            type="text"
            placeholder="Claimant, Employer, Internal"
          />
        </div>
      </div>

      <div className="actions-row">
        <button type="button" onClick={addLink}>
          Add link
        </button>
        <button type="button" className="button-secondary" onClick={resetLinks}>
          Reset defaults
        </button>
      </div>

      <div className="links-grid" aria-live="polite">
        {links.map((link) => (
          <article key={`${link.name}-${link.url}`} className="link-card">
            <div>
              <h3>{link.name}</h3>
              <div className="link-meta">
                <span className="pill">{link.group || "General"}</span>
                <span className="muted text-break">{link.url}</span>
              </div>
            </div>
            <div className="link-actions">
              <a
                className="button-link link-action-button"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
              <button
                type="button"
                className="button-secondary link-action-button"
                onClick={() => removeLink(link)}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default LinksPage;
