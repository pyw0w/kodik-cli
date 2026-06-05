export type IdType = 'shikimori' | 'kinopoisk' | 'imdb';

export interface AnimeResult {
  title: string;
  title_orig: string;
  other_title: string | null;
  type: string;
  year: number;
  screenshots: string[];
  shikimori_id: string | null;
  kinopoisk_id: string | null;
  imdb_id: string | null;
  worldart_link: string | null;
  additional_data: Record<string, unknown>;
  material_data: Record<string, unknown> | null;
  link: string;
}

export interface Translation {
  id: string;
  title: string;
  type: string;
  is_voice: boolean;
}

export interface EpisodeInfo {
  number: number;
  aired: boolean;
}

export interface MediaInfo {
  translations: Translation[];
  series_count: number;
  type: 'serial' | 'movie';
}

export interface PlayerMedia {
  mediaId: string;
  player: string;
}

export interface StreamLink {
  url: string;
  quality: string;
  format: 'hls';
}

export interface SearchResponse {
  total: number;
  time: string;
  results: AnimeResult[];
}

export interface Config {
  kodik?: {
    token?: string;
  };
}
