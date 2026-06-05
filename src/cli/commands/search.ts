import { Command } from 'commander';
import ora from 'ora';
import chalk from 'chalk';
import { createDefaultRegistry } from '../../index.js';
import type { AnimeResult } from '../../types/index.js';

function renderResults(results: AnimeResult[], json: boolean): void {
  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  results.forEach((r, i) => {
    const idx = chalk.cyan(`${i + 1}.`);
    const title = r.title !== r.title_orig ? `${r.title} / ${r.title_orig}` : r.title;
    console.log(`${idx} ${title} (${r.year}) [${r.type}]`);
    if (r.shikimori_id) console.log(`   Shikimori ID: ${r.shikimori_id}`);
  });
}

export const searchCommand = new Command('search')
  .description('Поиск аниме через провайдер метаданных')
  .argument('<query>', 'Название аниме')
  .option('-p, --provider <name>', 'Провайдер метаданных', 'shikimori')
  .option('-l, --limit <n>', 'Лимит результатов', '10')
  .option('--json', 'Вывод в JSON')
  .action(async (query: string, opts: { provider: string; limit: string; json: boolean }) => {
    const spinner = opts.json ? null : ora(`Поиск "${query}"...`).start();
    try {
      const registry = await createDefaultRegistry();
      const provider = registry.getProvider(opts.provider);
      if (!provider) {
        spinner?.fail(`Провайдер "${opts.provider}" не найден`);
        process.exit(1);
      }
      const results = await provider.search(query, parseInt(opts.limit));
      spinner?.succeed(`Найдено: ${results.length}`);
      renderResults(results, opts.json);
    } catch (e) {
      spinner?.fail(String(e));
      if (process.env['DEBUG'] === '1') console.error(e);
      process.exit(1);
    }
  });
