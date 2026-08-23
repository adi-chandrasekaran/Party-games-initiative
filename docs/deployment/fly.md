# Fly.io Deployment Preparation

PR-16 prepares deployment but does not create an app, configure secrets, or deploy a release.
Follow **Set 1** in
[`../development/supabase-and-fly-setup.md`](../development/supabase-and-fly-setup.md) to verify
Google sign-in locally first. **Set 2** in that guide is the credential-placement reference for
this release checklist.

## Human-authorized deployment checklist

1. Choose an available Fly app name and replace `app` in `fly.toml`; retain the `sin` region and
   one-machine configuration.
2. In Supabase, add the generated `https://<app>.fly.dev` URL to the redirect allow list. Configure
   the same origin as a JavaScript origin in Google OAuth; keep Supabase's provider callback URL
   as the Google redirect URI.
3. Set Fly secrets outside source control: `DATABASE_URL`, `SUPABASE_URL`, and
   `SUPABASE_PUBLISHABLE_KEY`. Set `TRUSTED_ORIGINS=https://<app>.fly.dev`.
4. Provide the public `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` at image build
   time. They are publishable client configuration, not service-role credentials.
5. Only after explicit human approval, run `fly deploy`, then verify `/api/health`, Supabase
   Google sign-in, authenticated API access, and a two-browser multiplayer host/join flow.

## Rollback

Use `fly releases` to identify the prior healthy image and `fly releases rollback <version>`.
Do not scale above one machine during rollback or normal operation; Socket.IO cross-machine
broadcasting is not implemented yet.
