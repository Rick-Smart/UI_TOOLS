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

const SECTION_OPTIONS = [
  { value: "trend", label: "Trend" },
  { value: "tip", label: "Tip" },
  { value: "suggestion", label: "Suggestion" },
  { value: "agent_card", label: "Agent Response Card" },
  { value: "top_action", label: "Top Action" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const SECTION_LABELS = Object.fromEntries(
  SECTION_OPTIONS.map((o) => [o.value, o.label]),
);

const CAMPAIGN_CONFIG = {
  "ui-kb": { label: "AZDES UI Knowledge Base" },
  "cbc-kb": { label: "CBC Knowledge Base" },
};

const EMPTY_FORM = {
  section: "trend",
  title: "",
  body: "",
  priority: "medium",
  expires_on: "",
};

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

function EntryPreview({ form }) {
  const today = new Date().toISOString().slice(0, 10);
  const title = form.title.trim();
  const body = form.body.trim();
  const hasContent = title || body;

  return (
    <div className="manager-preview-pane">
      <p className="manager-preview-label">Live preview</p>
      {!hasContent ? (
        <p className="muted" style={{ fontSize: "13px", fontStyle: "italic" }}>
          Fill in a title and content to see how it will look on the page.
        </p>
      ) : form.section === "agent_card" ? (
        // Matches AgentResponseCardsPage tool-card style
        <article className="tool-card">
          <h3 style={{ marginBottom: "8px" }}>
            {title || <em className="muted">Untitled</em>}
            <span className="badge badge--info" style={{ marginLeft: "8px" }}>
              New
            </span>
          </h3>
          <p className="muted">{body || "\u2026"}</p>
        </article>
      ) : form.section === "top_action" ? (
        // Matches HomePage ToolCard style
        <article className="tool-card">
          <h3 style={{ marginBottom: "6px" }}>
            {title || <em className="muted">Untitled</em>}
          </h3>
          <p className="muted" style={{ marginBottom: "10px" }}>
            {body || "\u2026"}
          </p>
          <span className="pill" style={{ fontSize: "11px" }}>
            Start action \u2192
          </span>
        </article>
      ) : (
        // Matches TrendsTipsPage result card style
        <article className="result stack">
          <div className="title-row">
            <h3>{title || <em className="muted">Untitled</em>}</h3>
            <span className="pill">{form.priority.toUpperCase()}</span>
            <span className="badge badge--info">New</span>
          </div>
          <p>{body || <em className="muted">No content yet\u2026</em>}</p>
          <p className="muted" style={{ fontSize: "12px" }}>
            Type: {form.section} \u00b7 Owner: Manager Portal \u00b7 Effective:{" "}
            {today}
            {form.expires_on ? ` \u00b7 Expires: ${form.expires_on}` : ""}
          </p>
        </article>
      )}
    </div>
  );
}

function EntryForm({ initial = EMPTY_FORM, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      section: form.section,
      title: form.title.trim(),
      body: form.body.trim(),
      priority: form.priority,
      expires_on: form.expires_on || null,
    });
  }

  return (
    <div className="manager-form-with-preview">
      <form
        className="stack"
        onSubmit={handleSubmit}
        aria-label="Content entry form"
      >
        <div className="form-row">
          <div className="form-field">
            <label htmlFor="entry-section">Section</label>
            <select
              id="entry-section"
              value={form.section}
              onChange={(e) => set("section", e.target.value)}
            >
              {SECTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
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
          <div className="form-field">
            <label htmlFor="entry-expires">Expires on (optional)</label>
            <input
              id="entry-expires"
              type="date"
              value={form.expires_on ?? ""}
              onChange={(e) => set("expires_on", e.target.value)}
            />
          </div>
        </div>

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

        <div className="form-field">
          <label htmlFor="entry-body">Content / Message</label>
          <textarea
            id="entry-body"
            rows={4}
            value={form.body}
            onChange={(e) => set("body", e.target.value)}
            required
          />
        </div>

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
  return (
    <article className="result">
      <div className="stack" style={{ gap: "4px", flex: 1 }}>
        <div className="title-row" style={{ flexWrap: "wrap", gap: "8px" }}>
          <strong>{entry.title}</strong>
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
  const [activeSection, setActiveSection] = useState("all");
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

  const visibleEntries =
    activeSection === "all"
      ? entries
      : entries.filter((e) => e.section === activeSection);

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
                        setActiveSection("all");
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

            <div className="card stack">
              <div className="title-row">
                <h2>
                  {CAMPAIGN_CONFIG[activeCampaign]?.label ?? activeCampaign}
                </h2>
                <span className="pill">{entries.length} entries</span>
              </div>

              {feedback && (
                <div className="result">
                  <p className="muted">{feedback}</p>
                </div>
              )}

              {/* Section filter tabs + add button */}
              <div className="actions-row" style={{ flexWrap: "wrap" }}>
                {[{ value: "all", label: "All" }, ...SECTION_OPTIONS].map(
                  (opt) => (
                    <AppButton
                      key={opt.value}
                      type="button"
                      className={
                        activeSection === opt.value ? "" : "button-secondary"
                      }
                      onClick={() => setActiveSection(opt.value)}
                    >
                      {opt.label}
                    </AppButton>
                  ),
                )}
                <AppButton
                  type="button"
                  onClick={() => {
                    setShowAddForm((prev) => !prev);
                    setEditingEntry(null);
                  }}
                  style={{ marginLeft: "auto" }}
                >
                  {showAddForm ? "Cancel" : "+ Add entry"}
                </AppButton>
              </div>

              {/* Add form */}
              {showAddForm && !editingEntry && (
                <div className="card stack">
                  <h3>New entry</h3>
                  <EntryForm
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
                    initial={{
                      section: editingEntry.section,
                      title: editingEntry.title,
                      body: editingEntry.body,
                      priority: editingEntry.priority,
                      expires_on: editingEntry.expires_on ?? "",
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
              ) : visibleEntries.length === 0 ? (
                <p className="muted">No entries in this section yet.</p>
              ) : (
                <div className="stack">
                  {visibleEntries.map((entry) => (
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
          </div>
        )}
      </main>
    </div>
  );
}

export default ManagerPortalPage;
