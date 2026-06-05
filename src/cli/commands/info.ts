import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { createDefaultRegistry } from '../../index.js';

export const infoCommand = new Command('info')
  .description('Детали аниме + доступные переводы через плеер')
  .argument('<shikimori_id>', 'Shikimori ID аниме')
  .option('--player <name>', 'Плеер', 'kodik')
  .option('--json', 'Вывод в JSON')
  .action(async (shikimoriId: string, opts: { player: string; json: boolean }) => {
    const spinner = opts.json ? null : ora(`Получение инфо для ID ${shikimoriId}...`).start();
    try {
      const registry = await createDefaultRegistry();
      const provider = registry.getProvider('shikimori');
      const player = registry.getPlayer(opts.player);

      if (!player) {
        spinner?.fail(`Плеер "${opts.player}" не найден`);
        process.exit(1);
      }

      const [animeResult, playerMedia] = await Promise.all([
        provider?.getById(shikimoriId),
        player.resolve(shikimoriId, 'shikimori'),
      ]);

      if (!playerMedia) {
        spinner?.fail('Аниме не найдено в плеере');
        process.exit(1);
      }

      const mediaInfo = await player.getInfo(playerMedia.mediaId);
      spinner?.stop();

      if (opts.json) {
        console.log(JSON.stringify({ anime: animeResult, mediaInfo }, null, 2));
        return;
      }

      if (animeResult) {
        console.log(chalk.bold(`\n${animeResult.title}`));
        console.log(`Оригинал: ${animeResult.title_orig}`);
        console.log(`Тип: ${animeResult.type} | Год: ${animeResult.year}`);
        console.log(`Shikimori: ${animeResult.link}`);
      }

      console.log(chalk.bold(`\nСерий: ${mediaInfo.series_count}`));
      console.log(chalk.bold('Переводы:'));
      mediaInfo.translations.forEach(t => {
        const kind = t.is_voice ? 'озвучка' : 'субтитры';
        console.log(`  [${t.id}] ${t.title} (${kind})`);
      });
    } catch (e) {
      spinner?.fail(String(e));
      if (process.env['DEBUG'] === '1') console.error(e);
      process.exit(1);
    }
  });
