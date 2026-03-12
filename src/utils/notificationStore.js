import { isSupabaseConfigured, supabase } from "./supabaseClient";

const TABLE = "manager_content";
const NOTIFICATION_EVENT = "azdes-notifications-updated";

function getLastSeenKey(campaign) {
  return `azdes.notifications.${campaign}.lastSeenAt`;
}

/**
 * Read the timestamp the agent last acknowledged new content for a campaign.
 * @param {string} campaign
 * @returns {string|null}
 */
export function getLastSeenAt(campaign) {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(getLastSeenKey(campaign));
}

/**
 * Persist the current time as the agent's "last seen" timestamp for a
 * campaign and broadcast to any active listeners in the same tab.
 * @param {string} campaign
 */
export function markSeen(campaign) {
  if (typeof window === "undefined") return;
  const now = new Date().toISOString();
  window.localStorage.setItem(getLastSeenKey(campaign), now);
  window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT));
}

/**
 * Fetch the most recent published_at timestamp for a campaign.
 * @param {string} campaign
 * @returns {Promise<string|null>}
 */
export async function fetchLatestPublishedAt(campaign) {
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from(TABLE)
    .select("published_at")
    .eq("is_active", true)
    .eq("campaign", campaign)
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
 * timestamp for a campaign.
 * @param {string} campaign
 * @returns {Promise<boolean>}
 */
export async function checkForNew(campaign) {
  const latest = await fetchLatestPublishedAt(campaign);
  if (!latest) return false;

  const lastSeen = getLastSeenAt(campaign);
  if (!lastSeen) return true;

  return new Date(latest) > new Date(lastSeen);
}

/**
 * Subscribe to realtime inserts/updates on manager_content for a campaign
 * AND to the local storage event so the badge clears immediately on dismiss.
 *
 * Calls onChange(hasNew: boolean) immediately and on every change.
 *
 * @param {(hasNew: boolean) => void} onChange
 * @param {string} campaign
 * @returns {() => void} Unsubscribe function
 */
export function subscribeNotifications(onChange, campaign) {
  let mounted = true;

  async function refresh() {
    if (!mounted) return;
    const hasNew = await checkForNew(campaign);
    if (mounted) onChange(hasNew);
  }

  refresh();

  let channel = null;
  if (isSupabaseConfigured) {
    channel = supabase
      .channel(`notification_watcher_${campaign}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: TABLE },
        refresh,
      )
      .subscribe();
  }

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
