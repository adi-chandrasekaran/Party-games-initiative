# Supabase Authentication and Future Fly Release

This guide configures the single Supabase project used by The Forge in two stages:

1. **Local Google sign-in now.** This creates no Fly resources and makes no public release.
2. **Fly release later.** Use this section only after a human explicitly authorizes deployment.

Automated tests do not require a live Supabase project, a Google account, or any real
credentials. They use isolated test fixtures instead.

## Keep credentials in the right place

| Value | Local location | Fly location | Commit it? |
| --- | --- | --- | --- |
| Supabase project URL | `apps/hub/.env` | runtime secret and build argument | No |
| Supabase publishable key | `apps/hub/.env` | runtime secret and build argument | No |
| Google OAuth client secret | Supabase dashboard only | Supabase dashboard only | Never |
| Supabase service-role key | Not required by The Forge | Not required by The Forge | Never |
| PostgreSQL connection URL | local shell environment | Fly runtime secret | Never |

The Supabase URL and publishable key are safe to expose to the browser, but keeping them in an
uncommitted environment file avoids tying this repository to one Supabase project. A publishable
key is not a service-role key and does not bypass Supabase Row Level Security.

## Set 1: Local Google sign-in (do this now)

### 1. Create one Supabase project

1. Sign in to the [Supabase Dashboard](https://supabase.com/dashboard/projects) and create a
   project for The Forge. The free plan is sufficient for local testing.
2. In **Project Settings → API**, copy the **Project URL** and the **Publishable key**. Use the
   current `sb_publishable_...` key, not a service-role key. The Forge operator owns this
   Supabase project; AISC users do not need access to it.

This is a hosted Supabase project accessed by a locally running Forge. Do not run a separate
local Supabase stack unless you specifically need to test Supabase itself; Google OAuth is simpler
to validate against this one project.

### 2. Configure Google OAuth in Google Cloud

1. Open the [Google Cloud Console](https://console.cloud.google.com/), select or create the
   project that will own Forge sign-in, and configure its consent screen as an **external** app.
   The Forge operator owns this project and its OAuth client; AISC Workspace administrator access
   is not required.
2. Create an OAuth 2.0 **Web application** client.
3. Add this authorized JavaScript origin:

   ```text
   http://localhost:8787
   ```

4. In the Supabase Dashboard, open **Authentication → Providers → Google**. Copy the Supabase
   callback URL shown there, then add that exact URL as an authorized redirect URI in Google
   Cloud. It normally has this shape:

   ```text
   https://<supabase-project-ref>.supabase.co/auth/v1/callback
   ```

5. Copy the Google OAuth client ID and client secret into Supabase's Google provider settings,
   enable the provider, and save. Do not place either value in this repository or in Fly.

Do not attempt to make this OAuth client **internal** to AISC unless an AISC Workspace
administrator owns or authorizes the Google Cloud project. An external client is the expected
model for a customer-facing Forge. Google may show its consent screen to any Google user, but
Forge must grant an application session only to approved AISC Workspace identities.

### 2a. Domain authorization policy

The `hd=aischennai.org` OAuth parameter may be used as an account-picker hint, but it is not an
authorization control. The server must validate the `hd` (hosted-domain) claim returned by Google
and require exactly `aischennai.org`, in addition to requiring a confirmed Google identity.
Checking only whether an email string ends in `@aischennai.org` is not sufficient to prove
Workspace membership.

**Current implementation status:** Forge currently verifies the Google provider, confirmed email,
and `@aischennai.org` email suffix. It does not yet validate the Google `hd` claim. Local testing
with AISC accounts can proceed, but production deployment is blocked on the dedicated server-side
`hd` validation change and its regression tests.

### 3. Allow the local Forge callback in Supabase

Open **Authentication → URL Configuration** in Supabase and set:

- **Site URL:** `http://localhost:8787`
- **Redirect URLs:** add `http://localhost:8787` and `http://127.0.0.1:8787`

### 4. Create the uncommitted local environment file

From the repository root, create the safe template only if you do not already have a local
environment file:

```bash
test -f apps/hub/.env || cp apps/hub/.env.example apps/hub/.env
```

Replace the first four placeholder values in `apps/hub/.env` with the URL and publishable key
from step 1. The values must match in both server and browser entries:

```dotenv
SUPABASE_URL=https://<supabase-project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_<your-key>
VITE_SUPABASE_URL=https://<supabase-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<your-key>
TRUSTED_ORIGINS=http://localhost:8787,http://127.0.0.1:8787
VITE_ENABLE_LOCAL_AUTH=false
```

Keep `.env` uncommitted. Do not enable `VITE_ENABLE_LOCAL_AUTH` when testing Google sign-in; it
exists only as a local fallback when Supabase has not yet been configured.

### 5. Run and verify locally

The hub build reads `apps/hub/.env`, while the platform server receives values from the shell.
Start both with:

```bash
set -a
source apps/hub/.env
set +a
pnpm dev
```

Open `http://localhost:8787`, choose **Continue with Google**, and use a verified
`@aischennai.org` account. After returning to the Forge, reload once to confirm the session
persists. Log out and confirm the gate returns. In a private window, a non-AISC Google account
must be rejected. This validates the current email-domain gate; complete the `hd` hardening
before treating it as the final production control.

If the page says Supabase configuration is missing, stop the process and start it again with the
three `set`/`source` commands above. If Google reports `redirect_uri_mismatch`, compare the
callback URL in Google Cloud character-for-character with the callback URL displayed in Supabase.

## Set 2: Fly release (do this only after explicit authorization)

This section does **not** authorize a deployment. Until a human explicitly approves a release, do
not create a Fly app, set Fly secrets, or run `fly deploy`.

### 1. Decide the production origin

1. Choose an available Fly app name and update `app` in `fly.toml`.
2. Its initial Forge origin will be `https://<app-name>.fly.dev`.
3. Add that origin to Supabase **Authentication → URL Configuration** as both the Site URL (when
   it becomes the primary site) and a redirect URL.
4. Add the same origin as an authorized JavaScript origin in Google Cloud. The Google redirect
   URI remains Supabase's callback URL; it does not change to the Fly URL.

Keep the localhost origins during testing so both local and hosted sign-in continue to work.

### 2. Provide production configuration without committing secrets

At deployment time, set these **Fly runtime secrets**:

```text
DATABASE_URL
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
TRUSTED_ORIGINS=https://<app-name>.fly.dev
```

Build the image with these **public Vite build arguments**:

```text
VITE_SUPABASE_URL=https://<supabase-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_<your-key>
```

The Dockerfile intentionally bakes the two `VITE_` values into the static browser bundle at
build time. Setting them only as Fly runtime secrets is insufficient because the Vite bundle has
already been built. Never supply a Google client secret, Supabase service-role key, or a database
URL as a build argument.

### 3. Release and verify

Only after explicit human authorization **and after the `hd` validation change described above is
merged**, follow the release procedure in [`../deployment/fly.md`](../deployment/fly.md). Verify
`/api/health`, Google sign-in, logout, rejection of a non-AISC identity, authenticated API access,
and a two-browser multiplayer host/join flow. Keep exactly one Fly machine running because
Socket.IO broadcasts are not yet cross-machine.

## CI/CD boundary

CI runs lint, type checks, builds, unit tests, integration tests, and Playwright without real
Supabase or Google credentials. A future authorized deployment workflow may pass the two public
Vite values as protected build configuration and use Fly secrets for server values. It must never
print credentials in logs or commit them to the repository.
