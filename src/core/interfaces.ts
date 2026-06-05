import type {
  AnimeResult,
  EpisodeInfo,
  IdType,
  MediaInfo,
  PlayerMedia,
  StreamLink,
} from '../types/index.js';

export interface IPlayerPlugin {
  readonly name: string;
  readonly version: string;
  isAvailable(): Promise<boolean>;
  resolve(animeId: string, idType: IdType): Promise<PlayerMedia | null>;
  getInfo(mediaId: string): Promise<MediaInfo>;
  getStream(
    mediaId: string,
    episode: number,
    translationId?: string,
  ): Promise<StreamLink>;
}

export interface IMetadataProvider {
  readonly name: string;
  search(query: string, limit?: number): Promise<AnimeResult[]>;
  getById(id: string): Promise<AnimeResult | null>;
  getEpisodes(id: string): Promise<EpisodeInfo[]>;
}
