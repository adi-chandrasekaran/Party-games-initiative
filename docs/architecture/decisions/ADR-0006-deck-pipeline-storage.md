# ADR-0006: Validated Deck Pipeline and Compatibility Storage

- Status: Accepted
- Date: 2026-08-16

## Context

Deck uploads previously accepted a PDF data URL, extracted unstructured text, and exposed the
complete record to every authenticated user. That did not provide source validation, ownership
boundaries, or a game-ready shared representation.

## Decision

PR-11 validates PDF signatures, file names, sizes, and titles at the platform API boundary.
It stores source data with metadata and a synchronous local extraction result, exposing structured
term/definition items to games. Source bytes are omitted from shared summaries and deletion is
restricted to the uploading identity. The existing platform PostgreSQL compatibility store remains
the local persistence adapter; a future object-store/worker implementation can satisfy the same
pipeline boundary.

## Consequences

- Existing text-only decks remain readable through the compatibility extractor.
- No destructive deck migration is required.
- The local API performs extraction synchronously; large-scale asynchronous processing remains out
  of scope until deployment architecture is selected.
