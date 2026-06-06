import React from 'react';
import { Box, Text } from 'ink';

interface EpisodeGridProps {
  count: number;
  selectedEpisode: number;
}

export function EpisodeGrid({ count, selectedEpisode }: EpisodeGridProps) {
  const episodes = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <Box flexDirection="column">
      {chunk(episodes, 8).map((row, ri) => (
        <Box key={ri} flexDirection="row" gap={1}>
          {row.map(ep => (
            <Text
              key={ep}
              color={ep === selectedEpisode ? 'cyan' : undefined}
              bold={ep === selectedEpisode}
            >
              {ep === selectedEpisode ? `>` : ' '}{String(ep).padStart(2)}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
