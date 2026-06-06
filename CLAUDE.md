# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build          # Compile TypeScript → dist/ via tsup (ESM + CJS + TUI)
npm test               # Run all tests once (vitest run)
npm run test:watch     # Run tests in watch mode
npm run dev            # Run CLI without building (via tsx)

# Run a single test file
npx vitest run tests/unit/decryptor.test.ts

# Type-check without building
npx tsc --noEmit

# Type-check TUI code (JSX, separate tsconfig)
npx tsc --noEmit -p tsconfig.tui.json

# Run the built CLI
node bin/kodik-cli.js --help
node bin/kodik-cli.js search "Наруто"
node bin/kodik-cli.js info <shikimori_id>
node bin/kodik-cli.js link <shikimori_id> --episode 1
node bin/kodik-cli.js watch          # interactive TUI

# Set Kodik API token
node bin/kodik-cli.js config set kodik.token YOUR_TOKEN

# Enable debug logging
DEBUG=1 node bin/kodik-cli.js <command>
```

After changing source files, always rebuild before running via `bin/kodik-cli.js`:
```bash
npm run build && node bin/kodik-cli.js <command>
```

## Architecture

### Plugin Registry Pattern

The core abstraction is `PluginRegistry` (`src/core/registry.ts`). Two plugin types:
- **`IPlayerPlugin`** — video players (Kodik). Methods: `resolve(animeId, idType)` → `PlayerMedia | null`, `getInfo(mediaId)` → `MediaInfo` (translations + episode count), `getStream(mediaId, episode, translationId?)` → `StreamLink` (HLS URL).
- **`IMetadataProvider`** — anime databases (Shikimori). Methods: `search(query, limit?)`, `getById(id)`, `getEpisodes(id)`.

`createDefaultRegistry()` in `src/index.ts` is the single entry point for all consumers (CLI and TUI). It reads config from `~/.kodik/config.json` (override via `KODIK_CONFIG_DIR` env var in tests).

### Kodik Plugin internals

`KodikPlugin` (`src/plugins/players/kodik/index.ts`) wraps `KodikPlayer`. The pipeline for getting a stream:
1. `token-resolver.ts` — manual token → in-memory cache → auto-scrape from `kodik.info/js/app.js`
2. `kodik-player.ts` → `getPlayerLink()` — POST to `kodik-api.com/get-player`, returns iframe URL on `kodikplayer.com`
3. `extractor.ts` — parses iframe HTML with cheerio. Handles two formats: old (`var params={type,hash,id}`) and new (`vInfo.type/hash/id`). `urlParams` is either a JSON object or a JSON string in single quotes.
4. `extractor.ts` → `extractPostUrl()` — finds the POST endpoint in player JS. Old format: `url:"BASE64"` with standard base64. New format: `url:atob("BASE64")` decoded with `base64url`.
5. `decryptor.ts` — ROT-N brute-force (0–25 shifts) + `Buffer.from(str, 'base64')`. Caches the successful shift in `_shift` for subsequent calls.

### HTTP

No axios — all HTTP uses native `fetch` (Node 20+). `src/http/client.ts` exports `safeGet`, `safeGetJson`, `safePost`. All throw `ServiceError` on failure.

### Error hierarchy

`src/errors/index.ts`: `KodikError` → `TokenError`, `ServiceError`, `NoResults`, `DecryptionFailure`, `UnexpectedBehavior`, `PostArgumentsError`. CLI catches all `KodikError` subclasses and exits with code 1.

### CLI

`src/cli/index.ts` registers commands: `search`, `info`, `link`, `config`, `plugin`, `watch`. Each command in `src/cli/commands/` is a thin orchestration layer — no business logic. `--json` flag disables spinners/chalk and outputs clean JSON.

### TUI (watch command)

`kodik-cli watch` launches a fullscreen ink@4 + React 18 TUI. The screen flow:

```
SearchScreen → InfoScreen → ActionScreen
     ↑               ↑
  (Esc)          (Esc/Done)
```

- **`src/tui/App.tsx`** — root state machine holding screen, selected anime/media/episode/translation, HLS URL, and player availability. Calls `registry.getPlayer('kodik')` for all async operations; passes results down as props.
- **`src/tui/screens/SearchScreen.tsx`** — text input with 500ms debounced search via `registry.getProvider('shikimori')`.
- **`src/tui/screens/InfoScreen.tsx`** — two-panel layout: translations (left) and episode grid (right), Tab to switch panels.
- **`src/tui/screens/ActionScreen.tsx`** — four launch options: mpv, vlc, browser (stub), clipboard copy.
- **`src/utils/player-launcher.ts`** — `checkPlayers()` uses `where`/`which` to detect installed players; `launchMpv`/`launchVlc` spawn detached processes.

**Keyboard input pattern:** `SearchScreen` uses ink's `useInput` hook. `InfoScreen` and `ActionScreen` use `useLayoutEffect` + `useStdin()` + direct `stdin.on('data')` with `useRef` for state access — this is required because `ink-testing-library` needs synchronous listener registration that `useInput`'s internal `useEffect` doesn't provide.

**Build:** `tsup.config.ts` produces three bundles: `dist/index.{js,cjs}` (library), `dist/cli/index.js` (CLI), `dist/tui/App.js` (TUI). TUI uses `tsconfig.tui.json` (adds `jsx: react-jsx`); the main `tsconfig.json` also sets `jsx: react-jsx` so type-checking works across both.

### Testing conventions

Tests mock `fetch` via `vi.stubGlobal('fetch', vi.fn(...))`. Fixture files in `tests/fixtures/` are representative HTML/JS/JSON samples of real Kodik/Shikimori responses. Config tests use `KODIK_CONFIG_DIR` env var to point at a temp directory. TUI tests use `ink-testing-library` (not `@inkjs/testing`, which doesn't exist).

### Adding a new player

1. Create `src/plugins/players/<name>/` with an `index.ts` exporting a class implementing `IPlayerPlugin`
2. Export from `src/index.ts`
3. Register in `createDefaultRegistry()`
4. Add tests in `tests/plugins/<name>/`
5. Do not touch `src/core/` or `src/cli/`

### Adding a new metadata provider

Same pattern as above but implement `IMetadataProvider`.
