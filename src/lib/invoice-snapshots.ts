export function snapshotString(
  snapshot: unknown,
  field: string,
  fallback: string | null = null,
) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return fallback;
  }
  const value = (snapshot as Record<string, unknown>)[field];
  return typeof value === "string" && value.trim() ? value : fallback;
}

export function snapshotNumber(
  snapshot: unknown,
  field: string,
  fallback: number | null = null,
) {
  if (!snapshot || typeof snapshot !== "object" || Array.isArray(snapshot)) {
    return fallback;
  }
  const value = (snapshot as Record<string, unknown>)[field];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
