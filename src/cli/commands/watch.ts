import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { App } from '../../tui/App.js';
import { createDefaultRegistry } from '../../index.js';

export const watchCommand = new Command('watch')
  .description('Интерактивный TUI для поиска и просмотра аниме')
  .action(async () => {
    const registry = await createDefaultRegistry();
    render(React.createElement(App, { registry }));
  });
