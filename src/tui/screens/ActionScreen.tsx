import React, { useState, useLayoutEffect, useRef } from 'react';
import { Box, Text, useStdin } from 'ink';
import open from 'open';
import { StatusBar } from '../components/StatusBar.js';
import { launchMpv, launchVlc } from '../../utils/player-launcher.js';
import type { ExternalPlayer } from '../../utils/player-launcher.js';

interface ActionScreenProps {
  title: string;
  episode: number;
  translationTitle: string;
  hlsUrl: string;
  playerAvailability: Record<ExternalPlayer, boolean>;
  webPlayerUrl?: string | null;
  onBack: () => void;
  onDone: () => void;
}

type Action = 'mpv' | 'vlc' | 'browser' | 'link';

const ACTIONS: { id: Action; label: string; description: string }[] = [
  { id: 'mpv', label: 'mpv', description: 'открыть в mpv' },
  { id: 'vlc', label: 'vlc', description: 'открыть в VLC' },
  { id: 'browser', label: 'Браузер', description: 'локальный веб-плеер' },
  { id: 'link', label: 'Ссылка', description: 'скопировать HLS URL' },
];

export function ActionScreen({
  title, episode, translationTitle, hlsUrl,
  playerAvailability, webPlayerUrl, onBack, onDone,
}: ActionScreenProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const { stdin, setRawMode } = useStdin();

  const selectedIndexRef = useRef(selectedIndex);
  const hlsUrlRef = useRef(hlsUrl);
  const playerAvailabilityRef = useRef(playerAvailability);
  const onBackRef = useRef(onBack);
  const onDoneRef = useRef(onDone);
  const webPlayerUrlRef = useRef(webPlayerUrl);
  const browserOpenedRef = useRef(false);

  selectedIndexRef.current = selectedIndex;
  hlsUrlRef.current = hlsUrl;
  playerAvailabilityRef.current = playerAvailability;
  onBackRef.current = onBack;
  onDoneRef.current = onDone;
  webPlayerUrlRef.current = webPlayerUrl;

  useLayoutEffect(() => {
    setRawMode(true);

    const handleData = (data: Buffer | string) => {
      const s = Buffer.isBuffer(data) ? data.toString() : data;
      const idx = selectedIndexRef.current;
      const url = hlsUrlRef.current;
      const avail = playerAvailabilityRef.current;

      if (s === '\x1B' || s === '\x1B\x1B') { onBackRef.current(); return; }
      if (s === '\x1B[A') { setSelectedIndex(i => Math.max(0, i - 1)); return; }
      if (s === '\x1B[B') { setSelectedIndex(i => Math.min(ACTIONS.length - 1, i + 1)); return; }

      if (s === '\r') {
        const action = ACTIONS[idx];
        if (!action) return;

        if (action.id === 'mpv') {
          if (avail.mpv) { launchMpv(url); onDoneRef.current(); }
          return;
        }
        if (action.id === 'vlc') {
          if (avail.vlc) { launchVlc(url); onDoneRef.current(); }
          return;
        }
        if (action.id === 'browser') {
          if (hlsUrlRef.current && webPlayerUrlRef.current) {
            if (!browserOpenedRef.current) {
              open(webPlayerUrlRef.current).catch(() => {});
              browserOpenedRef.current = true;
              setStatusMsg('Открыто в браузере: ' + webPlayerUrlRef.current);
            } else {
              setStatusMsg('Поток обновлен в браузере');
            }
          } else {
            setStatusMsg('Веб-плеер недоступен');
          }
          return;
        }
        if (action.id === 'link') {
          import('clipboardy').then(({ default: clipboard }) => {
            clipboard.write(url).then(() => {
              setStatusMsg(`✓ Ссылка скопирована: ${url}`);
            }).catch(() => {
              setStatusMsg(`URL: ${url}`);
            });
          }).catch(() => {
            setStatusMsg(`URL: ${url}`);
          });
        }
      }
    };

    stdin.on('data', handleData);
    return () => {
      stdin.off('data', handleData);
      setRawMode(false);
    };
  }, [stdin, setRawMode]);

  const isAvailable = (id: Action): boolean => {
    if (id === 'mpv') return playerAvailability.mpv;
    if (id === 'vlc') return playerAvailability.vlc;
    if (id === 'browser') return !!webPlayerUrl;
    return true;
  };

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="round" paddingX={1}>
        <Text bold color="cyan">{title}</Text>
        <Text> — Серия {episode} — {translationTitle}</Text>
      </Box>
      <Box flexDirection="column" flexGrow={1} paddingX={2} paddingY={1}>
        <Text bold>Как смотреть?</Text>
        <Box flexDirection="column" marginTop={1}>
          {ACTIONS.map((action, i) => {
            const available = isAvailable(action.id);
            const isSelected = i === selectedIndex;
            return (
              <Box key={action.id}>
                <Text
                  color={isSelected ? 'cyan' : available ? undefined : 'gray'}
                  bold={isSelected}
                  dimColor={!available}
                >
                  {isSelected ? '> ' : '  '}
                  {action.label.padEnd(12)}
                  ({action.description}){!available ? ' (не найден)' : ''}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
      <StatusBar
        hints="[↑↓] выбрать  [Enter] запустить  [Esc] назад"
        message={statusMsg ?? undefined}
      />
    </Box>
  );
}
