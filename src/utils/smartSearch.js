function includesQuery(query, ...values) {
  return values.some((value) =>
    String(value || "")
      .toLowerCase()
      .includes(query),
  );
}

export function collectSearchValues(value, bucket = []) {
  if (value == null) {
    return bucket;
  }

  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    if (text) {
      bucket.push(text);
    }
    return bucket;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectSearchValues(item, bucket);
    }
    return bucket;
  }

  if (typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectSearchValues(nested, bucket);
    }
  }

  return bucket;
}

export function buildAutoIndexedDataItems(dataModules) {
  const entries = [];

  for (const [modulePath, moduleExports] of Object.entries(dataModules)) {
    const moduleName =
      modulePath.split("/").pop()?.replace(".js", "") || "data";

    for (const [exportName, exportedValue] of Object.entries(moduleExports)) {
      if (typeof exportedValue === "function") {
        continue;
      }

      const rows = Array.isArray(exportedValue)
        ? exportedValue
        : [exportedValue];

      rows.forEach((row, index) => {
        const haystack = [...new Set(collectSearchValues(row, []))];
        if (!haystack.length) {
          return;
        }

        const isObjectRow =
          row && typeof row === "object" && !Array.isArray(row);
        const title =
          (isObjectRow &&
            (row.title || row.name || row.term || row.number || row.path)) ||
          `${moduleName} ${exportName} ${index + 1}`;
        const detail =
          (isObjectRow &&
            (row.description ||
              row.definition ||
              row.message ||
              row.notes ||
              row.short ||
              exportName)) ||
          exportName;
        const to =
          isObjectRow && typeof row.to === "string"
            ? row.to
            : isObjectRow &&
                typeof row.path === "string" &&
                row.path.startsWith("/")
              ? row.path
              : undefined;
        const href =
          isObjectRow &&
          (typeof row.href === "string"
            ? row.href
            : typeof row.url === "string"
              ? row.url
              : typeof row.sourceUrl === "string"
                ? row.sourceUrl
                : undefined);

        entries.push({
          id: `auto-${moduleName}-${exportName}-${index}`,
          type: "Data",
          title: String(title),
          detail: String(detail),
          to,
          href,
          haystack,
        });
      });
    }
  }

  return entries;
}

function dedupeResults(results) {
  const dedupedResults = [];
  const seen = new Set();

  for (const result of results) {
    const target = result.to || result.href || "";
    const dedupeKey = `${result.type}|${result.title}|${target}`;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);
    dedupedResults.push(result);
  }

  return dedupedResults;
}

export function buildSearchResults({
  query,
  maxResults = 24,
  toolRegistry,
  documentReferences,
  defaultLinks,
  trendsTips,
  uiTerms,
  topActions,
  kbEntries,
  autoIndexedDataItems,
  callGuideMeta,
  managingCallSteps,
  orderedCallChecklist,
  noteRequirements,
  supportResources,
  contactInfo,
}) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const toolMatches = toolRegistry
    .filter((tool) =>
      includesQuery(
        normalizedQuery,
        tool.title,
        tool.description,
        tool.navLabel,
        tool.microGuide,
      ),
    )
    .map((tool) => ({
      id: `tool-${tool.path}`,
      type: "Tool",
      title: tool.title,
      detail: tool.description,
      to: tool.path,
    }));

  const docMatches = documentReferences
    .filter((doc) =>
      includesQuery(
        normalizedQuery,
        doc.number,
        doc.title,
        doc.notes,
        (doc.tags || []).join(" "),
      ),
    )
    .map((doc) => ({
      id: `doc-${doc.number}`,
      type: "Document",
      title: `${doc.number} — ${doc.title}`,
      detail: "Open official source",
      href: doc.sourceUrl,
    }));

  const linkMatches = defaultLinks
    .filter((link) => includesQuery(normalizedQuery, link.name, link.group))
    .map((link) => ({
      id: `link-${link.name}`,
      type: "Link",
      title: link.name,
      detail: link.group,
      href: link.url,
    }));

  const tipMatches = trendsTips
    .filter((item) =>
      includesQuery(normalizedQuery, item.title, item.message, item.priority),
    )
    .map((item) => ({
      id: item.id,
      type: "Trend",
      title: item.title,
      detail: item.priority,
      to: "/trends-tips",
    }));

  const termMatches = uiTerms
    .filter((item) =>
      includesQuery(normalizedQuery, item.term, item.short, item.definition),
    )
    .map((item) => ({
      id: `term-${item.short}`,
      type: "Term",
      title: `${item.term} (${item.short})`,
      detail: item.definition,
      to: "/terms",
    }));

  const topActionMatches = topActions
    .filter((item) =>
      includesQuery(normalizedQuery, item.title, item.description),
    )
    .map((item) => ({
      id: `action-${item.to}`,
      type: "Action",
      title: item.title,
      detail: item.description,
      to: item.to,
    }));

  const callHandlingMatches = [
    {
      id: "call-guide-meta",
      type: "Guide",
      title: `${callGuideMeta.title} (${callGuideMeta.version})`,
      detail: `Program ${callGuideMeta.program}`,
      to: "/call-handling",
      haystack: [
        callGuideMeta.title,
        callGuideMeta.version,
        callGuideMeta.program,
      ],
    },
    ...managingCallSteps.map((step, index) => ({
      id: `call-step-${index}`,
      type: "Call Step",
      title: `Call step: ${step}`,
      detail: "Call handling workflow",
      to: "/call-handling",
      haystack: [step],
    })),
    ...orderedCallChecklist.map((step, index) => ({
      id: `call-check-${index}`,
      type: "Checklist",
      title: `Checklist: ${step}`,
      detail: "Ordered call checklist item",
      to: "/call-handling",
      haystack: [step],
    })),
    ...noteRequirements.map((item, index) => ({
      id: `call-note-${index}`,
      type: "Case Note",
      title: `Case note requirement: ${item}`,
      detail: "Required notation standard",
      to: "/call-handling",
      haystack: [item],
    })),
    ...supportResources.map((resource, index) => ({
      id: `call-resource-${index}`,
      type: "Resource",
      title: resource.name,
      detail: resource.phone || resource.url,
      href: resource.url,
      haystack: [resource.name, resource.phone, resource.url],
    })),
    ...contactInfo.unemploymentPhones.map((item, index) => ({
      id: `call-phone-${index}`,
      type: "Contact",
      title: `UI Contact: ${item}`,
      detail: "Unemployment phone",
      to: "/call-handling",
      haystack: [item],
    })),
    ...contactInfo.emails.map((item, index) => ({
      id: `call-email-${index}`,
      type: "Contact",
      title: `UI Email: ${item}`,
      detail: "Unemployment email",
      to: "/call-handling",
      haystack: [item],
    })),
    {
      id: "call-website",
      type: "Contact",
      title: `UI Website: ${contactInfo.website}`,
      detail: "Unemployment website",
      href: contactInfo.website,
      haystack: [contactInfo.website],
    },
  ].filter((item) =>
    includesQuery(
      normalizedQuery,
      ...(item.haystack || [item.title, item.detail]),
    ),
  );

  const kbMatches = kbEntries
    .filter(
      (entry) =>
        entry?.status !== "failed" &&
        !String(entry?.title || "")
          .toLowerCase()
          .includes("fetch failed") &&
        Boolean(entry?.sourceUrl),
    )
    .filter((entry) =>
      includesQuery(
        normalizedQuery,
        entry.title,
        entry.summary,
        entry.topic,
        (entry.steps || []).join(" "),
        (entry.requiredDocuments || []).join(" "),
        (entry.contacts || []).join(" "),
        (entry.deadlines || []).join(" "),
        (entry.relatedLinks || []).join(" "),
        entry.sourceUrl,
      ),
    )
    .map((entry) => ({
      id: `kb-${entry.id}`,
      type: "KB",
      title: entry.title,
      detail: entry.topic || "Knowledge base article",
      href: entry.sourceUrl,
    }));

  const autoDataMatches = autoIndexedDataItems
    .filter((item) =>
      includesQuery(
        normalizedQuery,
        ...(item.haystack || [item.title, item.detail]),
      ),
    )
    .map((item) => ({
      id: item.id,
      type: item.type,
      title: item.title,
      detail: item.detail,
      to: item.to,
      href: item.href,
    }));

  const mergedResults = [
    ...toolMatches,
    ...docMatches,
    ...linkMatches,
    ...tipMatches,
    ...termMatches,
    ...topActionMatches,
    ...callHandlingMatches,
    ...kbMatches,
    ...autoDataMatches,
  ];

  return dedupeResults(mergedResults).slice(0, maxResults);
}

export function buildFocusedDocuments({
  documentReferences,
  toolRegistry,
  pathname,
  searchQuery,
}) {
  const currentTool = toolRegistry.find((tool) => tool.path === pathname);
  const toolContext = currentTool
    ? `${currentTool.title} ${currentTool.description} ${currentTool.microGuide || ""}`.toLowerCase()
    : "";

  const queryTokens = searchQuery
    .toLowerCase()
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const scored = documentReferences.map((doc) => {
    const tags = (doc.tags || []).map((tag) => String(tag).toLowerCase());
    const haystack =
      `${doc.number} ${doc.title} ${doc.notes} ${tags.join(" ")}`.toLowerCase();

    let score = 0;

    for (const tag of tags) {
      if (toolContext.includes(tag)) {
        score += 3;
      }
    }

    for (const token of queryTokens) {
      if (haystack.includes(token)) {
        score += 2;
      }
    }

    if (
      toolContext &&
      haystack.includes(currentTool?.navLabel?.toLowerCase() || "")
    ) {
      score += 1;
    }

    return { doc, score };
  });

  const ordered = scored.sort((left, right) => right.score - left.score);
  const relevant = ordered
    .filter((item) => item.score > 0)
    .map((item) => item.doc);

  if (relevant.length) {
    const relevantNumbers = new Set(relevant.map((doc) => doc.number));
    const other = documentReferences.filter(
      (doc) => !relevantNumbers.has(doc.number),
    );
    return {
      relevant,
      other,
      contextLabel: currentTool?.title || "Current task",
    };
  }

  return {
    relevant: documentReferences.slice(0, 2),
    other: documentReferences.slice(2),
    contextLabel: currentTool?.title || "General",
  };
}
