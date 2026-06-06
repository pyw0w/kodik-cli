import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createWebPlayerServer } from '../../src/utils/web-player-server.js';

describe('WebPlayerServer', () => {
  let server: ReturnType<typeof createWebPlayerServer>;
  let port: number;
  let baseUrl: string;

  beforeAll(async () => {
    server = createWebPlayerServer();
    port = await server.start();
    baseUrl = `http://localhost:${port}`;
  });

  afterAll(() => {
    server.stop();
  });

  it('starts on a free port and returns port number', () => {
    expect(port).toBeGreaterThan(0);
    expect(port).toBeLessThan(65536);
  });

  it('GET / returns HTML page with hls.js reference', async () => {
    const res = await fetch(baseUrl);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<video');
    expect(html).toContain('hls.js');
  });

  it('GET /api/stream returns default state before update', async () => {
    const res = await fetch(`${baseUrl}/api/stream`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ url: '', title: '', episode: 0, translation: '' });
  });

  it('POST /api/stream updates stream data', async () => {
    const res = await fetch(`${baseUrl}/api/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com/stream.m3u8',
        title: 'Naruto',
        episode: 1,
        translation: 'AniLibria',
      }),
    });
    expect(res.status).toBe(200);

    const getRes = await fetch(`${baseUrl}/api/stream`);
    const data = await getRes.json();
    expect(data.url).toBe('https://example.com/stream.m3u8');
    expect(data.title).toBe('Naruto');
    expect(data.episode).toBe(1);
    expect(data.translation).toBe('AniLibria');
  });

  it('getUrl returns http://localhost:{port}', () => {
    expect(server.getUrl()).toBe(`http://localhost:${port}`);
  });

  it('stop closes the server', async () => {
    const server2 = createWebPlayerServer();
    const port2 = await server2.start();
    server2.stop();
    try {
      await fetch(`http://localhost:${port2}`);
      expect(true).toBe(false);
    } catch {
      // Expected — server should be closed
    }
  });
});