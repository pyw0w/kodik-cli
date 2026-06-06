import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { ActionScreen } from '../../src/tui/screens/ActionScreen.js';

const mockAvailability = { mpv: true, vlc: false };

beforeEach(() => vi.clearAllMocks());

describe('ActionScreen', () => {
  it('renders all four action options', () => {
    const { lastFrame } = render(
      <ActionScreen
        title="Наруто"
        episode={1}
        translationTitle="AniDUB"
        hlsUrl="https://cdn.kodik.info/seria/1/mp4:hls:manifest.m3u8"
        playerAvailability={mockAvailability}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />
    );
    expect(lastFrame()).toContain('mpv');
    expect(lastFrame()).toContain('vlc');
    expect(lastFrame()).toContain('Браузер');
    expect(lastFrame()).toContain('Ссылка');
  });

  it('shows vlc as unavailable when not installed', () => {
    const { lastFrame } = render(
      <ActionScreen
        title="Наруто"
        episode={1}
        translationTitle="AniDUB"
        hlsUrl="https://cdn.kodik.info/seria/1/mp4:hls:manifest.m3u8"
        playerAvailability={mockAvailability}
        onBack={vi.fn()}
        onDone={vi.fn()}
      />
    );
    expect(lastFrame()).toContain('не найден');
  });

  it('calls onBack when Escape pressed', () => {
    const onBack = vi.fn();
    const { stdin } = render(
      <ActionScreen
        title="Наруто"
        episode={1}
        translationTitle="AniDUB"
        hlsUrl="https://cdn.kodik.info/seria/1/mp4:hls:manifest.m3u8"
        playerAvailability={mockAvailability}
        onBack={onBack}
        onDone={vi.fn()}
      />
    );
    stdin.write('\x1B');
    expect(onBack).toHaveBeenCalled();
  });
});
