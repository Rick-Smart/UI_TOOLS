import { isSupabaseConfigured, supabase } from "./supabaseClient";

/**
 * Sign in with email and password.
 * Returns { user, error }.
 */
export async function signIn(email, password) {
  if (!isSupabaseConfigured) {
    return { user: null, error: new Error("Supabase is not configured.") };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { user: data?.user ?? null, error };
}

/**
 * Sign out the current manager session.
 */
export async function signOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

/**
 * Get the current session synchronously from the Supabase cache.
 * Returns the user object or null.
 */
export async function getCurrentUser() {
  if (!isSupabaseConfigured) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? null;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 *
 * @param {(user: import('@supabase/supabase-js').User | null) => void} onChange
 */
export function subscribeAuthState(onChange) {
  if (!isSupabaseConfigured) {
    onChange(null);
    return () => {};
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onChange(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}
