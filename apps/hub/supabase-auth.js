import { createClient } from "@supabase/supabase-js";

const SCHOOL_DOMAIN = "@aischennai.org";

function configuredValue(name) {
  return String(process.env[name] || "").trim();
}

export function supabaseAuthConfigured() {
  return Boolean(configuredValue("SUPABASE_URL") && configuredValue("SUPABASE_PUBLISHABLE_KEY"));
}

export function createSupabaseTokenVerifier({ url = configuredValue("SUPABASE_URL"), publishableKey = configuredValue("SUPABASE_PUBLISHABLE_KEY") } = {}) {
  if (!url || !publishableKey) {
    return async () => {
      throw new Error("Supabase authentication is not configured yet.");
    };
  }

  const client = createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
  return async (accessToken) => {
    if (!String(accessToken || "").trim()) throw new Error("Supabase access token is required.");
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data?.user) throw new Error("Supabase access token is invalid or expired.");
    const user = data.user;
    const email = String(user.email || "").trim().toLowerCase();
    const isGoogleIdentity = (user.identities || []).some((identity) => identity.provider === "google");
    if (!email.endsWith(SCHOOL_DOMAIN) || !user.email_confirmed_at || !isGoogleIdentity) {
      throw new Error("Only verified @aischennai.org Google accounts can access The Forge.");
    }
    return {
      id: user.id,
      email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || email.split("@")[0],
      picture: user.user_metadata?.avatar_url || user.user_metadata?.picture || "",
    };
  };
}
