import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  hints: string;
  message?: string;
}

export function StatusBar({ hints, message }: StatusBarProps) {
  return (
    <Box borderStyle="single" borderTop borderBottom={false} borderLeft={false} borderRight={false}>
      {message ? (
        <Text color="green">{message}</Text>
      ) : (
        <Text dimColor>{hints}</Text>
      )}
    </Box>
  );
}
