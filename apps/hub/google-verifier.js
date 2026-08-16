import { OAuth2Client } from "google-auth-library";

const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);

export function createGoogleVerifier({ clientId, verifyIdToken } = {}) {
  const verify = verifyIdToken || ((credential) => new OAuth2Client(clientId).verifyIdToken({ idToken: credential, audience: clientId }));

  return async (credential) => {
    if (!clientId) throw new Error("Google sign-in is not configured yet.");
    if (!String(credential || "").trim()) throw new Error("Google sign-in credential is required.");
    const ticket = await verify(String(credential));
    const payload = typeof ticket?.getPayload === "function" ? ticket.getPayload() : ticket;
    if (!payload?.sub || !payload?.email || payload.email_verified !== true) throw new Error("Google sign-in did not provide a verified identity.");
    if (!GOOGLE_ISSUERS.has(payload.iss)) throw new Error("Google sign-in has an invalid issuer.");
    if (payload.aud !== clientId) throw new Error("Google sign-in was issued for a different client.");
    if (payload.exp && Number(payload.exp) * 1000 <= Date.now()) throw new Error("Google sign-in credential has expired.");
    const email = String(payload.email).trim().toLowerCase();
    if (!email.endsWith("@aischennai.org")) throw new Error("Only @aischennai.org accounts can access The Forge.");
    if (payload.hd !== "aischennai.org") throw new Error("Google sign-in is not managed by AISC.");
    return { email, name: String(payload.name || payload.given_name || email.split("@")[0]), picture: String(payload.picture || ""), googleSub: String(payload.sub) };
  };
}
