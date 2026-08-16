# ADR-0005: Platform Realtime Namespaces and Shared Rooms

- Status: Accepted
- Date: 2026-08-16

## Context

Quiz Shooter and Build A Beast currently host Socket.IO on separate ports. Their rooms and host
authority are held in process memory and tied to socket IDs, so reconnects and multiple platform
server instances cannot be made reliable.

## Decision

PR-10 mounts authenticated Socket.IO namespaces on the platform server and stores room state in
the existing PostgreSQL persistence boundary. Room participants are bound to a stable server-side
user identity rather than a socket ID. The legacy servers remain rollback adapters until PR-13.

## Consequences

- One platform server owns HTTP and realtime endpoints during the local refactor.
- A reconnect can replace a participant socket without changing room ownership.
- A second platform server can read and update the same room records in local integration tests.
- Socket.IO transport remains temporarily; no deployment or Redis adapter is selected in this PR.
