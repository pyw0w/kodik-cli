export function extractBetween(
  str: string,
  start: string,
  end: string,
): string | null {
  const si = str.indexOf(start);
  if (si === -1) return null;
  const ei = str.indexOf(end, si + start.length);
  if (ei === -1) return null;
  return str.slice(si + start.length, ei);
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number,
): Promise<T> {
  for (let i = 0; i < attempts - 1; i++) {
    try {
      return await fn();
    } catch {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return fn();
}
