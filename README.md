# kodik-cli

CLI и Node.js-библиотека для поиска аниме и получения HLS-потоков через [Kodik](https://kodik.info) и [Shikimori](https://shikimori.one).

[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## Возможности

- **Поиск** аниме по названию через Shikimori
- **Прямые HLS-ссылки** на серии с выбором перевода и качества
- **Интерактивный TUI** — полноэкранный режим просмотра с запуском через mpv / vlc / веб-плеер / буфер обмена
- **Библиотека** — подключается как npm-пакет в свои скрипты
- Токен Kodik получается автоматически (можно задать вручную)

---

## Требования

- **Node.js** ≥ 20
- **mpv** или **vlc** — опционально, для команды `watch`

---

## Установка

```bash
npm install -g kodik-cli
```

Или без установки:

```bash
npx kodik-cli <command>
```

---

## Быстрый старт

Токен Kodik подхватывается автоматически. Если хотите зафиксировать свой:

```bash
kodik-cli config set kodik.token YOUR_TOKEN
```

---

## Команды

### `search` — поиск аниме

```bash
kodik-cli search "Наруто"
kodik-cli search "атака титанов" --limit 5
kodik-cli search "one piece" --json
```

| Флаг | По умолчанию | Описание |
|------|-------------|----------|
| `-l, --limit <n>` | `10` | Количество результатов |
| `-p, --provider <name>` | `shikimori` | Провайдер метаданных |
| `--json` | — | Вывод в JSON |

---

### `info` — детали и переводы

```bash
kodik-cli info 20          # Наруто (Shikimori ID)
kodik-cli info 20 --json
```

Показывает название, тип, количество серий и список доступных переводов с их ID.

---

### `link` — прямая HLS-ссылка

```bash
kodik-cli link 20 --episode 1
kodik-cli link 20 --episode 1 --translation 610
kodik-cli link 20 --episode 1 --quality 720
```

| Флаг | Описание |
|------|----------|
| `-e, --episode <n>` | Номер серии |
| `-t, --translation <id>` | ID перевода (из `info`) |
| `-q, --quality <q>` | Качество: `360`, `480`, `720`, `1080` |
| `--json` | Вывод в JSON |

Пример вывода:
```
https://cdn.kodik.info/seria/.../master.m3u8
```

---

### `watch` — интерактивный TUI

```bash
kodik-cli watch
```

Полноэкранный режим: поиск → выбор серии и перевода → запуск.

```
┌─ kodik-cli watch ───────────────────────────────────┐
│ Поиск: Наруто                                        │
├──────────────────────────────────────────────────────┤
│ > Наруто / Naruto (2002) [tv]  ID: 20               │
│   Наруто: Ураганные хроники / Naruto: Shippuden ...  │
└──────────────────────────────────────────────────────┘
[↑↓] навигация  [Enter] выбрать  [Esc] очистить
```

**Управление:**

| Экран | Клавиши |
|-------|---------|
| Поиск | `↑↓` навигация, `Enter` выбрать, `Esc` очистить |
| Серии/переводы | `Tab` переключить панель, `↑↓←→` навигация, `Enter` смотреть, `Esc` назад |
| Действие | `↑↓` выбрать способ, `Enter` запустить, `Esc` назад |

**Способы воспроизведения:** mpv · vlc · веб-плеер (браузер) · скопировать ссылку в буфер обмена

Веб-плеер запускает локальный HTTP-сервер с hls.js — поток автоматически обновляется при смене серии.

---

### `config` — конфигурация

```bash
kodik-cli config set kodik.token YOUR_TOKEN
kodik-cli config get kodik.token
```

Конфиг хранится в `~/.kodik/config.json`.

---

## Использование как библиотека

```bash
npm install kodik-cli
```

```typescript
import { createDefaultRegistry } from 'kodik-cli';

const registry = await createDefaultRegistry();

// Поиск
const provider = registry.getProvider('shikimori')!;
const results = await provider.search('Наруто', 5);

// Получить HLS-ссылку
const player = registry.getPlayer('kodik')!;
const media = await player.resolve('20', 'shikimori');
const stream = await player.getStream(media!.mediaId, 1);
console.log(stream.url); // https://cdn.kodik.info/.../master.m3u8
```

Доступные экспорты: `PluginRegistry`, `KodikPlugin`, `ShikimoriProvider`, `createDefaultRegistry`, типы (`AnimeResult`, `MediaInfo`, `Translation`, `StreamLink`, ...), классы ошибок (`KodikError`, `NoResults`, ...).

---

## Разработка

```bash
git clone https://github.com/pyw0w/kodik-cli
cd kodik-cli
npm install

npm test          # тесты
npm run build     # сборка
npm run dev -- search "Наруто"  # запуск без сборки
```

---

## License

MIT
