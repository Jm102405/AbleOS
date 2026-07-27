// Wraps fetch so every API call carries the signed-in user's token.
import { supabase } from "./supabase";

export async function apiFetch(url: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  // No session: fail locally instead of firing a request the server will
  // reject anyway. Avoids a console 401 on every poll after sign-out.
  if (!token) {
    return new Response(JSON.stringify({ error: "Not signed in" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(url, { ...init, headers });
}
