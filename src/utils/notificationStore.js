import { isSupabaseConfigured, supabase } from "./supabaseClient";

const LAST_SEEN_KEY = "azdes.notifications.lastSeenAt";
const TABLE = "manager_content";
const NOTIFICATION_EVENT = "azdes-notifications-updated";

/**
 * Read the timestamp the agent last acknowledged new content.
 * @returns {string|null} ISO timestamp string or null if never seen.
 */
export function getLastSeenAt() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LAST_SEEN_KEY);
}

/**
 * Persist the current time as the agent's "last seen" timestamp and
 * broadcast to any active listeners in the same tab.
 */
export function markSeen() {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  window.localStorage.setItem(LAST_SEEN_KEY, now);
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
}

/**
 * Fetch the most recent published_at timestamp across all active entries.
 * Returns null when Supabase is not configured or the table is empty.
 * @returns {Promise<string|null>}
 */
export async function fetchLatestPublishedAt() {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("published_at")
    .eq("is_active", true)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[notificationStore] fetchLatestPublishedAt:", error.message);
    return null;
  }

  return data?.published_at ?? null;
}

/**
 * Check whether there is content published after the agent's last seen
 * timestamp.
 * @returns {Promise<boolean>}
 */
export async function checkForNew() {
  const latest = await fetchLatestPublishedAt();
  if (!latest) return false;

  const lastSeen = getLastSeenAt();
  if (!lastSeen) return true; // never seen anything — treat as new

  return new Date(latest) > new Date(lastSeen);
}

/**
 * Subscribe to realtime inserts/updates on manager_content AND to the
 * local storage event so the badge clears immediately on dismiss.
 *
 * Calls onChange(hasNew: boolean) immediately and again on every change.
 *
 * @param {(hasNew: boolean) => void} onChange
 * @returns {() => void} Unsubscribe function
 */
export function subscribeNotifications(onChange) {
  let mounted = true;

  async function refresh() {
    if (!mounted) return;
    const hasNew = await checkForNew();
    if (mounted) onChange(hasNew);
  }

  // Initial check
  refresh();

  // Supabase realtime — notify on new/changed rows
  let channel = null;
  if (isSupabaseConfigured) {
    channel = supabase
      .channel("notification_watcher")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        refresh,
      )
      .subscribe();
  }

  // Local event — fires when markSeen() is called in the same tab
  function handleLocalEvent() {
    refresh();
  }
  window.addEventListener(NOTIFICATION_EVENT, handleLocalEvent);

  return () => {
    mounted = false;
    window.removeEventListener(NOTIFICATION_EVENT, handleLocalEvent);
    if (channel) supabase.removeChannel(channel);
  };
}
