import React, { useState, useLayoutEffect, useRef } from 'react';
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

  // Use refs so the single stable listener always sees current state without re-registration
  const activePanelRef = useRef(activePanel);
  const translationIndexRef = useRef(translationIndex);
  const selectedEpisodeRef = useRef(selectedEpisode);
  const onSelectRef = useRef(onSelect);
  const onBackRef = useRef(onBack);
  const mediaInfoRef = useRef(mediaInfo);

  activePanelRef.current = activePanel;
  translationIndexRef.current = translationIndex;
  selectedEpisodeRef.current = selectedEpisode;
  onSelectRef.current = onSelect;
  onBackRef.current = onBack;
  mediaInfoRef.current = mediaInfo;

  useLayoutEffect(() => {
    setRawMode(true);

    const handleData = (data: Buffer | string) => {
      const s = Buffer.isBuffer(data) ? data.toString() : data;
      const panel = activePanelRef.current;
      const tIdx = translationIndexRef.current;
      const ep = selectedEpisodeRef.current;
      const info = mediaInfoRef.current;

      if (s === '\x1B' || s === '\x1B\x1B') { onBackRef.current(); return; }
      if (s === '\t') { setActivePanel(p => p === 'translations' ? 'episodes' : 'translations'); return; }

      if (panel === 'translations') {
        if (s === '\x1B[A') setTranslationIndex(i => Math.max(0, i - 1));
        if (s === '\x1B[B') setTranslationIndex(i => Math.min(info.translations.length - 1, i + 1));
        if (s === '\r') { const tr = info.translations[tIdx]; if (tr) onSelectRef.current(ep, tr); }
      } else {
        if (s === '\x1B[D') setSelectedEpisode(e => Math.max(1, e - 1));
        if (s === '\x1B[C') setSelectedEpisode(e => Math.min(info.series_count, e + 1));
        if (s === '\x1B[A') setSelectedEpisode(e => Math.max(1, e - 8));
        if (s === '\x1B[B') setSelectedEpisode(e => Math.min(info.series_count, e + 8));
        if (s === '\r') { const tr = info.translations[tIdx]; if (tr) onSelectRef.current(ep, tr); }
      }
    };

    stdin.on('data', handleData);
    return () => {
      stdin.off('data', handleData);
      setRawMode(false);
    };
  }, [stdin, setRawMode]);

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
