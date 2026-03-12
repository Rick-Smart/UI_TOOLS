import { isSupabaseConfigured, supabase } from "./supabaseClient";

const TABLE = "manager_content";

/**
 * Fetch all active, non-expired manager content entries.
 * Optionally filter by section.
 *
 * @param {string} [section] - Optional section filter.
 * @returns {Promise<Array>}
 */
export async function fetchManagerContent(section) {
  if (!isSupabaseConfigured) return [];

  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("is_active", true)
    .or(
      `expires_on.is.null,expires_on.gte.${new Date().toISOString().slice(0, 10)}`,
    )
    .order("published_at", { ascending: false });

  if (section) {
    query = query.eq("section", section);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[managerStore] fetchManagerContent error:", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * Subscribe to realtime changes on active manager content.
 * Calls onChange with the full refreshed list whenever a row is
 * inserted, updated, or deleted.
 *
 * @param {(entries: Array) => void} onChange
 * @param {string} [section]
 * @returns {() => void} Unsubscribe function
 */
export function subscribeManagerContent(onChange, section) {
  if (!isSupabaseConfigured) return () => {};

  // Fetch immediately so caller has initial data.
  fetchManagerContent(section).then(onChange);

  const channel = supabase
    .channel(`manager_content_changes_${section ?? "all"}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: TABLE },
      () => {
        // On any change, re-fetch the full filtered list.
        fetchManagerContent(section).then(onChange);
      },
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}

/**
 * Create a new manager content entry.
 * author_id is set to the currently authenticated user.
 *
 * @param {{ section: string, title: string, body: string, priority?: string, expires_on?: string }} entry
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 */
export async function createEntry(entry) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error("Supabase is not configured.") };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: new Error("Not authenticated.") };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert([{ ...entry, author_id: user.id }])
    .select()
    .single();

  return { data, error };
}

/**
 * Update an existing entry. Only the owning manager may update.
 *
 * @param {string} id
 * @param {Partial<{ title: string, body: string, priority: string, expires_on: string, is_active: boolean }>} changes
 * @returns {Promise<{ data: object|null, error: Error|null }>}
 */
export async function updateEntry(id, changes) {
  if (!isSupabaseConfigured) {
    return { data: null, error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(changes)
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

/**
 * Soft-delete an entry by setting is_active = false.
 *
 * @param {string} id
 * @returns {Promise<{ error: Error|null }>}
 */
export async function deactivateEntry(id) {
  if (!isSupabaseConfigured) {
    return { error: new Error("Supabase is not configured.") };
  }

  const { error } = await supabase
    .from(TABLE)
    .update({ is_active: false })
    .eq("id", id);

  return { error };
}
