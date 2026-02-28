import {
  claimantMediaResources,
  claimantResourcesContent,
} from "../data/selfHelpResources";
import { copyText } from "../utils/copyText";
import { useMemo, useState } from "react";

const RESOURCE_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "quick-link", label: "Quick Link" },
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "workflow", label: "Workflow" },
];
const DEFAULT_TOPIC = "Login & Access";

function normalizeText(value) {
  return String(value || "").toLowerCase();
}

function includesQuery(query, ...values) {
  if (!query) {
    return true;
  }

  return values.some((value) => normalizeText(value).includes(query));
}

function toMediaUrl(path) {
  return `${import.meta.env.BASE_URL}${encodeURI(path)}`;
}

function toShareUrl(link) {
  if (link?.isLocalMedia) {
    return toMediaUrl(link.url);
  }

  return String(link?.url || "");
}

function getResourceType(resource) {
  if (resource?.type === "image-sequence") {
    return "workflow";
  }

  return resource?.type || "unknown";
}

function getResourceTopic(resource) {
  return String(resource?.topic || "General");
}

function MediaResourceCard({ resource }) {
  const hasSrc = typeof resource.src === "string" && resource.src.trim();
  const resourceUrl = hasSrc ? toMediaUrl(resource.src) : "";
  const openUrl = resource.openUrl || resourceUrl;
  const showCardTitle = resource.type !== "image-sequence";

  return (
    <div className="result stack">
      {showCardTitle ? <h3>{resource.title}</h3> : null}

      {resource.type === "image-sequence" ? (
        <div className="self-help-sequence-vertical">
          {(resource.images || []).map((imageItem, index) => (
            <article key={imageItem.id} className="stack">
              <div className="self-help-step-heading-row">
                <span className="self-help-step-badge">Step {index + 1}</span>
                <h4 className="self-help-step-title">
                  {imageItem.heading || `Workflow step ${index + 1}`}
                </h4>
              </div>
              {Array.isArray(imageItem.instructions) &&
              imageItem.instructions.length ? (
                <ul className="list self-help-step-list">
                  {imageItem.instructions.map((instruction) => (
                    <li key={`${imageItem.id}-${instruction}`}>
                      {instruction}
                    </li>
                  ))}
                </ul>
              ) : null}
              <figure className="guide-image-block">
                <img
                  className="guide-image self-help-workflow-image"
                  src={toMediaUrl(imageItem.src)}
                  alt={imageItem.alt || resource.title}
                />
              </figure>
            </article>
          ))}
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

      {resource.caption ? <p className="muted">{resource.caption}</p> : null}

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

function ClaimantResourcesPage() {
  const [copyStatus, setCopyStatus] = useState("");
  const [findQuery, setFindQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [expandedTopic, setExpandedTopic] = useState(DEFAULT_TOPIC);
  const normalizedQuery = findQuery.trim().toLowerCase();

  const filteredQuickShareLinks = useMemo(() => {
    const source = claimantResourcesContent.quickShareLinks || [];
    if (
      !normalizedQuery &&
      (activeType === "all" || activeType === "quick-link")
    ) {
      return source;
    }

    if (activeType !== "all" && activeType !== "quick-link") {
      return [];
    }

    return source.filter((link) =>
      includesQuery(normalizedQuery, link.label, toShareUrl(link), link.topic),
    );
  }, [activeType, normalizedQuery]);

  const filteredMediaResources = useMemo(() => {
    if (!normalizedQuery && activeType === "all") {
      return claimantMediaResources;
    }

    return claimantMediaResources.filter((resource) => {
      const resourceType = getResourceType(resource);
      if (activeType !== "all" && resourceType !== activeType) {
        return false;
      }

      const imageValues = (resource.images || []).flatMap((imageItem) => [
        imageItem.id,
        imageItem.src,
        imageItem.alt,
        imageItem.heading,
        ...(imageItem.instructions || []),
      ]);

      return includesQuery(
        normalizedQuery,
        resource.id,
        resource.type,
        resource.title,
        resource.caption,
        resource.src,
        resource.embedUrl,
        resource.topic,
        ...imageValues,
      );
    });
  }, [activeType, normalizedQuery]);

  const resourcesByTopic = useMemo(() => {
    const grouped = new Map();

    filteredMediaResources.forEach((resource) => {
      const topic = getResourceTopic(resource);
      if (!grouped.has(topic)) {
        grouped.set(topic, []);
      }

      grouped.get(topic).push(resource);
    });

    return Array.from(grouped.entries()).map(([topic, resources]) => ({
      topic,
      resources,
    }));
  }, [filteredMediaResources]);

  const visibleTopics = useMemo(
    () => resourcesByTopic.map((item) => item.topic),
    [resourcesByTopic],
  );

  const activeExpandedTopic = useMemo(() => {
    if (!visibleTopics.length) {
      return "";
    }

    if (visibleTopics.includes(expandedTopic)) {
      return expandedTopic;
    }

    if (visibleTopics.includes(DEFAULT_TOPIC)) {
      return DEFAULT_TOPIC;
    }

    return visibleTopics[0];
  }, [expandedTopic, visibleTopics]);

  const totalMatches =
    filteredQuickShareLinks.length + filteredMediaResources.length;

  async function handleCopyQuickShare() {
    const lines = ["Claimant Resources", ""];

    filteredQuickShareLinks.forEach((link) => {
      lines.push(`- ${link.label}: ${toShareUrl(link)}`);
    });

    const copied = await copyText(lines.join("\n"));
    setCopyStatus(copied ? "Share links copied." : "Copy unavailable.");
  }

  /*
    If claimant resources add workflow images later, follow the same standard used
    in SelfHelpGuidePage: vertical order, instructions above each image, step badge
    only, and uniform self-help-workflow-image sizing.
  */
  return (
    <section className="card stack">
      <div>
        <h2>{claimantResourcesContent.title}</h2>
        <p className="muted section-copy">
          {claimantResourcesContent.description}
        </p>
      </div>

      <div className="compact-grid">
        <label htmlFor="claimant-resources-find">Find claimant resources</label>
        <input
          id="claimant-resources-find"
          type="text"
          value={findQuery}
          onChange={(event) => setFindQuery(event.target.value)}
          placeholder="Search links, PDFs, videos, or workflow steps"
        />
        {normalizedQuery ? (
          <p className="muted">Matches: {totalMatches}</p>
        ) : null}
      </div>

      <div
        className="type-chip-row"
        role="group"
        aria-label="Resource type filters"
      >
        {RESOURCE_TYPE_OPTIONS.map((option) => {
          const isActive = activeType === option.value;
          return (
            <button
              key={option.value}
              type="button"
              className={`type-chip ${isActive ? "type-chip-active" : ""}`}
              onClick={() => setActiveType(option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="result stack">
        <h3>Share with claimant</h3>
        {filteredQuickShareLinks.length ? (
          <ul className="list">
            {filteredQuickShareLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={toShareUrl(link)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No share links match this search.</p>
        )}
        <div className="actions-row">
          <button
            type="button"
            className="button-secondary"
            onClick={handleCopyQuickShare}
          >
            Copy share links
          </button>
          {copyStatus ? <span className="muted">{copyStatus}</span> : null}
        </div>
      </div>

      <div className="stack" aria-live="polite">
        {resourcesByTopic.length ? (
          <div className="stack">
            {resourcesByTopic.map((topicGroup) => {
              const isOpen = topicGroup.topic === activeExpandedTopic;

              return (
                <section key={topicGroup.topic} className="result stack">
                  <button
                    type="button"
                    className="accordion-trigger"
                    onClick={() =>
                      setExpandedTopic((current) =>
                        current === topicGroup.topic ? "" : topicGroup.topic,
                      )
                    }
                    aria-expanded={isOpen}
                  >
                    <span>{topicGroup.topic}</span>
                    <span className="muted">{topicGroup.resources.length}</span>
                  </button>
                  {isOpen ? (
                    <div className="self-help-resource-grid">
                      {topicGroup.resources.map((resource) => (
                        <MediaResourceCard
                          key={resource.id}
                          resource={resource}
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <p className="muted">
            No claimant media resources match this search.
          </p>
        )}
      </div>
    </section>
  );
}

export default ClaimantResourcesPage;
