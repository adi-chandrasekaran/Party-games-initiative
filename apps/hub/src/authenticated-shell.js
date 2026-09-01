/**
 * Determines whether the approved Forge visual shell may be rendered.
 *
 * A signed-in user always receives the shell. The unauthenticated local-preview
 * path remains available only when both its build flag and explicit URL opt-in
 * are present; a bare `dev-auth` query cannot enable it in another environment.
 */
export function shouldEnableFigmaShell({
  isAuthenticated,
  localPreviewEnabled,
  localPreviewRequested,
}) {
  return Boolean(isAuthenticated) || Boolean(localPreviewEnabled && localPreviewRequested);
}
