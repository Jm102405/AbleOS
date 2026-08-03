// Wraps fetch so every API call carries the signed-in user's token.
// A 401 means the stored session is dead - sign out so the app returns to
// the login screen instead of sitting in a broken half-signed-in state.
import { supabase } from "./supabase";

/**
 * Which cockpit the user is currently looking at. Only meaningful for admins
 * viewing someone else's dashboard; the server ignores it otherwise.
 */
let actingAs: string | null = null;

export function setActingAs(cockpit: string | null) {
  actingAs = cockpit;
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

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (actingAs) headers.set("X-Act-As", actingAs);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, { ...init, headers });

  // The client thought it had a session but the server disagreed. Clear it.
  if (res.status === 401) {
    await supabase.auth.signOut();
  }

  return res;
}
