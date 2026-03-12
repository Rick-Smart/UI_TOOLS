import { useEffect, useState } from "react";
import PageSection from "../components/layout/PageSection";
import AppButton from "../components/ui/AppButton/AppButton";
import {
  getCurrentUser,
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
  const [entries, setEntries] = useState([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [activeSection, setActiveSection] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  // Resolve initial auth state
  useEffect(() => {
    getCurrentUser().then((u) => {
      setUser(u);
      setAuthChecked(true);
    });

    return subscribeAuthState((u) => {
      setUser(u);
      setAuthChecked(true);
    });
  }, []);

  // Load entries when authenticated
  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    setLoadingEntries(true);
    fetchManagerContent().then((data) => {
      setEntries(data);
      setLoadingEntries(false);
    });
  }, [user]);

  async function handleSaveNew(formData) {
    setSaving(true);
    const { error } = await createEntry(formData);
    setSaving(false);

    if (error) {
      setFeedback(`Error: ${error.message}`);
      return;
    }

    setFeedback("Entry published.");
    setShowAddForm(false);
    const refreshed = await fetchManagerContent();
    setEntries(refreshed);
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleSaveEdit(formData) {
    if (!editingEntry) return;
    setSaving(true);
    const { error } = await updateEntry(editingEntry.id, formData);
    setSaving(false);

    if (error) {
      setFeedback(`Error: ${error.message}`);
      return;
    }

    setFeedback("Entry updated.");
    setEditingEntry(null);
    const refreshed = await fetchManagerContent();
    setEntries(refreshed);
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleDeactivate(id) {
    if (!window.confirm("Remove this entry? Agents will no longer see it."))
      return;
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
    await signOut();
  }

  if (!isSupabaseConfigured) {
    return (
      <PageSection title="Manager Portal">
        <div className="result">
          <p className="muted">
            Supabase is not configured. Copy <strong>.env.local.example</strong>{" "}
            to <strong>.env.local</strong> and add your project URL and anon
            key, then restart the dev server.
          </p>
        </div>
      </PageSection>
    );
  }

  if (!authChecked) {
    return (
      <PageSection title="Manager Portal">
        <p className="muted">Checking authentication…</p>
      </PageSection>
    );
  }

  if (!user) {
    return (
      <PageSection
        title="Manager Portal"
        description="OMs and coaches only. Sign in to manage content."
      >
        <LoginForm onLogin={setUser} />
      </PageSection>
    );
  }

  const visibleEntries =
    activeSection === "all"
      ? entries
      : entries.filter((e) => e.section === activeSection);

  return (
    <PageSection
      title="Manager Portal"
      description="Publish and manage content visible to all agents in real time."
      headerContent={
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
      }
    >
      <div className="stack">
        {feedback && (
          <div className="result">
            <p className="muted">{feedback}</p>
          </div>
        )}

        {/* Section filter tabs */}
        <div className="actions-row" style={{ flexWrap: "wrap" }}>
          {[{ value: "all", label: "All" }, ...SECTION_OPTIONS].map((opt) => (
            <AppButton
              key={opt.value}
              type="button"
              className={activeSection === opt.value ? "" : "button-secondary"}
              onClick={() => setActiveSection(opt.value)}
            >
              {opt.label}
            </AppButton>
          ))}
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
    </PageSection>
  );
}

export default ManagerPortalPage;
