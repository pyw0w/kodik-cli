import React from 'react';
import { Box, Text } from 'ink';
import type { AnimeResult } from '../../types/index.js';

interface AnimeListProps {
  items: AnimeResult[];
  selectedIndex: number;
}

export function AnimeList({ items, selectedIndex }: AnimeListProps) {
  if (items.length === 0) {
    return <Text dimColor>Нет результатов</Text>;
  }
  return (
    <Box flexDirection="column">
      {items.map((item, i) => {
        const isSelected = i === selectedIndex;
        const title = item.title !== item.title_orig
          ? `${item.title} / ${item.title_orig}`
          : item.title;
        return (
          <Box key={item.shikimori_id ?? i}>
            <Text color={isSelected ? 'cyan' : undefined} bold={isSelected}>
              {isSelected ? '> ' : '  '}
              {title} ({item.year}) [{item.type}]
              {item.shikimori_id ? `  ID: ${item.shikimori_id}` : ''}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
