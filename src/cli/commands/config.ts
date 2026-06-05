import { Command } from 'commander';
import { loadConfig, saveConfig } from '../../core/config.js';

export const configCommand = new Command('config')
  .description('Управление конфигурацией kodik-cli');

configCommand
  .command('set <key> <value>')
  .description('Установить значение (например: kodik.token MY_TOKEN)')
  .action(async (key: string, value: string) => {
    const config = await loadConfig();
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let obj: any = config;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = {};
      obj = obj[parts[i]];
    }
    obj[parts[parts.length - 1]] = value;
    await saveConfig(config);
    console.log(`✓ ${key} = ${value}`);
  });

configCommand
  .command('get <key>')
  .description('Получить значение')
  .action(async (key: string) => {
    const config = await loadConfig();
    const parts = key.split('.');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let val: any = config;
    for (const part of parts) {
      val = val?.[part];
    }
    if (val === undefined) {
      console.error(`Key "${key}" not found`);
      process.exit(1);
    }
    console.log(val);
  });
