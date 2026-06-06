import { safeGet, safeGetJson, safePost } from '../../../http/client.js';
import { NoResults, ServiceError, UnexpectedBehavior } from '../../../errors/index.js';
import type { IdType, MediaInfo, SearchResponse, StreamLink } from '../../../types/index.js';
import { Extractor } from './extractor.js';
import { Decryptor } from './decryptor.js';

const KODIK_API_BASE = 'https://kodik-api.com';

const ID_TYPE_PARAM: Record<IdType, string> = {
  shikimori: 'shikimori_id',
  kinopoisk: 'kinopoisk_id',
  imdb: 'imdb_id',
};

interface GetPlayerResponse {
  found: boolean;
  link?: string;
  error?: string;
}

interface VideoLink {
  src: string;
  type: string;
}

interface VideoLinksResponse {
  links: Record<string, VideoLink[]>;
  domain: string;
}

export class KodikPlayer {
  private extractor = new Extractor();
  private decryptor = new Decryptor();

  constructor(private readonly token: string) {}

  async search(title: string, limit = 20): Promise<SearchResponse> {
    const data = await safePost<SearchResponse>(`${KODIK_API_BASE}/search`, {
      token: this.token,
      title,
      limit: String(limit),
      with_material_data: 'true',
    });
    if (!data.results?.length) throw new NoResults(`No results for title "${title}"`);
    return data;
  }

  async searchById(id: string, idType: IdType): Promise<SearchResponse> {
    const paramKey = ID_TYPE_PARAM[idType];
    const data = await safePost<SearchResponse>(`${KODIK_API_BASE}/search`, {
      token: this.token,
      [paramKey]: id,
      with_material_data: 'true',
    });
    if (!data.results?.length) throw new NoResults(`No results for ${idType} id "${id}"`);
    return data;
  }

  async getPlayerLink(id: string, idType: IdType): Promise<string> {
    const paramKey = ID_TYPE_PARAM[idType];
    const findUrl = encodeURIComponent(`https://kodikdb.com/find-player?${paramKey}=${id}`);
    const url = `${KODIK_API_BASE}/get-player?title=Player&hasPlayer=false&url=${findUrl}&token=${this.token}&${paramKey}=${id}`;

    const data = await safeGetJson<GetPlayerResponse>(url);
    if (data.error) throw new ServiceError(data.error);
    if (!data.found || !data.link) throw new NoResults(`No player found for ${idType} id "${id}"`);

    return 'https:' + data.link;
  }

  async getInfo(playerUrl: string): Promise<MediaInfo> {
    const html = await safeGet(playerUrl, { 'User-Agent': 'Mozilla/5.0' });
    const parsed = this.extractor.parseHtml(html);
    return {
      translations: parsed.translations,
      series_count: parsed.seriesCount,
      type: parsed.mediaType,
    };
  }

  async getLink(
    playerUrl: string,
    episode: number,
    translationId?: string,
  ): Promise<StreamLink> {
    const html = await safeGet(playerUrl, { 'User-Agent': 'Mozilla/5.0' });
    const parsed = this.extractor.parseHtml(html);

    // playerJsSrc может быть абсолютным (//kodikplayer.com/...) или относительным (/assets/...)
    const playerOrigin = new URL(playerUrl).origin;
    const jsUrl = parsed.playerJsSrc.startsWith('//')
      ? 'https:' + parsed.playerJsSrc
      : playerOrigin + parsed.playerJsSrc;
    const jsContent = await safeGet(jsUrl);

    // postUrl может быть относительным (/ftor) или абсолютным
    const rawPostUrl = this.extractor.extractPostUrl(jsContent);
    const postUrl = rawPostUrl.startsWith('/')
      ? playerOrigin + rawPostUrl
      : rawPostUrl;

    const body: Record<string, string> = {
      ...Object.fromEntries(
        Object.entries(parsed.urlParams).map(([k, v]) => [k, String(v)]),
      ),
      type: parsed.videoParams.type,
      hash: parsed.videoParams.hash,
      id: parsed.videoParams.id,
      episode: String(episode),
    };
    if (translationId) body['translation_id'] = translationId;

    const resp = await safePost<VideoLinksResponse>(postUrl, body);
    if (!resp.links || Object.keys(resp.links).length === 0) {
      throw new UnexpectedBehavior('Empty video links response');
    }

    const quality = Object.keys(resp.links)
      .sort((a, b) => parseInt(b) - parseInt(a))[0];
    const linkEntry = resp.links[quality]?.[0];
    if (!linkEntry) throw new UnexpectedBehavior(`No link for quality ${quality}`);

    let src = linkEntry.src;

    if (!src.startsWith('//') && !src.startsWith('http')) {
      src = this.decryptor.decrypt(src);
    }

    if (src.startsWith('//')) src = 'https:' + src;

    return { url: src, quality: `${quality}p`, format: 'hls' };
  }
}
