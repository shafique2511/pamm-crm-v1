export function toTimestamp(value: unknown): number | null {
  const timestamp = new Date(String(value || '')).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function formatDate(value: unknown, fallback = 'N/A'): string {
  const timestamp = toTimestamp(value);
  return timestamp === null ? fallback : new Date(timestamp).toLocaleDateString();
}

export function formatDateTime(value: unknown, fallback = 'N/A'): string {
  const timestamp = toTimestamp(value);
  return timestamp === null ? fallback : new Date(timestamp).toLocaleString();
}

export function formatTime(value: unknown, fallback = 'N/A'): string {
  const timestamp = toTimestamp(value);
  return timestamp === null ? fallback : new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
