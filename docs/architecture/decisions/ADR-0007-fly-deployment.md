# ADR-0007: Single-Machine Fly.io Deployment

- Status: Accepted
- Date: 2026-08-18

## Context

The Forge has one platform HTTP/Socket.IO server and PostgreSQL-backed persistence. Supabase
supplies Google identity and production PostgreSQL. Socket.IO broadcasts are process-local even
though room state is shared, so multiple application machines would split realtime events.

## Decision

Deploy the platform as one Fly.io application in Singapore (`sin`) using a repository Dockerfile.
The application listens on port 8080, receives a Supabase PostgreSQL `DATABASE_URL` as a Fly
secret, and exposes database-aware `/api/health` checks. Keep one running machine and disable
autostop until a cross-machine Socket.IO adapter is introduced.

## Consequences

- The generated Fly hostname is the initial production origin; a custom domain is deferred.
- Deployment configuration never includes Supabase credentials. Public Vite configuration is
  supplied only as documented build values when a human authorizes deployment.
- Scaling beyond one machine is deliberately blocked by configuration rather than silently
  degrading realtime gameplay.
