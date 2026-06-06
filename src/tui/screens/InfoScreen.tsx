import React, { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { EpisodeGrid } from '../components/EpisodeGrid.js';
import { StatusBar } from '../components/StatusBar.js';
import type { AnimeResult, MediaInfo, PlayerMedia, Translation } from '../../types/index.js';

interface InfoScreenProps {
  anime: AnimeResult;
  media: PlayerMedia;
  mediaInfo: MediaInfo;
  onSelect: (episode: number, translation: Translation) => void;
  onBack: () => void;
}

export function InfoScreen({ anime, mediaInfo, onSelect, onBack }: InfoScreenProps) {
  const [activePanel, setActivePanel] = useState<'translations' | 'episodes'>('translations');
  const [translationIndex, setTranslationIndex] = useState(0);
  const [selectedEpisode, setSelectedEpisode] = useState(1);

  const { stdin, setRawMode } = useStdin();

  // useLayoutEffect ensures listener is registered synchronously (before any stdin.write in tests)
  useLayoutEffect(() => {
    setRawMode(true);

    const handleData = (data: Buffer | string) => {
      const s = Buffer.isBuffer(data) ? data.toString() : data;

      // ESC key
      if (s === '\x1B' || s === '\x1B\x1B') { onBack(); return; }

      // Tab — switch panels
      if (s === '\t') {
        setActivePanel(p => p === 'translations' ? 'episodes' : 'translations');
        return;
      }

      // Arrow keys and Enter
      if (activePanel === 'translations') {
        if (s === '\x1B[A') setTranslationIndex(i => Math.max(0, i - 1)); // up
        if (s === '\x1B[B') setTranslationIndex(i => Math.min(mediaInfo.translations.length - 1, i + 1)); // down
        if (s === '\r') {
          const tr = mediaInfo.translations[translationIndex];
          if (tr) onSelect(selectedEpisode, tr);
        }
      } else {
        if (s === '\x1B[D') setSelectedEpisode(ep => Math.max(1, ep - 1)); // left
        if (s === '\x1B[C') setSelectedEpisode(ep => Math.min(mediaInfo.series_count, ep + 1)); // right
        if (s === '\x1B[A') setSelectedEpisode(ep => Math.max(1, ep - 8)); // up
        if (s === '\x1B[B') setSelectedEpisode(ep => Math.min(mediaInfo.series_count, ep + 8)); // down
        if (s === '\r') {
          const tr = mediaInfo.translations[translationIndex];
          if (tr) onSelect(selectedEpisode, tr);
        }
      }
    };

    stdin.on('data', handleData);
    return () => {
      stdin.off('data', handleData);
      setRawMode(false);
    };
  }, [activePanel, translationIndex, selectedEpisode, mediaInfo, onSelect, onBack, stdin, setRawMode]);

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="round" paddingX={1}>
        <Text bold color="cyan">{anime.title}</Text>
        <Text> ({anime.year})</Text>
      </Box>
      <Box paddingX={1}>
        <Text dimColor>Серий: {mediaInfo.series_count}  |  Тип: {anime.type}  |  Shikimori: {anime.shikimori_id}</Text>
      </Box>
      <Box flexGrow={1} flexDirection="row">
        <Box flexDirection="column" width="40%" borderStyle="single" paddingX={1}>
          <Text bold color={activePanel === 'translations' ? 'cyan' : undefined}>Переводы</Text>
          {mediaInfo.translations.map((t, i) => (
            <Text
              key={t.id}
              color={i === translationIndex ? 'cyan' : undefined}
              bold={i === translationIndex}
            >
              {i === translationIndex ? '> ' : '  '}{t.title}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" flexGrow={1} borderStyle="single" paddingX={1}>
          <Text bold color={activePanel === 'episodes' ? 'cyan' : undefined}>Серии</Text>
          <EpisodeGrid count={mediaInfo.series_count} selectedEpisode={selectedEpisode} />
        </Box>
      </Box>
      <StatusBar hints="[Tab] панель  [↑↓←→] навигация  [Enter] смотреть  [Esc] назад" />
    </Box>
  );
}
