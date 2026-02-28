import {
  selfHelpGuideContent,
  selfHelpMediaResources,
} from "../data/selfHelpResources";
import { useMemo, useState } from "react";

const RESOURCE_TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "notes", label: "Notes" },
  { value: "workflow", label: "Workflow" },
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
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

function getResourceType(resource) {
  if (resource?.type === "image-sequence") {
    return "workflow";
  }

  return resource?.type || "unknown";
}

function getResourceTopic(resource) {
  return String(resource?.topic || "General");
}

function MediaResourceCard({ resource, workflowInstructionSets = [] }) {
  const hasSrc = typeof resource.src === "string" && resource.src.trim();
  const resourceUrl = hasSrc ? toMediaUrl(resource.src) : "";
  const openUrl = resource.openUrl || resourceUrl;
  const showCardTitle = resource.type !== "image-sequence";

  return (
    <div className="result stack">
      {showCardTitle ? <h3>{resource.title}</h3> : null}
      {resource.type === "image" ? (
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
          {/*
            Workflow convention:
            1) Render workflow images vertically in process order.
            2) Always show an explicit Step badge tied to each image.
            3) Keep workflow images visually uniform with self-help-workflow-image.
          */}
          {(resource.images || []).map((imageItem, index) => {
            const imageUrl = toMediaUrl(imageItem.src);
            const stepLabel = `Step ${index + 1}`;
            const instructionSet = workflowInstructionSets[index];
            const heading =
              instructionSet?.heading || `Workflow step ${index + 1}`;
            const instructionSteps = instructionSet?.steps || [];

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
                    src={imageUrl}
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

function SelfHelpGuidePage() {
  /*
    Workflow authoring rule (all future workflow sections):
    - Keep workflow images in strict vertical order.
    - Place written instructions directly ABOVE the matching image.
    - Show Step badge only (no duplicate title/caption text tied to the badge row).
    - Keep workflow images uniform via self-help-workflow-image sizing class.
  */
  const [findQuery, setFindQuery] = useState("");
  const [activeType, setActiveType] = useState("all");
  const [expandedTopic, setExpandedTopic] = useState(DEFAULT_TOPIC);
  const normalizedQuery = findQuery.trim().toLowerCase();

  const workflowInstructionSets = [
    {
      heading: "Login steps",
      steps: selfHelpGuideContent.loginSteps,
    },
    {
      heading: "EIN lookup in Profile",
      steps: selfHelpGuideContent.einLookupSteps,
    },
  ];

  const filteredWorkflowInstructionSets = useMemo(() => {
    if (!normalizedQuery) {
      return workflowInstructionSets;
    }

    return workflowInstructionSets
      .map((set) => {
        const headingMatches = includesQuery(normalizedQuery, set.heading);
        const filteredSteps = headingMatches
          ? set.steps
          : set.steps.filter((step) => includesQuery(normalizedQuery, step));

        return {
          ...set,
          steps: filteredSteps,
        };
      })
      .filter(
        (set) =>
          set.steps.length || includesQuery(normalizedQuery, set.heading),
      );
  }, [normalizedQuery]);

  const filteredTroubleshootingNotes = useMemo(() => {
    if (activeType !== "all" && activeType !== "notes") {
      return [];
    }

    if (!normalizedQuery) {
      return selfHelpGuideContent.troubleshootingNotes;
    }

    return selfHelpGuideContent.troubleshootingNotes.filter((note) =>
      includesQuery(normalizedQuery, note),
    );
  }, [activeType, normalizedQuery]);

  const filteredMediaResources = useMemo(() => {
    return selfHelpMediaResources.filter((resource) => {
      const resourceType = getResourceType(resource);
      if (activeType !== "all" && activeType !== resourceType) {
        return false;
      }

      const imageValues = (resource.images || []).flatMap((imageItem) => [
        imageItem.id,
        imageItem.src,
        imageItem.alt,
        imageItem.caption,
      ]);

      if (!normalizedQuery) {
        return true;
      }

      return includesQuery(
        normalizedQuery,
        resource.id,
        resource.type,
        resource.title,
        resource.caption,
        resource.src,
        resource.topic,
        ...imageValues,
        ...filteredWorkflowInstructionSets.map((set) => set.heading),
        ...filteredWorkflowInstructionSets.flatMap((set) => set.steps),
      );
    });
  }, [activeType, filteredWorkflowInstructionSets, normalizedQuery]);

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
    filteredTroubleshootingNotes.length + filteredMediaResources.length;

  return (
    <section className="card stack">
      <div>
        <h2>{selfHelpGuideContent.title}</h2>
        <p className="muted section-copy">{selfHelpGuideContent.description}</p>
      </div>

      <div className="compact-grid">
        <label htmlFor="self-help-find">Find in self-help</label>
        <input
          id="self-help-find"
          type="text"
          value={findQuery}
          onChange={(event) => setFindQuery(event.target.value)}
          placeholder="Search steps, notes, or media"
        />
        {normalizedQuery ? (
          <p className="muted">Matches: {totalMatches}</p>
        ) : null}
      </div>

      <div
        className="type-chip-row"
        role="group"
        aria-label="Agent self-help filters"
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
        <h3>Self-help workflow</h3>
        <p>
          Self-help URL:{" "}
          <a
            href={selfHelpGuideContent.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-break"
          >
            {selfHelpGuideContent.loginUrl}
          </a>
        </p>

        {activeType === "all" || activeType === "notes" ? (
          <>
            <h3>Troubleshooting notes</h3>
            {filteredTroubleshootingNotes.length ? (
              <ul className="list">
                {filteredTroubleshootingNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                No troubleshooting notes match this search.
              </p>
            )}
          </>
        ) : null}

        <h3>Agent self-help media references</h3>
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
                          workflowInstructionSets={
                            filteredWorkflowInstructionSets
                          }
                        />
                      ))}
                    </div>
                  ) : null}
                </section>
              );
            })}
          </div>
        ) : (
          <p className="muted">No media resources match this search.</p>
        )}
      </div>
    </section>
  );
}

export default SelfHelpGuidePage;
