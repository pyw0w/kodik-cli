import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { InfoScreen } from '../../src/tui/screens/InfoScreen.js';
import type { AnimeResult, MediaInfo, PlayerMedia } from '../../src/types/index.js';

const mockAnime: AnimeResult = {
  title: 'Наруто', title_orig: 'Naruto', other_title: null,
  type: 'tv', year: 2002, screenshots: [],
  shikimori_id: '20', kinopoisk_id: null, imdb_id: null,
  worldart_link: null, additional_data: {}, material_data: null,
  link: 'https://shikimori.io/animes/20',
};

const mockMedia: PlayerMedia = { mediaId: 'https://kodikplayer.com/serial/1/abc/720p', player: 'kodik' };

const mockMediaInfo: MediaInfo = {
  translations: [
    { id: '610', title: 'AniDUB', type: 'voice', is_voice: true },
    { id: '735', title: 'AniLibria', type: 'voice', is_voice: true },
  ],
  series_count: 12,
  type: 'serial',
};

describe('InfoScreen', () => {
  it('renders anime title and series count', () => {
    const { lastFrame } = render(
      <InfoScreen
        anime={mockAnime}
        media={mockMedia}
        mediaInfo={mockMediaInfo}
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(lastFrame()).toContain('Наруто');
    expect(lastFrame()).toContain('12');
  });

  it('renders translations list', () => {
    const { lastFrame } = render(
      <InfoScreen
        anime={mockAnime}
        media={mockMedia}
        mediaInfo={mockMediaInfo}
        onSelect={vi.fn()}
        onBack={vi.fn()}
      />
    );
    expect(lastFrame()).toContain('AniDUB');
    expect(lastFrame()).toContain('AniLibria');
  });

  it('calls onBack when Escape pressed', () => {
    const onBack = vi.fn();
    const { stdin } = render(
      <InfoScreen
        anime={mockAnime}
        media={mockMedia}
        mediaInfo={mockMediaInfo}
        onSelect={vi.fn()}
        onBack={onBack}
      />
    );
    stdin.write('\x1B'); // ESC
    expect(onBack).toHaveBeenCalled();
  });
});
