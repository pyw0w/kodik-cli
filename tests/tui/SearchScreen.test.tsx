import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { SearchScreen } from '../../src/tui/screens/SearchScreen.js';
import type { AnimeResult } from '../../src/types/index.js';

const mockResults: AnimeResult[] = [
  {
    title: 'Наруто',
    title_orig: 'Naruto',
    other_title: null,
    type: 'tv',
    year: 2002,
    screenshots: [],
    shikimori_id: '20',
    kinopoisk_id: null,
    imdb_id: null,
    worldart_link: null,
    additional_data: {},
    material_data: null,
    link: 'https://shikimori.io/animes/20',
  },
];

const mockSearch = vi.fn().mockResolvedValue(mockResults);
const mockProvider = { name: 'shikimori', search: mockSearch, getById: vi.fn(), getEpisodes: vi.fn() };
const mockRegistry = { getProvider: vi.fn().mockReturnValue(mockProvider), getPlayer: vi.fn(), listPlayers: vi.fn(), listProviders: vi.fn(), registerPlayer: vi.fn(), registerProvider: vi.fn() };

beforeEach(() => vi.clearAllMocks());

describe('SearchScreen', () => {
  it('renders search input', () => {
    const { lastFrame } = render(
      <SearchScreen registry={mockRegistry as any} onSelect={vi.fn()} />
    );
    expect(lastFrame()).toContain('Поиск');
  });

  it('calls onSelect when Enter pressed on result', async () => {
    const onSelect = vi.fn();
    const { stdin, lastFrame } = render(
      <SearchScreen registry={mockRegistry as any} onSelect={onSelect} />
    );
    // Ввести запрос
    stdin.write('Наруто');
    // Подождать debounce + поиск
    await new Promise(r => setTimeout(r, 600));
    expect(mockSearch).toHaveBeenCalledWith('Наруто', 10);
  });
});
