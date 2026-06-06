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

    // urlParams может быть JSON-объектом ({...}) или JSON-строкой ('...')
    const urlParamsMatch =
      html.match(/var urlParams = '({.+?})';/s) ??
      html.match(/var urlParams = ({.+?});/s);
    if (!urlParamsMatch?.[1]) {
      throw new UnexpectedBehavior('Could not find urlParams in player HTML');
    }
    const urlParams = JSON.parse(urlParamsMatch[1]) as Record<string, unknown>;

    // Поддержка двух форматов:
    // Старый: var params={type:"seria",hash:"...",id:"..."}
    // Новый:  vInfo.type = 'seria'; vInfo.hash = '...'; vInfo.id = '...';
    let videoParams: { type: string; hash: string; id: string } | undefined;

    const oldParamsMatch = html.match(/var params={type:"([^"]+)",hash:"([^"]+)",id:"([^"]+)"}/);
    if (oldParamsMatch) {
      videoParams = { type: oldParamsMatch[1], hash: oldParamsMatch[2], id: oldParamsMatch[3] };
    } else {
      const typeM = html.match(/vInfo\.type\s*=\s*['"]([^'"]+)['"]/);
      const hashM = html.match(/vInfo\.hash\s*=\s*['"]([^'"]+)['"]/);
      const idM = html.match(/vInfo\.id\s*=\s*['"]([^'"]+)['"]/);
      if (typeM && hashM && idM) {
        videoParams = { type: typeM[1], hash: hashM[1], id: idM[1] };
      }
    }

    if (!videoParams) {
      throw new UnexpectedBehavior('Could not find video params in player HTML');
    }

    // Поддержка двух форматов src:
    // Старый: src="//kodikplayer.com/assets/..."
    // Новый:  src="/assets/js/app.serial.*.js" (на том же домене)
    const jsSrcMatch =
      html.match(/src="(\/\/kodikplayer\.com\/assets\/[^"]+\.js)"/) ??
      html.match(/src="(\/assets\/js\/app\.[^"]+\.js)"/);
    if (!jsSrcMatch?.[1]) {
      throw new UnexpectedBehavior('Could not find player JS src in HTML');
    }
    const playerJsSrc = jsSrcMatch[1];

    return { seriesCount, translations, urlParams, videoParams, playerJsSrc, mediaType };
  }

  extractPostUrl(jsContent: string): string {
    // Новый формат: url:atob("BASE64") — браузерный atob использует стандартный base64
    const atobMatch = jsContent.match(/url:atob\("([A-Za-z0-9+/=]+)"\)/);
    if (atobMatch?.[1]) {
      return Buffer.from(atobMatch[1], 'base64url').toString('utf-8');
    }
    // Старый формат: url:"BASE64",.*?cache:!1
    const legacyMatch = jsContent.match(/url:"([A-Za-z0-9+/=]+)",.*?cache:!1/s);
    if (legacyMatch?.[1]) {
      return Buffer.from(legacyMatch[1], 'base64').toString('utf-8');
    }
    throw new UnexpectedBehavior('Could not find POST URL in player JS');
  }
}
