/** The API supplies accuracy in percentage points, optionally with a % suffix. */
export function parseAccuracy(value: unknown): number | null {
  const normalized = typeof value === 'string' ? value.trim().replace(/\s*%$/, '').replace(',', '.') : value;
  const parsed = typeof normalized === 'number' ? normalized
    : typeof normalized === 'string' && normalized ? Number(normalized) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : null;
}
