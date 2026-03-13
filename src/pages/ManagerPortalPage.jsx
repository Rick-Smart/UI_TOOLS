import { useEffect, useState } from "react";
import AppButton from "../components/ui/AppButton/AppButton";

// Bypass Supabase auth in local dev when VITE_DEV_PORTAL_BYPASS=true.
// This flag is always false in production builds.
const DEV_BYPASS =
  import.meta.env.DEV && import.meta.env.VITE_DEV_PORTAL_BYPASS === "true";

const DEV_USER = { id: "dev-user", email: "dev@bypass.local" };
const DEV_CAMPAIGNS = ["ui-kb", "cbc-kb"];
import {
  getCurrentUser,
  getManagerCampaigns,
  signIn,
  signOut,
  subscribeAuthState,
} from "../utils/managerAuth";
import {
  createEntry,
  deactivateEntry,
  fetchManagerContent,
  updateEntry,
} from "../utils/managerStore";
import { isSupabaseConfigured } from "../utils/supabaseClient";
import { PAGE_REGISTRY } from "../data/managerPageRegistry";

// Sections available to every campaign.
const BASE_SECTION_OPTIONS = [
  { value: "trend", label: "Trend" },
  { value: "tip", label: "Tip" },
  { value: "suggestion", label: "Suggestion" },
  { value: "agent_card", label: "Agent Response Card" },
  { value: "top_action", label: "Top Action" },
];

// Extra sections only meaningful for the UI-KB campaign.
const UI_KB_SECTION_OPTIONS = [
  { value: "call_phone", label: "Unemployment Phone Number" },
  { value: "call_transfer", label: "Internal Transfer Line" },
  { value: "call_support_resource", label: "UI Assist Service" },
];

const ALL_SECTION_OPTIONS = [...BASE_SECTION_OPTIONS, ...UI_KB_SECTION_OPTIONS];

function getSectionOptions(campaign) {
  return campaign === "ui-kb" ? ALL_SECTION_OPTIONS : BASE_SECTION_OPTIONS;
}

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SECTION_LABELS = Object.fromEntries(
  ALL_SECTION_OPTIONS.map((o) => [o.value, o.label]),
);

const CAMPAIGN_CONFIG = {
  "ui-kb": { label: "AZDES UI Knowledge Base" },
  "cbc-kb": { label: "CBC Knowledge Base" },
};

// Layout templates for the page wireframe visualizer.
// zones with static:true render as greyed placeholder blocks.
// Editable zones (matching pageMeta sections by region) render as highlighted dashed boxes.
// The `className` is applied to the wireframe grid container; data-zone attributes enable
// layout-specific CSS for multi-column templates (e.g. call-handling two-column).
const WIREFRAME_LAYOUTS = {
  "single-col": {
    className: "wf-single-col",
    zones: [
      {
        id: "header",
        label: "Page header",
        static: true,
        skeleton: "page-title",
      },
      { id: "main", label: "Content list", skeleton: "article-list" },
    ],
  },
  "card-grid": {
    className: "wf-card-grid",
    zones: [
      {
        id: "header",
        label: "Page header",
        static: true,
        skeleton: "page-title",
      },
      {
        id: "search",
        label: "Search bar",
        static: true,
        skeleton: "search-bar",
      },
      { id: "grid", label: "Response cards grid", skeleton: "tool-card-grid" },
    ],
  },
  "top-actions": {
    className: "wf-top-actions",
    zones: [
      {
        id: "header",
        label: "Page header",
        static: true,
        skeleton: "page-title",
      },
      { id: "top-actions", label: "Top Actions", skeleton: "action-card-row" },
      {
        id: "all-tools",
        label: "All tools grid",
        static: true,
        skeleton: "tool-card-grid",
      },
    ],
  },
  "call-handling": {
    className: "wf-call-handling",
    zones: [
      {
        id: "page-header",
        label: "Page header",
        static: true,
        skeleton: "page-title",
      },
      {
        id: "main",
        label: "Step guidance & scripts",
        static: true,
        skeleton: "step-checklist",
      },
      {
        id: "right-rail",
        label: "At-a-glance resources",
        skeleton: "right-rail-panels",
      },
    ],
  },
};

// Per-section field visibility and labels.
const SECTION_META = {
  trend: {
    showTitle: true,
    showPriority: true,
    showExpiry: true,
    showLink: false,
    bodyLabel: "Content / Message",
  },
  tip: {
    showTitle: true,
    showPriority: true,
    showExpiry: true,
    showLink: false,
    bodyLabel: "Content / Message",
  },
  suggestion: {
    showTitle: true,
    showPriority: true,
    showExpiry: true,
    showLink: false,
    bodyLabel: "Content / Message",
  },
  agent_card: {
    showTitle: true,
    showPriority: false,
    showExpiry: false,
    showLink: false,
    bodyLabel: "Response text",
  },
  top_action: {
    showTitle: true,
    showPriority: false,
    showExpiry: false,
    showLink: true,
    bodyLabel: "Short description",
    linkLabel: "Path (e.g. /base-period)",
    linkRequired: true,
    linkType: "text",
  },
  call_phone: {
    showTitle: false,
    showPriority: false,
    showExpiry: false,
    showLink: false,
    bodyLabel: "Phone line (e.g. Toll Free: 1-877-600-2722)",
  },
  call_transfer: {
    showTitle: false,
    showPriority: false,
    showExpiry: false,
    showLink: false,
    bodyLabel: "Transfer line (e.g. BPC: 602-364-4300)",
  },
  call_support_resource: {
    showTitle: true,
    showPriority: false,
    showExpiry: false,
    showLink: true,
    bodyLabel: "Phone number (leave blank if none)",
    linkLabel: "Website URL (optional)",
    linkRequired: false,
    linkType: "url",
  },
};

const EMPTY_FORM = {
  section: "trend",
  title: "",
  body: "",
  priority: "medium",
  expires_on: "",
  link_url: "",
};

function ZoneSkeleton({ type }) {
  switch (type) {
    case "page-title":
      return (
        <div className="wf-skel wf-skel--title">
          <div className="wf-line wf-line--hero" />
          <div className="wf-line wf-line--sub" />
        </div>
      );
    case "search-bar":
      return <div className="wf-skel wf-skel--search" />;
    case "article-list":
      return (
        <div className="wf-skel wf-skel--articles">
          {[60, 100, 75].map((w, i) => (
            <div key={i} className="wf-article-block">
              <div className="wf-line" style={{ width: `${w}%` }} />
              <div className="wf-line wf-line--full" />
              <div className="wf-line wf-line--sub" />
            </div>
          ))}
        </div>
      );
    case "tool-card-grid":
      return (
        <div className="wf-skel wf-skel--card-grid">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="wf-card-block">
              <div className="wf-line" style={{ width: "65%" }} />
              <div className="wf-line wf-line--full" />
            </div>
          ))}
        </div>
      );
    case "action-card-row":
      return (
        <div className="wf-skel wf-skel--action-row">
          {[0, 1, 2].map((i) => (
            <div key={i} className="wf-action-card">
              <div className="wf-line" style={{ width: "70%" }} />
              <div className="wf-line wf-line--full" />
              <div className="wf-pill" />
            </div>
          ))}
        </div>
      );
    case "step-checklist":
      return (
        <div className="wf-skel wf-skel--steps">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="wf-step-item">
              <div className="wf-step-num" />
              <div className="wf-line wf-line--full" />
            </div>
          ))}
        </div>
      );
    case "right-rail-panels":
      return (
        <div className="wf-skel wf-skel--rail">
          {[0, 1, 2].map((i) => (
            <div key={i} className="wf-rail-panel">
              <div className="wf-line" style={{ width: "55%" }} />
              <div className="wf-line wf-line--full" />
              <div className="wf-line" style={{ width: "80%" }} />
            </div>
          ))}
        </div>
      );
    default:
      return null;
  }
}

function PageWireframe({ page, entries, onManageSection }) {
  const layout = WIREFRAME_LAYOUTS[page.wireframe];
  if (!layout) return null;

  // group page sections by their wireframe region
  const sectionsByRegion = {};
  for (const s of page.sections) {
    if (!sectionsByRegion[s.region]) sectionsByRegion[s.region] = [];
    sectionsByRegion[s.region].push(s);
  }

  return (
    <div className={`manager-wireframe ${layout.className}`}>
      {layout.zones.map((zone) => {
        const zoneSections = sectionsByRegion[zone.id] ?? [];
        const isEditable = !zone.static && zoneSections.length > 0;
        return (
          <div
            key={zone.id}
            data-zone={zone.id}
            className={`manager-wf-zone ${
              isEditable
                ? "manager-wf-zone--editable"
                : "manager-wf-zone--static"
            }`}
          >
            <span className="manager-wf-zone-label">{zone.label}</span>
            <div
              className={`manager-wf-skeleton${
                isEditable ? " manager-wf-skeleton--dim" : ""
              }`}
            >
              <ZoneSkeleton type={zone.skeleton} />
            </div>
            {isEditable && (
              <div className="manager-wf-section-list">
                {zoneSections.map((s) => {
                  const count = entries.filter(
                    (e) => e.section === s.key,
                  ).length;
                  return (
                    <div key={s.key} className="manager-wf-section-row">
                      <span className="manager-wf-section-name">{s.label}</span>
                      <span className="badge">{count}</span>
                      <AppButton
                        type="button"
                        onClick={() => onManageSection(s.key)}
                      >
                        Manage →
                      </AppButton>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { user, error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    onLogin(user);
  }

  return (
    <form
      className="stack"
      onSubmit={handleSubmit}
      aria-label="Manager sign in"
    >
      <div className="form-field">
        <label htmlFor="mgr-email">Email</label>
        <input
          id="mgr-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="form-field">
        <label htmlFor="mgr-password">Password</label>
        <input
          id="mgr-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="form-error">{error}</p>}
      <AppButton type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </AppButton>
    </form>
  );
}

function priorityBadgeClass(priority) {
  if (priority === "high") return "badge badge--error";
  if (priority === "medium") return "badge badge--warn";
  return "badge";
}

function EntryPreview({ form }) {
  const today = new Date().toISOString().slice(0, 10);
  const title = form.title.trim();
  const body = form.body.trim();
  const meta = SECTION_META[form.section] ?? SECTION_META.trend;
  const hasContent = body || (meta.showTitle && title);

  const callSections = ["call_phone", "call_transfer", "call_support_resource"];
  const isCallSection = callSections.includes(form.section);

  return (
    <div className="manager-preview-pane">
      <p className="manager-preview-label">Live preview</p>
      {!hasContent ? (
        <p className="muted" style={{ fontSize: "13px", fontStyle: "italic" }}>
          Fill in content to see how it will look on the page.
        </p>
      ) : isCallSection ? (
        // Matches CallRightRail "At-a-glance resources" panel
        <div className="result stack" style={{ gap: "6px" }}>
          <p style={{ margin: 0, fontSize: "12px", color: "var(--muted)" }}>
            At-a-glance resources
          </p>
          {form.section === "call_phone" && (
            <>
              <p>
                <strong>Unemployment phones</strong>
              </p>
              <ul className="list">
                <li>{body || <em className="muted">Phone line…</em>}</li>
              </ul>
            </>
          )}
          {form.section === "call_transfer" && (
            <>
              <p>
                <strong>Internal transfers</strong>
              </p>
              <ul className="list">
                <li>{body || <em className="muted">Transfer line…</em>}</li>
              </ul>
            </>
          )}
          {form.section === "call_support_resource" && (
            <>
              <p>
                <strong>UI Assist services</strong>
              </p>
              <ul className="list">
                <li>
                  <strong>
                    {title || <em className="muted">Service name…</em>}
                  </strong>
                  {body ? ` · ${body}` : " · Phone not listed"}
                  {form.link_url?.trim() ? (
                    <>
                      {" "}
                      ·{" "}
                      <span style={{ color: "var(--accent, #60a5fa)" }}>
                        Website
                      </span>
                    </>
                  ) : null}
                </li>
              </ul>
            </>
          )}
        </div>
      ) : form.section === "agent_card" ? (
        // Matches AgentResponseCardsPage tool-card style
        <article className="tool-card">
          <h3 style={{ marginBottom: "8px" }}>
            {title || <em className="muted">Untitled</em>}
            <span className="badge badge--info" style={{ marginLeft: "8px" }}>
              New
            </span>
          </h3>
          <p className="muted">{body || "…"}</p>
        </article>
      ) : form.section === "top_action" ? (
        // Matches HomePage ToolCard style
        <article className="tool-card">
          <h3 style={{ marginBottom: "6px" }}>
            {title || <em className="muted">Untitled</em>}
          </h3>
          <p className="muted" style={{ marginBottom: "10px" }}>
            {body || "…"}
          </p>
          <span className="pill" style={{ fontSize: "11px" }}>
            Start action →
          </span>
        </article>
      ) : (
        // Matches TrendsTipsPage result card style
        <article className="result stack">
          <div className="title-row">
            <h3>{title || <em className="muted">Untitled</em>}</h3>
            <span className={priorityBadgeClass(form.priority)}>
              {form.priority.toUpperCase()}
            </span>
            <span className="badge badge--info">New</span>
          </div>
          <p>{body || <em className="muted">No content yet…</em>}</p>
          <p className="muted" style={{ fontSize: "12px" }}>
            Type: {form.section} · Owner: Manager Portal · Effective: {today}
            {form.expires_on ? ` · Expires: ${form.expires_on}` : ""}
          </p>
        </article>
      )}
    </div>
  );
}

function EntryForm({
  initial = EMPTY_FORM,
  campaign,
  onSave,
  onCancel,
  loading,
}) {
  const [form, setForm] = useState(initial);
  const meta = SECTION_META[form.section] ?? SECTION_META.trend;
  const sectionOptions = getSectionOptions(campaign);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      section: form.section,
      title: meta.showTitle ? form.title.trim() : "",
      body: form.body.trim(),
      priority: meta.showPriority ? form.priority : "medium",
      expires_on: meta.showExpiry ? form.expires_on || null : null,
      link_url: meta.showLink ? form.link_url?.trim() || null : null,
    });
  }

  return (
    <div className="manager-form-with-preview">
      <form
        className="stack"
        onSubmit={handleSubmit}
        aria-label="Content entry form"
      >
        {/* Row 1: Section always shown; Priority + Expiry conditional */}
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="entry-section">Section</label>
            <select
              id="entry-section"
              value={form.section}
              onChange={(e) => set("section", e.target.value)}
            >
              {sectionOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          {meta.showPriority && (
            <div className="form-field">
              <label htmlFor="entry-priority">Priority</label>
              <select
                id="entry-priority"
                value={form.priority}
                onChange={(e) => set("priority", e.target.value)}
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {meta.showExpiry && (
            <div className="form-field">
              <label htmlFor="entry-expires">Expires on (optional)</label>
              <input
                id="entry-expires"
                type="date"
                value={form.expires_on ?? ""}
                onChange={(e) => set("expires_on", e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Title — hidden for call text-only sections */}
        {meta.showTitle && (
          <div className="form-field">
            <label htmlFor="entry-title">Title</label>
            <input
              id="entry-title"
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-field">
          <label htmlFor="entry-body">{meta.bodyLabel}</label>
          <textarea
            id="entry-body"
            rows={4}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            required
          />
        </div>

        {/* Link URL — shown for top_action and call_support_resource */}
        {meta.showLink && (
          <div className="form-field">
            <label htmlFor="entry-link">{meta.linkLabel}</label>
            <input
              id="entry-link"
              type={meta.linkType === "url" ? "url" : "text"}
              value={form.link_url ?? ""}
              onChange={(e) => set("link_url", e.target.value)}
              required={meta.linkRequired}
              placeholder={
                form.section === "top_action" ? "/base-period" : "https://…"
              }
            />
          </div>
        )}

        <div className="actions-row">
          <AppButton type="submit" disabled={loading}>
            {loading ? "Saving…" : "Save"}
          </AppButton>
          {onCancel && (
            <AppButton
              type="button"
              className="button-secondary"
              onClick={onCancel}
            >
              Cancel
            </AppButton>
          )}
        </div>
      </form>
      <EntryPreview form={form} />
    </div>
  );
}

function EntryRow({ entry, onEdit, onDeactivate }) {
  // call sections may not have a meaningful title — fall back to body snippet
  const displayTitle =
    entry.title?.trim() ||
    entry.body?.slice(0, 80) + (entry.body?.length > 80 ? "…" : "");

  return (
    <article className="result">
      <div className="stack" style={{ gap: "4px", flex: 1 }}>
        <div className="title-row" style={{ flexWrap: "wrap", gap: "8px" }}>
          <strong>{displayTitle}</strong>
          <span className="badge badge--info">
            {SECTION_LABELS[entry.section] ?? entry.section}
          </span>
          <span
            className={
              entry.priority === "high"
                ? "badge badge--error"
                : entry.priority === "medium"
                  ? "badge badge--warn"
                  : "badge"
            }
          >
            {entry.priority}
          </span>
          {entry.expires_on && (
            <span className="muted" style={{ fontSize: "12px" }}>
              Expires {entry.expires_on}
            </span>
          )}
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {entry.body}
        </p>
      </div>
      <div className="actions-row" style={{ alignItems: "center" }}>
        <AppButton
          type="button"
          className="button-secondary"
          onClick={() => onEdit(entry)}
        >
          Edit
        </AppButton>
        <AppButton
          type="button"
          className="button-secondary"
          onClick={() => onDeactivate(entry.id)}
        >
          Remove
        </AppButton>
      </div>
    </article>
  );
}

function ManagerPortalPage() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [managerCampaigns, setManagerCampaigns] = useState([]);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [view, setView] = useState("pages"); // "pages" | "sections" | "entries"
  const [activePage, setActivePage] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Resolve initial auth state
  useEffect(() => {
    if (DEV_BYPASS) {
      setUser(DEV_USER);
      setAuthChecked(true);
      return;
    }

    getCurrentUser().then((u) => {
      setUser(u);
      setAuthChecked(true);
    });

    return subscribeAuthState((u) => {
      setUser(u);
      setAuthChecked(true);
    });
  }, []);

  // Load the manager's campaign assignments after login
  useEffect(() => {
    if (!user) {
      setManagerCampaigns([]);
      setActiveCampaign(null);
      return;
    }
    if (DEV_BYPASS) {
      setManagerCampaigns(DEV_CAMPAIGNS);
      setActiveCampaign(DEV_CAMPAIGNS[0]);
      return;
    }
    getManagerCampaigns().then((campaigns) => {
      setManagerCampaigns(campaigns);
      setActiveCampaign(campaigns[0] ?? null);
    });
  }, [user]);

  // Load entries when the active campaign changes
  useEffect(() => {
    if (!activeCampaign) {
      setEntries([]);
      return;
    }
    if (DEV_BYPASS) {
      // Dev mode: start with empty in-memory list; CRUD ops update local state.
      setEntries([]);
      return;
    }
    setLoadingEntries(true);
    fetchManagerContent(activeCampaign).then((data) => {
      setEntries(data);
      setLoadingEntries(false);
    });
  }, [activeCampaign]);

  async function handleSaveNew(formData) {
    if (DEV_BYPASS) {
      const devEntry = {
        id: `dev-${Date.now()}`,
        ...formData,
        campaign: activeCampaign,
        author_id: "dev-user",
        published_at: new Date().toISOString(),
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setEntries((prev) => [devEntry, ...prev]);
      setShowAddForm(false);
      setFeedback(
        "[DEV] Entry added (in-memory only — not saved to database).",
      );
      setTimeout(() => setFeedback(""), 4000);
      return;
    }

    setSaving(true);
    const { error } = await createEntry({
      ...formData,
      campaign: activeCampaign,
    });
    setSaving(false);

    if (error) {
      setFeedback(`Error: ${error.message}`);
      return;
    }

    setFeedback("Entry published.");
    setShowAddForm(false);
    const refreshed = await fetchManagerContent(activeCampaign);
    setEntries(refreshed);
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleSaveEdit(formData) {
    if (!editingEntry) return;

    if (DEV_BYPASS) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === editingEntry.id
            ? { ...e, ...formData, updated_at: new Date().toISOString() }
            : e,
        ),
      );
      setEditingEntry(null);
      setFeedback("[DEV] Entry updated (in-memory only).");
      setTimeout(() => setFeedback(""), 4000);
      return;
    }

    setSaving(true);
    const { error } = await updateEntry(editingEntry.id, formData);
    setSaving(false);

    if (error) {
      setFeedback(`Error: ${error.message}`);
      return;
    }

    setFeedback("Entry updated.");
    setEditingEntry(null);
    const refreshed = await fetchManagerContent(activeCampaign);
    setEntries(refreshed);
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleDeactivate(id) {
    if (!window.confirm("Remove this entry? Agents will no longer see it."))
      return;

    if (DEV_BYPASS) {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setFeedback("[DEV] Entry removed (in-memory only).");
      setTimeout(() => setFeedback(""), 4000);
      return;
    }

    const { error } = await deactivateEntry(id);

    if (error) {
      setFeedback(`Error: ${error.message}`);
      return;
    }

    setFeedback("Entry removed.");
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleSignOut() {
    if (DEV_BYPASS) {
      // In dev bypass, sign out just resets to the login screen.
      setUser(null);
      setAuthChecked(false);
      setTimeout(() => {
        setUser(DEV_USER);
        setAuthChecked(true);
      }, 800);
      return;
    }
    await signOut();
  }

  return (
    <div className="manager-portal-shell">
      <header className="manager-portal-header">
        <div className="manager-portal-brand-block">
          <p className="manager-portal-brand">AZDES UI Toolbox</p>
          <h1 className="manager-portal-title">Manager Portal</h1>
        </div>
        {user && (
          <div className="actions-row">
            <span className="muted" style={{ fontSize: "13px" }}>
              {user.email}
            </span>
            <AppButton
              type="button"
              className="button-secondary"
              onClick={handleSignOut}
            >
              Sign out
            </AppButton>
          </div>
        )}
      </header>

      <main className="manager-portal-content stack">
        {DEV_BYPASS && (
          <div
            style={{
              background: "#7c3a00",
              color: "#fde68a",
              padding: "8px 14px",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              letterSpacing: "0.03em",
            }}
          >
            ⚠ DEV BYPASS — auth is disabled. Data is in-memory only and will not
            persist. Remove VITE_DEV_PORTAL_BYPASS from .env.local before
            connecting real Supabase credentials.
          </div>
        )}
        {!DEV_BYPASS && !isSupabaseConfigured ? (
          <div className="card">
            <p className="muted">
              Supabase is not configured. Copy{" "}
              <strong>.env.local.example</strong> to <strong>.env.local</strong>{" "}
              and add your project URL and anon key, then restart the dev
              server.
            </p>
          </div>
        ) : !authChecked ? (
          <p className="muted">Checking authentication…</p>
        ) : !user ? (
          <div className="card stack">
            <h2>Sign in</h2>
            <p className="muted">OMs and coaches only.</p>
            <LoginForm onLogin={setUser} />
          </div>
        ) : managerCampaigns.length === 0 ? (
          <div className="card">
            <p className="muted">
              Your account has not been assigned to any campaigns. Contact your
              administrator.
            </p>
          </div>
        ) : (
          <div className="stack">
            {/* Campaign tabs — only shown when manager has multiple campaigns */}
            {managerCampaigns.length > 1 && (
              <div className="card">
                <p
                  className="muted"
                  style={{ fontSize: "12px", marginBottom: "8px" }}
                >
                  Campaign
                </p>
                <div className="actions-row">
                  {managerCampaigns.map((key) => (
                    <AppButton
                      key={key}
                      type="button"
                      className={
                        activeCampaign === key ? "" : "button-secondary"
                      }
                      onClick={() => {
                        setActiveCampaign(key);
                        setView("pages");
                        setActivePage(null);
                        setActiveSection(null);
                        setShowAddForm(false);
                        setEditingEntry(null);
                      }}
                    >
                      {CAMPAIGN_CONFIG[key]?.label ?? key}
                    </AppButton>
                  ))}
                </div>
              </div>
            )}

            {feedback && (
              <div className="result">
                <p className="muted">{feedback}</p>
              </div>
            )}

            {/* VIEW: Page Picker */}
            {view === "pages" && (
              <div className="card stack">
                <h2>
                  {CAMPAIGN_CONFIG[activeCampaign]?.label ?? activeCampaign}
                </h2>
                <p className="muted">
                  Select a page to see its editable sections.
                </p>
                <div className="manager-page-grid">
                  {(PAGE_REGISTRY[activeCampaign] ?? []).map((page) => {
                    const total = entries.filter((e) =>
                      page.sections.some((s) => s.key === e.section),
                    ).length;
                    return (
                      <button
                        key={page.id}
                        type="button"
                        className="manager-page-card"
                        onClick={() => {
                          setActivePage(page);
                          setView("sections");
                        }}
                      >
                        <strong className="manager-page-card-title">
                          {page.label}
                        </strong>
                        <p className="muted manager-page-card-desc">
                          {page.description}
                        </p>
                        <span className="badge">
                          {total} {total === 1 ? "entry" : "entries"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW: Section Preview */}
            {view === "sections" && activePage && (
              <div className="card stack">
                <div className="manager-breadcrumb">
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => {
                      setView("pages");
                      setActivePage(null);
                    }}
                  >
                    All Pages
                  </button>
                  <span className="manager-breadcrumb-sep">›</span>
                  <span>{activePage.label}</span>
                </div>
                <h2>{activePage.label}</h2>
                <p className="muted">{activePage.description}</p>
                <PageWireframe
                  page={activePage}
                  entries={entries}
                  onManageSection={(key) => {
                    setActiveSection(key);
                    setView("entries");
                  }}
                />
              </div>
            )}

            {/* VIEW: Entry List */}
            {view === "entries" && activePage && activeSection && (
              <div className="card stack">
                <div className="manager-breadcrumb">
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => {
                      setView("pages");
                      setActivePage(null);
                      setActiveSection(null);
                    }}
                  >
                    All Pages
                  </button>
                  <span className="manager-breadcrumb-sep">›</span>
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => {
                      setView("sections");
                      setActiveSection(null);
                      setShowAddForm(false);
                      setEditingEntry(null);
                    }}
                  >
                    {activePage.label}
                  </button>
                  <span className="manager-breadcrumb-sep">›</span>
                  <span>{SECTION_LABELS[activeSection] ?? activeSection}</span>
                </div>
                <div className="title-row">
                  <h2>{SECTION_LABELS[activeSection] ?? activeSection}</h2>
                  <span className="pill">
                    {entries.filter((e) => e.section === activeSection).length}{" "}
                    {entries.filter((e) => e.section === activeSection)
                      .length === 1
                      ? "entry"
                      : "entries"}
                  </span>
                </div>

                <div className="actions-row">
                  <AppButton
                    type="button"
                    onClick={() => {
                      setShowAddForm((prev) => !prev);
                      setEditingEntry(null);
                    }}
                  >
                    {showAddForm ? "Cancel" : "+ Add entry"}
                  </AppButton>
                </div>

                {/* Add form */}
                {showAddForm && !editingEntry && (
                  <div className="card stack">
                    <h3>New entry</h3>
                    <EntryForm
                      campaign={activeCampaign}
                      initial={{ ...EMPTY_FORM, section: activeSection }}
                      onSave={handleSaveNew}
                      onCancel={() => setShowAddForm(false)}
                      loading={saving}
                    />
                  </div>
                )}

                {/* Edit form */}
                {editingEntry && (
                  <div className="card stack">
                    <h3>Edit entry</h3>
                    <EntryForm
                      campaign={activeCampaign}
                      initial={{
                        section: editingEntry.section,
                        title: editingEntry.title ?? "",
                        body: editingEntry.body ?? "",
                        priority: editingEntry.priority ?? "medium",
                        expires_on: editingEntry.expires_on ?? "",
                        link_url: editingEntry.link_url ?? "",
                      }}
                      onSave={handleSaveEdit}
                      onCancel={() => setEditingEntry(null)}
                      loading={saving}
                    />
                  </div>
                )}

                {/* Entry list */}
                {loadingEntries ? (
                  <p className="muted">Loading entries…</p>
                ) : entries.filter((e) => e.section === activeSection)
                    .length === 0 ? (
                  <p className="muted">No entries in this section yet.</p>
                ) : (
                  <div className="stack">
                    {entries
                      .filter((e) => e.section === activeSection)
                      .map((entry) => (
                        <EntryRow
                          key={entry.id}
                          entry={entry}
                          onEdit={(e) => {
                            setEditingEntry(e);
                            setShowAddForm(false);
                          }}
                          onDeactivate={handleDeactivate}
                        />
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default ManagerPortalPage;
