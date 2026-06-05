import type { IPlayerPlugin } from '../../../core/interfaces.js';
import type { IdType, MediaInfo, PlayerMedia, StreamLink } from '../../../types/index.js';
import { KodikPlayer } from './kodik-player.js';
import { resolveToken } from './token-resolver.js';
import { NoResults } from '../../../errors/index.js';

export class KodikPlugin implements IPlayerPlugin {
  readonly name = 'kodik';
  readonly version = '1.0.0';

  private player: KodikPlayer | null = null;
  private readonly manualToken?: string;

  constructor(token?: string) {
    this.manualToken = token;
  }

  private async ensurePlayer(): Promise<KodikPlayer> {
    if (!this.player) {
      const token = await resolveToken(this.manualToken);
      this.player = new KodikPlayer(token);
    }
    return this.player;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.ensurePlayer();
      return true;
    } catch {
      return false;
    }
  }

  async resolve(animeId: string, idType: IdType): Promise<PlayerMedia | null> {
    try {
      const player = await this.ensurePlayer();
      const mediaId = await player.getPlayerLink(animeId, idType);
      return { mediaId, player: this.name };
    } catch (e) {
      if (e instanceof NoResults) return null;
      throw e;
    }
  }

  async getInfo(mediaId: string): Promise<MediaInfo> {
    const player = await this.ensurePlayer();
    return player.getInfo(mediaId);
  }

  async getStream(
    mediaId: string,
    episode: number,
    translationId?: string,
  ): Promise<StreamLink> {
    const player = await this.ensurePlayer();
    return player.getLink(mediaId, episode, translationId);
  }
}
