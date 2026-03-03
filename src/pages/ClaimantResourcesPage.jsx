import {
  claimantMediaResources,
  claimantResourcesContent,
} from "../data/selfHelpResources";
import PageSection from "../components/layout/PageSection";
import { copyText } from "../utils/copyText";
import { useMemo, useState } from "react";
import ResourceSearchBar from "../components/resources/ResourceSearchBar/ResourceSearchBar";
import ResourceTypeChips from "../components/resources/ResourceTypeChips/ResourceTypeChips";
import TopicAccordionList from "../components/resources/TopicAccordionList/TopicAccordionList";
import ResourceMediaCard from "../components/resources/ResourceMediaCard/ResourceMediaCard";

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
    <PageSection
      title={claimantResourcesContent.title}
      description={claimantResourcesContent.description}
    >
      <ResourceSearchBar
        id="claimant-resources-find"
        label="Find claimant resources"
        value={findQuery}
        onChange={setFindQuery}
        placeholder="Search links, PDFs, videos, or workflow steps"
        matchCount={totalMatches}
        showMatchCount
      />

      <ResourceTypeChips
        options={RESOURCE_TYPE_OPTIONS}
        activeValue={activeType}
        onSelect={setActiveType}
        ariaLabel="Resource type filters"
      />

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
        <TopicAccordionList
          groups={resourcesByTopic}
          activeTopic={activeExpandedTopic}
          onToggleTopic={(topic) =>
            setExpandedTopic((current) => (current === topic ? "" : topic))
          }
          emptyText="No claimant media resources match this search."
          renderGroupContent={(topicGroup) => (
            <div className="self-help-resource-grid">
              {topicGroup.resources.map((resource) => (
                <ResourceMediaCard
                  key={resource.id}
                  resource={resource}
                  toMediaUrl={toMediaUrl}
                  showStandaloneImage={false}
                />
              ))}
            </div>
          )}
        />
      </div>
    </PageSection>
  );
}

export default ClaimantResourcesPage;
