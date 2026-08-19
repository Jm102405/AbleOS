// Wraps fetch so every API call carries the signed-in user's token.
// A 401 usually just means the access token expired while the tab sat idle,
// so we refresh once and retry. Only a failed refresh means the session is
// really dead, and only then do we sign out.
import { supabase } from "./supabase";

/**
 * Which cockpit the user is currently looking at. Only meaningful for admins
 * viewing someone else's dashboard; the server ignores it otherwise.
 */
let actingAs: string | null = null;

export function setActingAs(cockpit: string | null) {
  actingAs = cockpit;
}

/**
 * Supabase revokes the whole session if the same refresh token is used twice
 * outside its short reuse window. Several cards poll at once, so every caller
 * has to wait on one shared refresh rather than starting its own.
 */
let refreshInFlight: Promise<string | null> | null = null;

function refreshOnce(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = supabase.auth
      .refreshSession()
      .then(({ data, error }) => (error ? null : data.session?.access_token ?? null))
      .catch(() => null)
      .finally(() => {
        // Cleared on the next tick so requests that piled up during the
        // refresh all receive this same result.
        setTimeout(() => {
          refreshInFlight = null;
        }, 0);
      });
  }
  return refreshInFlight;
}

function send(url: string, init: RequestInit, token: string) {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (actingAs) headers.set("X-Act-As", actingAs);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(url, { ...init, headers });
}

export async function apiFetch(url: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) {
    return new Response(JSON.stringify({ error: "Not signed in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const res = await send(url, init, token);
  if (res.status !== 401) return res;

  // Idle tabs are the common case here: the token lapsed, the refresh timer
  // hadn't fired yet. Force a refresh and try the same request once more.
  const freshToken = await refreshOnce();

  if (freshToken && freshToken !== token) {
    const retry = await send(url, init, freshToken);
    if (retry.status !== 401) return retry;
  }

  // The refresh token itself is gone or rejected. Now it's a real sign-out.
  await supabase.auth.signOut();
  return res;
}
