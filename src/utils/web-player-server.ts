import { createServer, type IncomingMessage, type ServerResponse, type Server } from 'node:http';

interface StreamState {
  url: string;
  title: string;
  episode: number;
  translation: string;
}

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>kodik-cli player</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #0a0a0a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; }
.player-container { width: 100%; max-width: 960px; position: relative; }
.info-bar { display: flex; justify-content: space-between; align-items: center; padding: 12px 16px; background: #141414; border-radius: 8px 8px 0 0; }
.info-bar .title { font-size: 16px; font-weight: 600; color: #00d4ff; }
.info-bar .meta { font-size: 13px; color: #888; }
.video-wrapper { position: relative; background: #000; }
video { width: 100%; display: block; }
.controls { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.7); padding: 8px 12px; display: flex; align-items: center; gap: 8px; transition: opacity 0.3s; }
.video-wrapper:not(:hover) .controls { opacity: 0; }
.controls button { background: none; border: none; color: #e0e0e0; font-size: 18px; cursor: pointer; padding: 4px 8px; }
.controls button:hover { color: #00d4ff; }
.progress-bar { flex: 1; height: 4px; background: #333; border-radius: 2px; cursor: pointer; position: relative; }
.progress-fill { height: 100%; background: #00d4ff; border-radius: 2px; width: 0%; }
.time-display { font-size: 12px; color: #888; min-width: 80px; text-align: center; }
.volume-slider { width: 60px; height: 4px; background: #333; border-radius: 2px; cursor: pointer; appearance: none; -webkit-appearance: none; }
.volume-slider::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; background: #00d4ff; border-radius: 50%; }
.error-msg { color: #ff4444; text-align: center; padding: 40px; font-size: 18px; }
.loading { color: #00d4ff; text-align: center; padding: 40px; font-size: 16px; }
</style>
</head>
<body>
<div class="player-container">
  <div class="info-bar">
    <span class="title" id="anime-title">Загрузка...</span>
    <span class="meta" id="anime-meta"></span>
  </div>
  <div class="video-wrapper" id="video-wrapper">
    <div class="loading" id="loading-msg">Подключение к потоку...</div>
    <video id="video" controlsList="nodownload"></video>
    <div class="controls" id="controls">
      <button id="btn-play" title="Play/Pause">&#9654;</button>
      <div class="progress-bar" id="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
      <span class="time-display" id="time-display">0:00 / 0:00</span>
      <input type="range" class="volume-slider" id="volume-slider" min="0" max="1" step="0.05" value="1">
      <button id="btn-fullscreen" title="Fullscreen">&#x26F6;</button>
    </div>
  </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/hls.js@latest"></script>
<script>
(function() {
  const video = document.getElementById('video');
  const titleEl = document.getElementById('anime-title');
  const metaEl = document.getElementById('anime-meta');
  const loadingMsg = document.getElementById('loading-msg');
  const btnPlay = document.getElementById('btn-play');
  const progressBar = document.getElementById('progress-bar');
  const progressFill = document.getElementById('progress-fill');
  const timeDisplay = document.getElementById('time-display');
  const volumeSlider = document.getElementById('volume-slider');
  const btnFullscreen = document.getElementById('btn-fullscreen');
  const wrapper = document.getElementById('video-wrapper');

  let hls = null;
  let currentUrl = '';

  function formatTime(s) {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ':' + (sec < 10 ? '0' : '') + sec;
  }

  function loadStream(data) {
    if (!data.url) { loadingMsg.textContent = 'Нет потока'; return; }
    if (data.url === currentUrl) return;
    currentUrl = data.url;
    titleEl.textContent = data.title || 'kodik-cli';
    metaEl.textContent = data.episode ? 'Серия ' + data.episode + ' — ' + (data.translation || '') : '';

    if (hls) { hls.destroy(); hls = null; }
    loadingMsg.style.display = 'block';
    video.style.display = 'none';

    if (Hls.isSupported()) {
      hls = new Hls({ maxBufferLength: 30, maxMaxBufferLength: 60 });
      hls.loadSource(data.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        loadingMsg.style.display = 'none';
        video.style.display = 'block';
        video.play();
      });
      hls.on(Hls.Events.ERROR, function(event, err) {
        if (err.fatal) {
          loadingMsg.textContent = 'Ошибка потока: ' + err.type;
          loadingMsg.style.display = 'block';
          video.style.display = 'none';
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = data.url;
      video.addEventListener('loadedmetadata', function() {
        loadingMsg.style.display = 'none';
        video.style.display = 'block';
        video.play();
      });
    } else {
      loadingMsg.textContent = 'HLS не поддерживается в этом браузере';
    }
  }

  btnPlay.addEventListener('click', function() {
    if (video.paused) video.play(); else video.pause();
  });
  video.addEventListener('play', function() { btnPlay.innerHTML = '&#9646;&#9646;'; });
  video.addEventListener('pause', function() { btnPlay.innerHTML = '&#9654;'; });

  video.addEventListener('timeupdate', function() {
    if (video.duration) {
      progressFill.style.width = (video.currentTime / video.duration * 100) + '%';
      timeDisplay.textContent = formatTime(video.currentTime) + ' / ' + formatTime(video.duration);
    }
  });

  progressBar.addEventListener('click', function(e) {
    if (video.duration) {
      const rect = progressBar.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      video.currentTime = pos * video.duration;
    }
  });

  volumeSlider.addEventListener('input', function() {
    video.volume = parseFloat(volumeSlider.value);
  });

  btnFullscreen.addEventListener('click', function() {
    if (wrapper.requestFullscreen) wrapper.requestFullscreen();
    else if (wrapper.webkitRequestFullscreen) wrapper.webkitRequestFullscreen();
  });

  async function pollStream() {
    try {
      const res = await fetch('/api/stream');
      if (res.ok) { const data = await res.json(); loadStream(data); }
    } catch(e) {}
  }

  pollStream();
  setInterval(pollStream, 5000);
})();
</script>
</body>
</html>`;

export function createWebPlayerServer() {
  let server: Server | null = null;
  let port: number = 0;
  const streamState: StreamState = { url: '', title: '', episode: 0, translation: '' };

  function handleRequest(req: IncomingMessage, res: ServerResponse) {
    if (req.method === 'GET' && req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(HTML_TEMPLATE);
      return;
    }

    if (req.method === 'GET' && req.url === '/api/stream') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(streamState));
      return;
    }

    if (req.method === 'POST' && req.url === '/api/stream') {
      let body = '';
      req.on('data', (chunk: Buffer | string) => { body += chunk.toString(); });
      req.on('end', () => {
        try {
          const data = JSON.parse(body) as StreamState;
          if (data.url !== undefined) streamState.url = data.url;
          if (data.title !== undefined) streamState.title = data.title;
          if (data.episode !== undefined) streamState.episode = data.episode;
          if (data.translation !== undefined) streamState.translation = data.translation;
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(streamState));
        } catch {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid JSON' }));
        }
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }

  async function start(): Promise<number> {
    server = createServer(handleRequest);
    return new Promise((resolve, reject) => {
      server!.listen(0, () => {
        const addr = server!.address();
        if (typeof addr === 'object' && addr !== null) {
          port = addr.port;
          resolve(port);
        } else {
          reject(new Error('Failed to get server port'));
        }
      });
      server!.on('error', reject);
    });
  }

  function stop(): void {
    if (server) {
      server.close();
      server = null;
    }
  }

  function updateStream(url: string, title: string, episode: number, translation: string): void {
    streamState.url = url;
    streamState.title = title;
    streamState.episode = episode;
    streamState.translation = translation;
  }

  function getUrl(): string {
    return `http://localhost:${port}`;
  }

  return { start, stop, updateStream, getUrl };
}