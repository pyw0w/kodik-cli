import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchBuilder, ListBuilder } from '../../src/plugins/players/kodik/query-builder.js';

const MOCK_RESPONSE = { total: 1, time: '1ms', results: [] };

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(MOCK_RESPONSE),
  }));
});

describe('SearchBuilder', () => {
  it('sends POST to /search with token', async () => {
    await new SearchBuilder('my-token').execute();
    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://kodik-api.com/search');
    expect(init.method).toBe('POST');
    const body = new URLSearchParams(init.body as string);
    expect(body.get('token')).toBe('my-token');
  });

  it('adds title param when .title() is called', async () => {
    await new SearchBuilder('tok').title('Наруто').execute();
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get('title')).toBe('Наруто');
  });

  it('adds shikimori_id param', async () => {
    await new SearchBuilder('tok').shikimori_id('20').execute();
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get('shikimori_id')).toBe('20');
  });

  it('returns SearchResponse', async () => {
    const result = await new SearchBuilder('tok').title('test').execute();
    expect(result.total).toBe(1);
    expect(result.results).toEqual([]);
  });
});

describe('ListBuilder', () => {
  it('sends POST to /list', async () => {
    await new ListBuilder('tok').execute();
    const [url] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string];
    expect(url).toBe('https://kodik-api.com/list');
  });

  it('adds sort and order params', async () => {
    await new ListBuilder('tok').sort('year').order('desc').execute();
    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = new URLSearchParams(init.body as string);
    expect(body.get('sort')).toBe('year');
    expect(body.get('order')).toBe('desc');
  });
});
