/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserscriptConfig {
  blockPopups: boolean;
  autoOpenOnFound: boolean;
  floatingPosition: 'bottom-right' | 'bottom-left' | 'top-right';
  theme: 'dark' | 'glass';
  maxHistory: number;
}

export function generateUserscriptCode(config: UserscriptConfig): string {
  return `// ==UserScript==
// @name         Halo Universal Media Sniffer & Downloader
// @namespace    https://halo.studio/
// @version      2.1.0
// @description  Universal video sniffer (.m3u8, .mp4, HLS, DASH, Blob, YouTube, TikTok, Doodstream), ad-popup shield, real MB progress downloader, and client-side segment merger.
// @author       Halo Studio
// @match        *://*/*
// @exclude      *://*.bank*/*
// @exclude      *://*.paypal.com/*
// @run-at       document-start
// @allFrames    true
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_notification
// @connect      *
// ==/UserScript==

(function () {
  'use strict';

  // Determine window context
  const isTopWindow = window.self === window.top;
  const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;

  // --- Configuration ---
  const CONFIG = {
    blockPopups: ${config.blockPopups},
    autoOpenOnFound: ${config.autoOpenOnFound},
    position: '${config.floatingPosition}',
    theme: '${config.theme}',
    maxHistory: ${config.maxHistory}
  };

  const detectedMedia = new Map(); // key: clean URL, value: media metadata
  let uiContainer = null;
  let panelElement = null;
  let badgeButton = null;

  // --- 1. POPUP & AGGRESSIVE AD REDIRECT SHIELD ---
  if (CONFIG.blockPopups) {
    try {
      const rawOpen = targetWindow.open;
      targetWindow.open = function (url, target, features) {
        if (!url || url === 'about:blank') return null;
        const str = String(url).toLowerCase();
        const isAd = /(ad|pop|tracker|bet|casino|affiliate|banner|click|redirect|promo)/i.test(str);
        if (isAd) {
          console.warn('[Halo Sniffer] Blocked suspicious ad popup:', url);
          return null;
        }
        return rawOpen.apply(this, arguments);
      };
    } catch (e) {}
  }

  // --- 2. URL CLASSIFICATION & REGISTRATION HELPER ---
  function identifyFormat(url, typeHint = '') {
    const lowUrl = url.toLowerCase();
    const lowType = (typeHint || '').toLowerCase();

    if (lowUrl.includes('.m3u8') || lowType.includes('mpegurl') || lowType.includes('hls') || lowUrl.includes('playlist.m3u8')) {
      return 'HLS (m3u8)';
    }
    if (lowUrl.includes('.mpd') || lowType.includes('dash+xml')) {
      return 'DASH (mpd)';
    }
    if (lowUrl.includes('videoplayback') || lowUrl.includes('googlevideo.com')) {
      if (lowUrl.includes('mime=audio')) return 'YouTube Audio';
      return 'YouTube Video';
    }
    if (lowUrl.includes('tiktokcdn.com') || lowUrl.includes('mime_type=video_mp4') || lowUrl.includes('byteoversea')) {
      return 'TikTok MP4';
    }
    if (lowUrl.includes('/pass_md5/') || lowUrl.includes('dood') || lowUrl.includes('d000d')) {
      return 'Doodstream CDN';
    }
    if (lowUrl.includes('.webm') || lowType.includes('video/webm')) {
      return 'WEBM';
    }
    if (lowUrl.includes('.ts') || lowType.includes('video/mp2t')) {
      return 'TS SEGMENT';
    }
    if (lowUrl.includes('.mp4') || lowType.includes('video/mp4')) {
      return 'MP4';
    }
    if (lowType.includes('video/')) {
      return 'STREAM (' + lowType.replace('video/', '').toUpperCase() + ')';
    }
    return 'VIDEO';
  }

  function registerMedia(rawUrl, typeHint = 'stream', sourceHint = 'sniffer') {
    if (!rawUrl || typeof rawUrl !== 'string') return;
    const cleanRaw = rawUrl.trim();
    if (!cleanRaw || cleanRaw.startsWith('javascript:') || cleanRaw.startsWith('data:image')) return;

    try {
      let fullUrl = cleanRaw;
      if (!cleanRaw.startsWith('blob:') && !cleanRaw.startsWith('http')) {
        fullUrl = new URL(cleanRaw, window.location.href).href;
      }

      // Ignore common non-video assets
      if (/\\.(css|js|json|png|jpe?g|gif|svg|ico|woff2?|ttf)(\\?.*)?$/i.test(fullUrl)) {
        return;
      }

      // Filter out small audio trackers or analytics
      if (fullUrl.includes('google-analytics') || fullUrl.includes('doubleclick') || fullUrl.includes('/analytics/')) {
        return;
      }

      if (detectedMedia.has(fullUrl)) return;

      const format = identifyFormat(fullUrl, typeHint);
      const isVideoCandidate =
        format !== 'VIDEO' ||
        /\\.(m3u8|mp4|webm|mkv|mov|ts|m4s|mpd|f4v|flv)(\\?.*)?$/i.test(fullUrl) ||
        fullUrl.includes('videoplayback') ||
        fullUrl.includes('mime=video') ||
        fullUrl.includes('mime_type=video') ||
        fullUrl.includes('/pass_md5/') ||
        fullUrl.includes('tiktokcdn') ||
        typeHint.includes('video') ||
        typeHint.includes('mpegurl');

      if (!isVideoCandidate) return;

      const record = {
        url: fullUrl,
        format,
        source: sourceHint,
        pageUrl: window.location.href,
        pageTitle: (document.title || 'Video Stream').trim(),
        timestamp: new Date().toLocaleTimeString(),
        id: 'media_' + Math.random().toString(36).substring(2, 9),
        isBlob: fullUrl.startsWith('blob:')
      };

      detectedMedia.set(fullUrl, record);

      // If running inside an iframe, communicate up to the top window
      if (!isTopWindow) {
        try {
          window.top.postMessage({
            type: 'HALO_MEDIA_DISCOVERED',
            payload: record
          }, '*');
        } catch (e) {}
      }

      updateUI();

      if (CONFIG.autoOpenOnFound && panelElement && panelElement.style.display === 'none') {
        togglePanel(true);
      }
    } catch (err) {}
  }

  // --- 3. PAGE-CONTEXT INJECTION SCRIPT ---
  // Overcomes Tampermonkey sandbox isolation by executing directly in the website's context!
  const INJECTED_CODE = \`
  (function() {
    function emitMedia(url, hint, source) {
      if (!url || typeof url !== 'string') return;
      window.dispatchEvent(new CustomEvent('halo_sniffed_media', {
        detail: { url: url, hint: hint || 'stream', source: source || 'hook' }
      }));
    }

    // 1. Hook window.fetch
    const origFetch = window.fetch;
    window.fetch = async function(input, init) {
      const url = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      if (url) {
        if (/\\.(m3u8|mp4|webm|ts|m4s|mpd)/i.test(url) || url.includes('videoplayback') || url.includes('pass_md5') || url.includes('tiktokcdn') || url.includes('mime_type=video')) {
          emitMedia(url, 'stream', 'fetch');
        }
      }
      try {
        const response = await origFetch.apply(this, arguments);
        try {
          const cType = response.headers.get('content-type') || '';
          if (cType.includes('video/') || cType.includes('mpegurl') || cType.includes('dash+xml')) {
            emitMedia(url || response.url, cType, 'fetch-header');
          }
        } catch (e) {}
        return response;
      } catch (err) {
        throw err;
      }
    };

    // 2. Hook XMLHttpRequest
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(method, url) {
      this._halo_url = url;
      if (url && (/\\.(m3u8|mp4|webm|ts|m4s)/i.test(String(url)) || String(url).includes('pass_md5') || String(url).includes('videoplayback'))) {
        emitMedia(url, 'stream', 'xhr-open');
      }
      return origOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function() {
      this.addEventListener('load', () => {
        try {
          const cType = this.getResponseHeader('content-type') || '';
          if (cType.includes('video/') || cType.includes('mpegurl')) {
            emitMedia(this._halo_url || this.responseURL, cType, 'xhr-header');
          }
          // Special Doodstream / pass_md5 detection
          if (this._halo_url && String(this._halo_url).includes('/pass_md5/') && this.responseText) {
            const trimmed = this.responseText.trim();
            if (trimmed.startsWith('http')) {
              emitMedia(trimmed, 'video/mp4', 'dood-pass_md5');
            }
          }
        } catch (e) {}
      });
      return origSend.apply(this, arguments);
    };

    // 3. Hook HTMLMediaElement.src descriptor & setAttribute
    try {
      const srcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
      if (srcDesc && srcDesc.set) {
        const origSrcSet = srcDesc.set;
        Object.defineProperty(HTMLMediaElement.prototype, 'src', {
          set: function(val) {
            if (val) emitMedia(val, 'media-element', 'media-src-setter');
            return origSrcSet.call(this, val);
          },
          get: srcDesc.get,
          configurable: true,
          enumerable: true
        });
      }
    } catch (e) {}

    const origSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, val) {
      if ((name === 'src' || name === 'data-src') && (this.tagName === 'VIDEO' || this.tagName === 'SOURCE')) {
        if (val) emitMedia(val, 'media-attr', 'dom-setAttribute');
      }
      return origSetAttribute.apply(this, arguments);
    };

    // 4. Hook MediaSource addSourceBuffer
    if (window.MediaSource) {
      const origAddSourceBuffer = MediaSource.prototype.addSourceBuffer;
      MediaSource.prototype.addSourceBuffer = function(mimeType) {
        if (mimeType && mimeType.includes('video')) {
          emitMedia(window.location.href, mimeType, 'mediasource-mse');
        }
        return origAddSourceBuffer.apply(this, arguments);
      };
    }
  })();
  \`;

  // Inject into DOM
  try {
    const scriptTag = document.createElement('script');
    scriptTag.textContent = INJECTED_CODE;
    (document.head || document.documentElement).appendChild(scriptTag);
    scriptTag.remove();
  } catch (e) {}

  // Receive media from the in-page hook
  window.addEventListener('halo_sniffed_media', (evt) => {
    if (evt && evt.detail) {
      registerMedia(evt.detail.url, evt.detail.hint, evt.detail.source);
    }
  });

  // Cross-frame messaging (for top window receiving from iframes)
  window.addEventListener('message', (evt) => {
    if (evt && evt.data && evt.data.type === 'HALO_MEDIA_DISCOVERED' && evt.data.payload) {
      const p = evt.data.payload;
      registerMedia(p.url, p.format, 'iframe-child');
    }
  });

  // --- 4. PERFORMANCE OBSERVER & NETWORK SWEEPER ---
  function inspectResourceEntries() {
    if (!window.performance || !window.performance.getEntriesByType) return;
    try {
      const entries = window.performance.getEntriesByType('resource');
      entries.forEach((entry) => {
        const name = entry.name;
        if (!name) return;
        if (
          /\\.(m3u8|mp4|webm|ts|m4s)(\\?.*)?$/i.test(name) ||
          name.includes('videoplayback') ||
          name.includes('mime=video') ||
          name.includes('mime_type=video') ||
          name.includes('/pass_md5/') ||
          name.includes('tiktokcdn') ||
          entry.initiatorType === 'video'
        ) {
          registerMedia(name, 'network-resource', 'perf-observer');
        }
      });
    } catch (e) {}
  }

  try {
    const perfObserver = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        const name = entry.name;
        if (name && (
          /\\.(m3u8|mp4|webm|ts|m4s)(\\?.*)?$/i.test(name) ||
          name.includes('videoplayback') ||
          name.includes('mime=video') ||
          name.includes('mime_type=video') ||
          name.includes('/pass_md5/') ||
          name.includes('tiktokcdn') ||
          entry.initiatorType === 'video'
        )) {
          registerMedia(name, 'network-entry', 'perf-event');
        }
      });
    });
    perfObserver.observe({ entryTypes: ['resource'] });
  } catch (e) {}

  // --- 5. DOM VIDEO & IFRAME SCANNER ---
  function scanDOMVideos() {
    try {
      const mediaElements = document.querySelectorAll('video, video source, audio');
      mediaElements.forEach((el) => {
        const src = el.src || el.getAttribute('src') || el.getAttribute('data-src') || (el.currentSrc);
        if (src) {
          registerMedia(src, 'dom-element', 'dom-scan');
        }
      });

      // Special YouTube Scanner
      if (window.location.hostname.includes('youtube.com')) {
        scanYouTube();
      }

      // Check performance buffer
      inspectResourceEntries();
    } catch (e) {}
  }

  // YouTube Specialized Extractor
  function scanYouTube() {
    try {
      const playerResp = targetWindow.ytInitialPlayerResponse || (targetWindow.ytplayer && targetWindow.ytplayer.config && targetWindow.ytplayer.config.args && targetWindow.ytplayer.config.args.raw_player_response);
      if (playerResp && playerResp.streamingData) {
        const formats = [
          ...(playerResp.streamingData.formats || []),
          ...(playerResp.streamingData.adaptiveFormats || [])
        ];
        formats.forEach((fmt) => {
          if (fmt.url) {
            const quality = fmt.qualityLabel || fmt.quality || (fmt.mimeType.includes('audio') ? 'Audio' : 'Video');
            registerMedia(fmt.url, \`YouTube \${quality} (\${fmt.mimeType.split(';')[0]})\`, 'youtube-api');
          }
        });
      }
    } catch (e) {}
  }

  // MutationObserver to watch dynamic videos entering the DOM
  const domObserver = new MutationObserver(() => {
    scanDOMVideos();
  });

  if (document.documentElement) {
    domObserver.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Periodic fallback sweep (every 2.5s)
  setInterval(() => {
    scanDOMVideos();
  }, 2500);

  // --- 6. HLS SEGMENT MERGER & DOWNLOAD ENGINE ---
  async function downloadHlsStream(mediaItem, onProgress, onStatus) {
    onStatus('Mengambil master playlist m3u8...');

    const playlistText = await new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: 'GET',
        url: mediaItem.url,
        headers: {
          'Referer': window.location.href,
          'User-Agent': navigator.userAgent
        },
        onload: (res) => {
          if (res.status >= 200 && res.status < 300) resolve(res.responseText);
          else reject(new Error('Gagal mengambil playlist: HTTP ' + res.status));
        },
        onerror: () => reject(new Error('Koneksi CDN ditolak'))
      });
    });

    const lines = playlistText.split('\\n');
    let segmentUrls = [];

    // Master playlist handling
    const isMaster = lines.some((line) => line.includes('#EXT-X-STREAM-INF'));
    if (isMaster) {
      onStatus('Master playlist terdeteksi, memilih resolusi tertinggi...');
      let bestUrl = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith('#EXT-X-STREAM-INF') && i + 1 < lines.length) {
          const next = lines[i + 1].trim();
          if (next && !next.startsWith('#')) {
            bestUrl = new URL(next, mediaItem.url).href;
            break;
          }
        }
      }
      if (!bestUrl) throw new Error('Sub-stream playlist tidak ditemukan');
      mediaItem.url = bestUrl;
      return downloadHlsStream(mediaItem, onProgress, onStatus);
    }

    // Extract segment TS/M4S URLs
    for (let line of lines) {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const segUrl = new URL(line, mediaItem.url).href;
        segmentUrls.push(segUrl);
      }
    }

    if (segmentUrls.length === 0) {
      throw new Error('Tidak ada potongan segmen ditemukan di file m3u8 ini.');
    }

    onStatus(\`Mengunduh \${segmentUrls.length} segmen video...\`);
    const chunks = [];
    let completed = 0;

    for (let i = 0; i < segmentUrls.length; i++) {
      const segUrl = segmentUrls[i];
      const buffer = await new Promise((resolve, reject) => {
        GM_xmlhttpRequest({
          method: 'GET',
          url: segUrl,
          responseType: 'arraybuffer',
          headers: {
            'Referer': window.location.href,
            'User-Agent': navigator.userAgent
          },
          onload: (res) => {
            if (res.status >= 200 && res.status < 300) resolve(res.response);
            else reject(new Error(\`Segmen \${i + 1} gagal (HTTP \${res.status})\`));
          },
          onerror: () => reject(new Error(\`Koneksi terputus saat mengambil segmen \${i + 1}\`))
        });
      });

      chunks.push(buffer);
      completed++;
      onProgress(Math.round((completed / segmentUrls.length) * 100), completed, segmentUrls.length);
    }

    onStatus('Menggabungkan seluruh segmen video...');
    const combinedBlob = new Blob(chunks, { type: 'video/mp2t' });
    const downloadUrl = URL.createObjectURL(combinedBlob);

    const safeTitle = (document.title || 'video').replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = \`\${safeTitle}_\${Date.now()}.mp4\`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 60000);
    onStatus('✓ Berhasil! Cek folder Download di HP.');
  }

  // --- 6B. DIRECT MEDIA (TIKTOK, YOUTUBE, MP4, WEBM) BLOB DOWNLOAD ENGINE ---
  async function downloadDirectMedia(mediaItem, onProgress, onStatus) {
    onStatus('Menghubungi server CDN...');

    return new Promise((resolve, reject) => {
      // Clean safe title
      const cleanTitle = (document.title || 'video')
        .replace(/[^a-zA-Z0-9_\\u0600-\\u06FF\\u0400-\\u04FF\\u4e00-\\u9fa5 -]/g, '_')
        .replace(/_+/g, '_')
        .trim()
        .slice(0, 35) || 'video';

      let ext = '.mp4';
      if (mediaItem.format.includes('WEBM')) ext = '.webm';
      else if (mediaItem.format.includes('Audio')) ext = '.m4a';

      const fileName = \`\${cleanTitle}_\${Date.now()}\${ext}\`;

      // TikTok requires specific Referer header matching tiktok.com
      const customReferer = mediaItem.url.includes('tiktok') ? 'https://www.tiktok.com/' : window.location.href;

      GM_xmlhttpRequest({
        method: 'GET',
        url: mediaItem.url,
        responseType: 'blob',
        headers: {
          'Referer': customReferer,
          'User-Agent': navigator.userAgent,
          'Accept': '*/*',
          'Origin': window.location.origin
        },
        onprogress: (progress) => {
          if (progress.lengthComputable && progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            const mbLoaded = (progress.loaded / 1048576).toFixed(1);
            const mbTotal = (progress.total / 1048576).toFixed(1);
            onProgress(percent, \`Mengunduh: \${mbLoaded}MB / \${mbTotal}MB (\${percent}%)\`);
          } else if (progress.loaded > 0) {
            const mbLoaded = (progress.loaded / 1048576).toFixed(1);
            onProgress(50, \`Mengunduh: \${mbLoaded}MB...\`);
          }
        },
        onload: (res) => {
          if (res.status >= 200 && res.status < 300 && res.response) {
            onStatus('Menyimpan ke folder Download HP...');
            const blob = res.response;
            const blobUrl = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
            onStatus('✓ Berhasil! Cek folder Download di HP Anda.');
            resolve(fileName);
          } else {
            reject(new Error('Server CDN menolak akses (HTTP ' + res.status + ')'));
          }
        },
        onerror: (err) => {
          reject(new Error(err && err.error ? err.error : 'Koneksi ke CDN terputus'));
        },
        ontimeout: () => {
          reject(new Error('Waktu unduh habis (Timeout)'));
        }
      });
    });
  }

  // --- 7. FLOATING UI COMPONENT ---
  function initUI() {
    if (document.getElementById('halo-sniffer-root')) return;
    if (!document.body) return;

    uiContainer = document.createElement('div');
    uiContainer.id = 'halo-sniffer-root';
    uiContainer.style.cssText = \`
      position: fixed !important;
      \${CONFIG.position.includes('bottom') ? 'bottom: 20px !important;' : 'top: 20px !important;'}
      \${CONFIG.position.includes('right') ? 'right: 20px !important;' : 'left: 20px !important;'}
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      user-select: none !important;
    \`;

    // Floating Badge Button
    badgeButton = document.createElement('button');
    badgeButton.id = 'halo-badge-btn';
    badgeButton.type = 'button';
    badgeButton.style.cssText = \`
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      padding: 10px 14px !important;
      background: #09090b !important;
      color: #f4f4f5 !important;
      border: 1px solid rgba(255,255,255,0.2) !important;
      border-radius: 9999px !important;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7) !important;
      cursor: pointer !important;
      font-size: 12px !important;
      font-weight: 600 !important;
      transition: all 0.2s ease !important;
    \`;

    badgeButton.innerHTML = \`
      <span id="halo-indicator-dot" style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#71717a;"></span>
      <span>⚡ Halo Sniffer</span>
      <span id="halo-count-badge" style="background:#27272a; padding:2px 7px; border-radius:999px; font-size:10px; color:#a1a1aa; font-weight:700;">0</span>
    \`;

    badgeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel();
    });

    // Main Floating Panel
    panelElement = document.createElement('div');
    panelElement.id = 'halo-panel-window';
    panelElement.style.cssText = \`
      display: none;
      width: 370px;
      max-width: calc(100vw - 32px);
      max-height: 490px;
      background: #09090b;
      color: #f4f4f5;
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 14px;
      box-shadow: 0 25px 40px -10px rgba(0,0,0,0.9);
      margin-bottom: 12px;
      overflow: hidden;
      flex-direction: column;
    \`;

    panelElement.innerHTML = \`
      <div style="padding:12px 14px; border-bottom:1px solid rgba(255,255,255,0.1); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
        <div>
          <div style="font-size:13px; font-weight:700; color:#fff;">Halo Universal Sniffer</div>
          <div style="font-size:10px; color:#71717a; text-transform:uppercase; letter-spacing:0.04em;">HLS • DASH • MP4 • Embeds</div>
        </div>
        <div style="display:flex; align-items:center; gap:6px;">
          <button id="halo-rescan-btn" title="Pindai Ulang Halaman" style="background:#27272a; border:1px solid rgba(255,255,255,0.1); color:#f4f4f5; font-size:10px; padding:4px 8px; border-radius:6px; cursor:pointer; font-weight:600;">
            🔄 Pindai
          </button>
          <button id="halo-close-panel-btn" style="background:transparent; border:none; color:#a1a1aa; font-size:16px; cursor:pointer; padding:4px;">✕</button>
        </div>
      </div>
      <div id="halo-media-list" style="padding:10px; overflow-y:auto; max-height:380px; display:flex; flex-direction:column; gap:8px;">
        <div style="text-align:center; padding:28px 10px; color:#71717a; font-size:12px; line-height:1.6;">
          <strong>Menunggu pemutaran video...</strong><br/>
          Putar video di situs (YouTube, TikTok, Doodstream, dsb) atau klik tombol <strong>🔄 Pindai</strong> di atas.
        </div>
      </div>
    \`;

    uiContainer.appendChild(panelElement);
    uiContainer.appendChild(badgeButton);
    document.body.appendChild(uiContainer);

    document.getElementById('halo-close-panel-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      togglePanel(false);
    });

    document.getElementById('halo-rescan-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = document.getElementById('halo-rescan-btn');
      btn.innerText = '⏳ Memindai...';
      scanDOMVideos();
      setTimeout(() => {
        btn.innerText = '🔄 Pindai';
      }, 1000);
    });
  }

  function togglePanel(forceOpen) {
    if (!panelElement) return;
    const shouldOpen = forceOpen !== undefined ? forceOpen : panelElement.style.display === 'none';
    panelElement.style.display = shouldOpen ? 'flex' : 'none';
  }

  function updateUI() {
    initUI();
    const count = detectedMedia.size;
    const countBadge = document.getElementById('halo-count-badge');
    const dot = document.getElementById('halo-indicator-dot');

    if (countBadge && dot) {
      countBadge.innerText = count;
      if (count > 0) {
        countBadge.style.background = '#059669';
        countBadge.style.color = '#ffffff';
        dot.style.background = '#10b981';
      }
    }

    const list = document.getElementById('halo-media-list');
    if (!list) return;

    if (count === 0) {
      list.innerHTML = \`
        <div style="text-align:center; padding:28px 10px; color:#71717a; font-size:12px; line-height:1.6;">
          <strong>Menunggu pemutaran video...</strong><br/>
          Putar video di situs (YouTube, TikTok, Doodstream, dsb) atau klik tombol <strong>🔄 Pindai</strong> di atas.
        </div>
      \`;
      return;
    }

    list.innerHTML = '';
    detectedMedia.forEach((item) => {
      const card = document.createElement('div');
      card.style.cssText = \`
        background: #18181b;
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px;
        padding: 10px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      \`;

      const isHls = item.format.includes('HLS') || item.format.includes('m3u8');
      const isBlob = item.isBlob;

      card.innerHTML = \`
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-size:10px; font-weight:700; background:\${isHls ? '#1e3a8a' : isBlob ? '#581c87' : '#14532d'}; color:\${isHls ? '#93c5fd' : isBlob ? '#e9d5ff' : '#86efac'}; padding:2px 6px; border-radius:4px; text-transform:uppercase;">
            \${item.format}
          </span>
          <span style="font-size:9px; color:#71717a;">\${item.source} • \${item.timestamp}</span>
        </div>
        <div style="font-size:11px; color:#e4e4e7; word-break:break-all; font-family:monospace; line-height:1.3; max-height:46px; overflow:hidden; text-overflow:ellipsis;">
          \${item.url}
        </div>
        <div id="halo-status-\${item.id}" style="font-size:10px; color:#a1a1aa; display:none;"></div>
        <div id="halo-progress-\${item.id}" style="height:3px; background:#27272a; border-radius:2px; display:none; overflow:hidden;">
          <div style="height:100%; width:0%; background:#10b981; transition:width 0.2s;"></div>
        </div>
        <div style="display:flex; gap:6px; margin-top:4px;">
          <button id="halo-btn-dl-\${item.id}" style="flex:1; background:#27272a; color:#f4f4f5; border:1px solid rgba(255,255,255,0.12); border-radius:6px; padding:6px 8px; font-size:11px; cursor:pointer; font-weight:600;">
            ⬇ Unduh
          </button>
          <button id="halo-btn-cp-\${item.id}" style="background:#27272a; color:#a1a1aa; border:1px solid rgba(255,255,255,0.12); border-radius:6px; padding:6px 12px; font-size:11px; cursor:pointer;">
            Salin
          </button>
          <a href="\${item.url}" target="_blank" rel="noreferrer" style="background:#27272a; color:#a1a1aa; border:1px solid rgba(255,255,255,0.12); border-radius:6px; padding:6px 10px; font-size:11px; text-decoration:none; display:flex; align-items:center;">
            ↗
          </a>
        </div>
      \`;

      list.appendChild(card);

      // Copy Button
      const cpBtn = card.querySelector(\`#halo-btn-cp-\${item.id}\`);
      cpBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        GM_setClipboard(item.url);
        cpBtn.innerText = '✓';
        setTimeout(() => (cpBtn.innerText = 'Salin'), 1600);
      });

      // Download Button
      const dlBtn = card.querySelector(\`#halo-btn-dl-\${item.id}\`);
      const statusLabel = card.querySelector(\`#halo-status-\${item.id}\`);
      const progressBar = card.querySelector(\`#halo-progress-\${item.id}\`);

      dlBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        dlBtn.disabled = true;
        dlBtn.style.opacity = '0.5';
        statusLabel.style.display = 'block';
        statusLabel.style.color = '#a1a1aa';
        progressBar.style.display = 'block';
        progressBar.querySelector('div').style.width = '0%';

        try {
          if (isHls) {
            await downloadHlsStream(
              item,
              (percent, cur, total) => {
                progressBar.querySelector('div').style.width = percent + '%';
                statusLabel.innerText = \`Mengunduh: \${cur}/\${total} segmen (\${percent}%)\`;
              },
              (msg) => {
                statusLabel.innerText = msg;
              }
            );
          } else {
            await downloadDirectMedia(
              item,
              (percent, progressText) => {
                progressBar.querySelector('div').style.width = percent + '%';
                statusLabel.innerText = progressText;
              },
              (msg) => {
                statusLabel.innerText = msg;
              }
            );
          }
          statusLabel.style.color = '#10b981';
          dlBtn.innerText = '✓ Selesai';
        } catch (err) {
          statusLabel.innerText = 'Gagal: ' + (err.message || 'Koneksi ditolak');
          statusLabel.style.color = '#ef4444';
          dlBtn.innerText = 'Coba Lagi';
        } finally {
          dlBtn.disabled = false;
          dlBtn.style.opacity = '1';
        }
      });
    });
  }

  // --- 8. BOOTSTRAP INITIALIZATION ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initUI();
      scanDOMVideos();
    });
  } else {
    initUI();
    scanDOMVideos();
  }
})();
`;
}
