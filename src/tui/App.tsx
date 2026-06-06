import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { SearchScreen } from './screens/SearchScreen.js';
import { InfoScreen } from './screens/InfoScreen.js';
import { ActionScreen } from './screens/ActionScreen.js';
import { checkPlayers } from '../utils/player-launcher.js';
import type { PluginRegistry } from '../core/registry.js';
import type {
  AnimeResult,
  MediaInfo,
  PlayerMedia,
  Translation,
} from '../types/index.js';
import type { ExternalPlayer } from '../utils/player-launcher.js';

type Screen = 'search' | 'info' | 'action';

interface AppState {
  screen: Screen;
  selectedAnime: AnimeResult | null;
  selectedMedia: PlayerMedia | null;
  mediaInfo: MediaInfo | null;
  selectedEpisode: number;
  selectedTranslation: Translation | null;
  hlsUrl: string | null;
}

interface AppProps {
  registry: PluginRegistry;
}

export function App({ registry }: AppProps) {
  const [state, setState] = useState<AppState>({
    screen: 'search',
    selectedAnime: null,
    selectedMedia: null,
    mediaInfo: null,
    selectedEpisode: 1,
    selectedTranslation: null,
    hlsUrl: null,
  });

  const [playerAvailability, setPlayerAvailability] = useState<Record<ExternalPlayer, boolean>>({
    mpv: false,
    vlc: false,
  });

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [loadingStream, setLoadingStream] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPlayerAvailability(checkPlayers());
  }, []);

  async function handleAnimeSelect(anime: AnimeResult) {
    if (!anime.shikimori_id) return;
    setLoadingInfo(true);
    setError(null);
    try {
      const player = registry.getPlayer('kodik');
      if (!player) throw new Error('Kodik плеер не найден');
      const media = await player.resolve(anime.shikimori_id, 'shikimori');
      if (!media) throw new Error('Аниме не найдено в Kodik');
      const info = await player.getInfo(media.mediaId);
      setState(s => ({
        ...s,
        screen: 'info',
        selectedAnime: anime,
        selectedMedia: media,
        mediaInfo: info,
      }));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingInfo(false);
    }
  }

  async function handleEpisodeSelect(episode: number, translation: Translation) {
    const { selectedMedia } = state;
    if (!selectedMedia) return;
    setLoadingStream(true);
    setError(null);
    try {
      const player = registry.getPlayer('kodik');
      if (!player) throw new Error('Kodik плеер не найден');
      const stream = await player.getStream(selectedMedia.mediaId, episode, translation.id);
      setState(s => ({
        ...s,
        screen: 'action',
        selectedEpisode: episode,
        selectedTranslation: translation,
        hlsUrl: stream.url,
      }));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoadingStream(false);
    }
  }

  if (loadingInfo) return <Box><Text color="yellow">Загрузка информации...</Text></Box>;
  if (loadingStream) return <Box><Text color="yellow">Получение потока...</Text></Box>;
  if (error) return <Box><Text color="red">Ошибка: {error}</Text></Box>;

  if (state.screen === 'search') {
    return <SearchScreen registry={registry} onSelect={handleAnimeSelect} />;
  }

  if (state.screen === 'info' && state.selectedAnime && state.selectedMedia && state.mediaInfo) {
    return (
      <InfoScreen
        anime={state.selectedAnime}
        media={state.selectedMedia}
        mediaInfo={state.mediaInfo}
        onSelect={handleEpisodeSelect}
        onBack={() => setState(s => ({ ...s, screen: 'search' }))}
      />
    );
  }

  if (
    state.screen === 'action' &&
    state.selectedAnime &&
    state.selectedTranslation &&
    state.hlsUrl
  ) {
    return (
      <ActionScreen
        title={state.selectedAnime.title}
        episode={state.selectedEpisode}
        translationTitle={state.selectedTranslation.title}
        hlsUrl={state.hlsUrl}
        playerAvailability={playerAvailability}
        onBack={() => setState(s => ({ ...s, screen: 'info' }))}
        onDone={() => setState(s => ({ ...s, screen: 'info' }))}
      />
    );
  }

  return <Box><Text>Загрузка...</Text></Box>;
}
