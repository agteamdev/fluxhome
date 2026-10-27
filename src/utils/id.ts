/** Unique identifier for bookmarks, groups, widgets, etc. */
export function uid(): string {
  return crypto.randomUUID();
}
