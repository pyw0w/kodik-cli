import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { createDefaultRegistry } from '../../index.js';

export const linkCommand = new Command('link')
  .description('Получить прямую HLS-ссылку на серию')
  .argument('<shikimori_id>', 'Shikimori ID аниме')
  .option('--player <name>', 'Плеер', 'kodik')
  .option('-e, --episode <n>', 'Номер серии')
  .option('-t, --translation <id>', 'ID перевода')
  .option('-q, --quality <q>', 'Качество: 360, 480, 720, 1080')
  .option('--json', 'Вывод в JSON')
  .action(async (
    shikimoriId: string,
    opts: { player: string; episode?: string; translation?: string; quality?: string; json: boolean },
  ) => {
    const spinner = opts.json ? null : ora('Получение ссылки...').start();
    try {
      const registry = await createDefaultRegistry();
      const player = registry.getPlayer(opts.player);

      if (!player) {
        spinner?.fail(`Плеер "${opts.player}" не найден`);
        process.exit(1);
      }

      const media = await player.resolve(shikimoriId, 'shikimori');
      if (!media) {
        spinner?.fail('Аниме не найдено');
        process.exit(1);
      }

      let episode = opts.episode ? parseInt(opts.episode) : null;
      let translationId = opts.translation;

      if (!episode) {
        const info = await player.getInfo(media.mediaId);

        if (info.series_count > 1) {
          spinner?.stop();
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'episode',
              message: 'Выберите серию:',
              choices: Array.from({ length: info.series_count }, (_, i) => ({
                name: String(i + 1),
                value: i + 1,
              })),
            },
            {
              type: 'list',
              name: 'translationId',
              message: 'Выберите перевод:',
              choices: info.translations.map(t => ({
                name: `${t.title} (${t.is_voice ? 'озвучка' : 'субтитры'})`,
                value: t.id,
              })),
              when: !translationId && info.translations.length > 1,
            },
          ]);
          episode = answers.episode as number;
          if (!translationId && answers.translationId) {
            translationId = answers.translationId as string;
          }
        } else {
          episode = 1;
        }
      }

      spinner?.start('Получение потока...');
      const stream = await player.getStream(media.mediaId, episode, translationId);
      spinner?.stop();

      if (opts.json) {
        console.log(JSON.stringify(stream, null, 2));
        return;
      }

      console.log(chalk.green(stream.url));
      console.log(`Качество: ${stream.quality} | Формат: ${stream.format}`);
    } catch (e) {
      spinner?.fail(String(e));
      if (process.env['DEBUG'] === '1') console.error(e);
      process.exit(1);
    }
  });
