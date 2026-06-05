import { ServiceError } from '../../../errors/index.js';
import type { SearchResponse } from '../../../types/index.js';

const KODIK_API_BASE = 'https://kodik-api.com';

type Endpoint = 'search' | 'list' | 'translations';

export abstract class ApiBuilder {
  protected args: Record<string, string> = {};

  constructor(
    protected readonly token: string,
    protected readonly endpoint: Endpoint,
  ) {}

  title(value: string): this { this.args['title'] = value; return this; }
  limit(value: number): this { this.args['limit'] = String(value); return this; }
  year(value: number): this { this.args['year'] = String(value); return this; }
  anime_kind(kind: string): this { this.args['anime_kind'] = kind; return this; }
  anime_genres(genres: string[]): this { this.args['anime_genres'] = genres.join(', '); return this; }
  shikimori_id(id: string): this { this.args['shikimori_id'] = id; return this; }
  kinopoisk_id(id: string): this { this.args['kinopoisk_id'] = id; return this; }
  imdb_id(id: string): this { this.args['imdb_id'] = id; return this; }
  with_material_data(val = true): this { this.args['with_material_data'] = String(val); return this; }

  async execute(): Promise<SearchResponse> {
    const params = new URLSearchParams({ token: this.token, ...this.args });
    let resp: Response;
    try {
      resp = await fetch(`${KODIK_API_BASE}/${this.endpoint}`, {
        method: 'POST',
        body: params,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      });
    } catch (e) {
      throw new ServiceError(`Kodik API POST /${this.endpoint} failed`, { cause: e });
    }
    if (!resp.ok) {
      throw new ServiceError(`Kodik API returned ${resp.status}`);
    }
    return resp.json() as Promise<SearchResponse>;
  }
}

export class SearchBuilder extends ApiBuilder {
  constructor(token: string) { super(token, 'search'); }
}

export class ListBuilder extends ApiBuilder {
  constructor(token: string) { super(token, 'list'); }
  sort(field: string): this { this.args['sort'] = field; return this; }
  order(dir: 'asc' | 'desc'): this { this.args['order'] = dir; return this; }
  page(n: number): this { this.args['page'] = String(n); return this; }
}
