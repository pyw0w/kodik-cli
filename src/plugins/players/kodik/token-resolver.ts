import { TokenError } from '../../../errors/index.js';

// URL скрипта Kodik, содержащего токен.
// ⚠️ Этот URL может меняться. Проверяйте в актуальной версии kodik.info.
const TOKEN_SCRIPT_URL = 'https://kodik.info/js/app.js';

let _cachedToken: string | null = null;

export async function resolveToken(manualToken?: string): Promise<string> {
  if (manualToken) return manualToken;
  if (_cachedToken) return _cachedToken;

  let scriptContent: string;
  try {
    const resp = await fetch(TOKEN_SCRIPT_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    scriptContent = await resp.text();
  } catch (e) {
    throw new TokenError('Failed to fetch Kodik token script', { cause: e });
  }

  const match = scriptContent.match(/token[=:]["']([a-zA-Z0-9]+)["']/);
  if (!match?.[1]) {
    throw new TokenError('Could not extract token from Kodik script');
  }

  _cachedToken = match[1];
  return _cachedToken;
}

export function clearTokenCache(): void {
  _cachedToken = null;
}
