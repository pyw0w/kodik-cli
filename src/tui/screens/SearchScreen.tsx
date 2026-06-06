import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { AnimeList } from '../components/AnimeList.js';
import { StatusBar } from '../components/StatusBar.js';
import type { PluginRegistry } from '../../core/registry.js';
import type { AnimeResult } from '../../types/index.js';

interface SearchScreenProps {
  registry: PluginRegistry;
  onSelect: (anime: AnimeResult) => void;
}

export function SearchScreen({ registry, onSelect }: SearchScreenProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AnimeResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'input' | 'list'>('input');

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setMode('input');
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const provider = registry.getProvider('shikimori');
        if (!provider) throw new Error('Shikimori провайдер не найден');
        const res = await provider.search(query, 10);
        setResults(res);
        setSelectedIndex(0);
        if (res.length > 0) setMode('list');
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query, registry]);

  useInput((input, key) => {
    if (mode === 'list') {
      if (key.upArrow) setSelectedIndex(i => Math.max(0, i - 1));
      if (key.downArrow) setSelectedIndex(i => Math.min(results.length - 1, i + 1));
      if (key.return && results[selectedIndex]) onSelect(results[selectedIndex]);
      if (key.escape) { setMode('input'); setResults([]); setQuery(''); }
    }
  });

  return (
    <Box flexDirection="column" height="100%">
      <Box borderStyle="round" paddingX={1}>
        <Text bold color="cyan">kodik-cli watch</Text>
      </Box>
      <Box paddingX={1} paddingY={0}>
        <Text>Поиск: </Text>
        <TextInput
          value={query}
          onChange={setQuery}
          onSubmit={() => { if (results.length > 0) setMode('list'); }}
        />
      </Box>
      <Box flexDirection="column" flexGrow={1} paddingX={1}>
        {loading && <Text color="yellow">Загрузка...</Text>}
        {error && <Text color="red">{error}</Text>}
        {!loading && !error && <AnimeList items={results} selectedIndex={selectedIndex} />}
      </Box>
      <StatusBar hints="[↑↓] навигация  [Enter] выбрать  [Esc] очистить" />
    </Box>
  );
}
