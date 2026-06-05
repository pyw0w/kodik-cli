import * as cheerio from 'cheerio';
import { UnexpectedBehavior } from '../../../errors/index.js';
import type { Translation } from '../../../types/index.js';

interface ParsedPlayer {
  seriesCount: number;
  translations: Translation[];
  urlParams: Record<string, unknown>;
  videoParams: { type: string; hash: string; id: string };
  playerJsSrc: string;
  mediaType: 'serial' | 'movie';
}

export class Extractor {
  parseHtml(html: string): ParsedPlayer {
    const $ = cheerio.load(html);

    const hasSeriesBox = $('.serial-series-box').length > 0;
    const mediaType: 'serial' | 'movie' = hasSeriesBox ? 'serial' : 'movie';

    const seriesCount = $('.serial-series-box select option').length || 1;

    const translationSelector = hasSeriesBox
      ? '.serial-translations-box select option'
      : '.movie-translations-box select option';

    const translations: Translation[] = [];
    $(translationSelector).each((_, el) => {
      const $el = $(el);
      const type = $el.attr('data-translation-type') ?? 'voice';
      translations.push({
        id: $el.attr('value') ?? '',
        title: $el.text().trim(),
        type,
        is_voice: type === 'voice',
      });
    });

    const urlParamsMatch = html.match(/var urlParams = ({.+?});/s);
    if (!urlParamsMatch?.[1]) {
      throw new UnexpectedBehavior('Could not find urlParams in player HTML');
    }
    const urlParams = JSON.parse(urlParamsMatch[1]) as Record<string, unknown>;

    const paramsMatch = html.match(/var params={type:"([^"]+)",hash:"([^"]+)",id:"([^"]+)"}/);
    if (!paramsMatch) {
      throw new UnexpectedBehavior('Could not find video params in player HTML');
    }
    const videoParams = { type: paramsMatch[1], hash: paramsMatch[2], id: paramsMatch[3] };

    const jsSrcMatch = html.match(/src="(\/\/kodikplayer\.com[^"]+)"/);
    if (!jsSrcMatch?.[1]) {
      throw new UnexpectedBehavior('Could not find player JS src in HTML');
    }
    const playerJsSrc = jsSrcMatch[1];

    return { seriesCount, translations, urlParams, videoParams, playerJsSrc, mediaType };
  }

  extractPostUrl(jsContent: string): string {
    const match = jsContent.match(/url:"([A-Za-z0-9+/=]+)",.*?cache:!1/s);
    if (!match?.[1]) {
      throw new UnexpectedBehavior('Could not find POST URL in player JS');
    }
    return Buffer.from(match[1], 'base64').toString('utf-8');
  }
}
