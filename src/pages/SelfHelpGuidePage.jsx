import {
  selfHelpGuideContent,
  selfHelpMediaResources,
} from "../data/selfHelpResources";
import { useMemo, useState } from "react";
import PageSection from "../components/layout/PageSection";
import ResourceSearchBar from "../components/resources/ResourceSearchBar/ResourceSearchBar";
import ResourceTypeChips from "../components/resources/ResourceTypeChips/ResourceTypeChips";
import TopicAccordionList from "../components/resources/TopicAccordionList/TopicAccordionList";
import ResourceMediaCard from "../components/resources/ResourceMediaCard/ResourceMediaCard";

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

  const workflowInstructionSets = useMemo(
    () => [
      {
        heading: "Login steps",
        steps: selfHelpGuideContent.loginSteps,
      },
      {
        heading: "EIN lookup in Profile",
        steps: selfHelpGuideContent.einLookupSteps,
      },
    ],
    [],
  );

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
  }, [normalizedQuery, workflowInstructionSets]);

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
    <PageSection
      title={selfHelpGuideContent.title}
      description={selfHelpGuideContent.description}
    >
      <ResourceSearchBar
        id="self-help-find"
        label="Find in self-help"
        value={findQuery}
        onChange={setFindQuery}
        placeholder="Search steps, notes, or media"
        matchCount={totalMatches}
        showMatchCount
      />

      <ResourceTypeChips
        options={RESOURCE_TYPE_OPTIONS}
        activeValue={activeType}
        onSelect={setActiveType}
        ariaLabel="Agent self-help filters"
      />

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
        <TopicAccordionList
          groups={resourcesByTopic}
          activeTopic={activeExpandedTopic}
          onToggleTopic={(topic) =>
            setExpandedTopic((current) => (current === topic ? "" : topic))
          }
          emptyText="No media resources match this search."
          renderGroupContent={(topicGroup) => (
            <div className="self-help-resource-grid">
              {topicGroup.resources.map((resource) => (
                <ResourceMediaCard
                  key={resource.id}
                  resource={resource}
                  toMediaUrl={toMediaUrl}
                  workflowInstructionSets={filteredWorkflowInstructionSets}
                  showStandaloneImage
                />
              ))}
            </div>
          )}
        />
      </div>
    </PageSection>
  );
}

export default SelfHelpGuidePage;
