import type { IMetadataProvider } from '../../../core/interfaces.js';
import { ServiceError } from '../../../errors/index.js';
import type { AnimeResult, EpisodeInfo } from '../../../types/index.js';

const BASE_URL = 'https://shikimori.one/api';
const USER_AGENT = 'kodik-cli/1.0.0';

interface ShikimoriAnime {
  id: number;
  name: string;
  russian: string;
  english: string[];
  kind: string;
  aired_on: string | null;
  episodes: number;
  episodes_aired: number;
}

interface ShikimoriScreenshot {
  original: string;
}

async function shikiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }

  let resp: Response;
  try {
    resp = await fetch(url.toString(), {
      headers: { 'User-Agent': USER_AGENT },
    });
  } catch (e) {
    throw new ServiceError(`Shikimori GET ${path} failed`, { cause: e });
  }

  if (resp.status === 429) {
    await new Promise(r => setTimeout(r, 1200));
    return shikiGet<T>(path, params);
  }

  if (!resp.ok) {
    throw new ServiceError(`Shikimori GET ${path} returned ${resp.status}`);
  }

  return resp.json() as Promise<T>;
}

function mapAnime(a: ShikimoriAnime): AnimeResult {
  const year = a.aired_on ? parseInt(a.aired_on.slice(0, 4)) : 0;
  return {
    title: a.russian || a.name,
    title_orig: a.name,
    other_title: a.english?.[0] ?? null,
    type: a.kind,
    year,
    screenshots: [],
    shikimori_id: String(a.id),
    kinopoisk_id: null,
    imdb_id: null,
    worldart_link: null,
    additional_data: {},
    material_data: null,
    link: `https://shikimori.one/animes/${a.id}`,
  };
}

export class ShikimoriProvider implements IMetadataProvider {
  readonly name = 'shikimori';

  async search(query: string, limit = 10): Promise<AnimeResult[]> {
    const results = await shikiGet<ShikimoriAnime[]>('/animes', {
      search: query,
      limit: String(limit),
    });
    return results.map(mapAnime);
  }

  async getById(id: string): Promise<AnimeResult | null> {
    let anime: ShikimoriAnime;
    try {
      anime = await shikiGet<ShikimoriAnime>(`/animes/${id}`);
    } catch (e) {
      if (e instanceof ServiceError && e.message.includes('404')) return null;
      throw e;
    }

    const result = mapAnime(anime);

    try {
      const screenshots = await shikiGet<ShikimoriScreenshot[]>(`/animes/${id}/screenshots`);
      result.screenshots = screenshots.map(s => s.original);
    } catch {
      // screenshots are optional
    }

    return result;
  }

  async getEpisodes(id: string): Promise<EpisodeInfo[]> {
    const anime = await shikiGet<ShikimoriAnime>(`/animes/${id}`);
    const count = anime.episodes_aired || anime.episodes || 0;
    return Array.from({ length: count }, (_, i) => ({ number: i + 1, aired: true }));
  }
}
