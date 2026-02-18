import { useMemo, useState } from "react";
import { defaultLinks, linksStorageKey } from "../data/defaultLinks";

function readStoredLinks() {
  try {
    const stored = localStorage.getItem(linksStorageKey);
    if (!stored) {
      return defaultLinks;
    }

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      return defaultLinks;
    }

    const filtered = parsed.filter((item) => item?.name && item?.url);
    return filtered.length ? filtered : defaultLinks;
  } catch {
    return defaultLinks;
  }
}

function LinksPage() {
  const [links, setLinks] = useState(readStoredLinks);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [group, setGroup] = useState("");

  const groupedCount = useMemo(() => {
    const unique = new Set(links.map((item) => item.group || "General"));
    return unique.size;
  }, [links]);

  function persist(nextLinks) {
    setLinks(nextLinks);
    localStorage.setItem(linksStorageKey, JSON.stringify(nextLinks));
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

  function removeLink(index) {
    const next = links.filter((_, itemIndex) => itemIndex !== index);
    persist(next);
  }

  function resetLinks() {
    persist(defaultLinks);
  }

  return (
    <section className="card stack">
      <div className="title-row">
        <div>
          <h2>Quick Links</h2>
          <p className="muted section-copy">
            Save frequently used links in your local browser storage.
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
          <label htmlFor="link-group">Group</label>
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
        {links.map((link, index) => (
          <article key={`${link.url}-${index}`} className="link-card">
            <div>
              <h3>{link.name}</h3>
              <div className="link-meta">
                <span className="pill">{link.group || "General"}</span>
                <span className="muted text-break">{link.url}</span>
              </div>
            </div>
            <div className="link-actions">
              <a
                className="button-link"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
              <button
                type="button"
                className="button-secondary"
                onClick={() => removeLink(index)}
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
