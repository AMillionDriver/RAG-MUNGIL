export interface RagRecord {
  id: string;
  domain: string;
  title: string;
  summary: string;
  content: string;
  source_url: string;
  created_at: string;
  metadata: {
    stars?: number;
    repo_name?: string;
    bypassed_wafs?: string[];
    tier?: 'GOLD_CURATED' | 'DISCOVERED';
    code_snippets?: string[];
    [key: string]: any;
  };
}

export const INITIAL_DATASET: RagRecord[] = [
  {
    id: "scraping_curl_cffi_curl_cffi",
    domain: "01_rag_scraping",
    title: "TLS JA3/JA4 Fingerprint Impersonation & HTTP/2 Bypass",
    summary: "Python binding for curl-impersonate via cffi. Emulates real Chrome/Safari browser TLS & HTTP/2 signatures to bypass Cloudflare Turnstile & Akamai.",
    content: "curl-cffi adalah pustaka Python yang dibangun di atas curl-impersonate untuk meniru persis handshake TLS, cipher suites, curve extensions, dan frame HTTP/2 dari browser asli (Chrome 110-124, Safari, Edge).\n\nKenapa Diperlukan?\nWAF modern seperti Cloudflare v2/v3, Akamai, dan DataDome tidak hanya memeriksa User-Agent HTTP header. Mereka menganalisis hash JA3, JA4, dan prioritas HTTP/2 frame stream.",
    source_url: "https://github.com/curl-cffi/curl-cffi",
    created_at: "2026-09-12T06:00:00Z",
    metadata: {
      stars: 4800,
      repo_name: "curl-cffi/curl-cffi",
      bypassed_wafs: ["Cloudflare", "Akamai", "Datadome"],
      tier: "GOLD_CURATED",
      code_snippets: [
`from curl_cffi import requests

# Meniru Chrome 124 browser TLS footprint
session = requests.Session(impersonate="chrome124")
response = session.get("https://tls.browserleaks.com/json")
print("TLS JA3/JA4 Validated:", response.json())`
      ]
    }
  },
  {
    id: "scraping_daijro_camoufox",
    domain: "01_rag_scraping",
    title: "Firefox C++ Engine Anti-Detect & Canvas/Audio Spoofing",
    summary: "Camoufox is an open-source stealth browser engine based on patched Firefox C++ source code. Injects undetectable hardware, canvas, webgl, and audio noise.",
    content: "Camoufox memodifikasi browser pada tingkat source code C++ Mozilla Firefox, bukan sekadar monkey-patching JavaScript seperti kebanyakan puppeteer-stealth plugin yang mudah terbaca melalui runtime prototype inspection.\n\nFitur Unggulan:\n1. Zero JS-leak canvas, webgl, and web-audio fingerprint noise.\n2. Otomatis mengubah font list, screen resolution, audio context sample rate.\n3. Terintegrasi penuh dengan Python Playwright API.",
    source_url: "https://github.com/daijro/camoufox",
    created_at: "2026-09-12T06:10:00Z",
    metadata: {
      stars: 3200,
      repo_name: "daijro/camoufox",
      bypassed_wafs: ["Cloudflare", "Turnstile", "Perimeterx"],
      tier: "GOLD_CURATED",
      code_snippets: [
`from camoufox.sync_api import Camoufox

with Camoufox(headless=True) as browser:
    page = browser.new_page()
    page.goto('https://nowsecure.nl')
    page.wait_for_timeout(5000)
    print("Title after bypass:", page.title())`
      ]
    }
  },
  {
    id: "scraping_kaliiiiiiiiii_Selenium_Stealth",
    domain: "01_rag_scraping",
    title: "Selenium Chrome Fingerprint Masking",
    summary: "Prevent selenium detection by masking navigator.webdriver, chrome.runtime, permissions query, plugins, and WebGL vendor.",
    content: "Mencegah webdriver flag dideteksi oleh bot detection scripts (seperti F5 BIG-IP, Kasada, Distil Networks). Mengatasi kebocoran navigator.webdriver, cdc_ marker, dan plugin signature.",
    source_url: "https://github.com/kaliiiiiiiiii/Selenium-Stealth",
    created_at: "2026-09-12T06:15:00Z",
    metadata: {
      stars: 4100,
      repo_name: "kaliiiiiiiiii/Selenium-Stealth",
      bypassed_wafs: ["Kasada", "Cloudflare"],
      tier: "GOLD_CURATED",
      code_snippets: [
`from selenium import webdriver
from selenium_stealth import stealth

options = webdriver.ChromeOptions()
options.add_argument("--headless")
options.add_experimental_option("excludeSwitches", ["enable-automation"])
options.add_experimental_option('useAutomationExtension', False)
driver = webdriver.Chrome(options=options)

stealth(driver,
    languages=["en-US", "en"],
    vendor="Google Inc.",
    platform="Win32",
    webgl_vendor="Intel Inc.",
    renderer="Intel Iris OpenGL Engine",
    fix_hairline=True,
)`
      ]
    }
  },
  {
    id: "scraping_bogdanfinn_tls_client",
    domain: "01_rag_scraping",
    title: "High-Performance uTLS Client for Golang & Python",
    summary: "Custom HTTP client based on uTLS and http2 that allows setting custom Client Hello and HTTP/2 settings frames.",
    content: "Bila Anda membutuhkan ribuan request per detik tanpa overhead Chromium, tls-client mengompilasi uTLS Go ke dynamic C shared library (.so / .dll) yang bisa dipanggil Python secara instan dengan kecepatan native.",
    source_url: "https://github.com/bogdanfinn/tls-client",
    created_at: "2026-09-12T06:20:00Z",
    metadata: {
      stars: 2900,
      repo_name: "bogdanfinn/tls-client",
      bypassed_wafs: ["Akamai", "Datadome", "Cloudflare"],
      tier: "GOLD_CURATED",
      code_snippets: [
`import tls_client

session = tls_client.Session(
    client_identifier="chrome_120",
    random_tls_extension_order=True
)

res = session.get(
    "https://www.nike.com",
    headers={"accept": "application/json"}
)
print("Status:", res.status_code)`
      ]
    }
  },
  {
    id: "scraping_gh_1366787957",
    domain: "01_rag_scraping",
    title: "Async Anti-Bot Stealth Scraper (Turnstile & Akamai)",
    summary: "Enterprise async Python scraping engine designed to bypass Cloudflare Turnstile & Akamai. Built with Playwright, Camoufox, and Pydantic v2.",
    content: "Arsitektur scraper asinkron untuk bypass proteksi Cloudflare Turnstile dan Akamai Enterprise. Menggabungkan pool proxy rotasi per domain target dengan exponential backoff.",
    source_url: "https://github.com/ibrahimksystems/anti-bot-stealth-scraper",
    created_at: "2026-09-12T06:30:00Z",
    metadata: {
      stars: 12,
      repo_name: "ibrahimksystems/anti-bot-stealth-scraper",
      bypassed_wafs: ["Cloudflare", "Akamai", "Turnstile"],
      tier: "DISCOVERED",
      code_snippets: [
`import asyncio
from camoufox.async_api import AsyncCamoufox

async def fetch_target(url):
    async with AsyncCamoufox(headless=True) as browser:
        page = await browser.new_page()
        await page.goto(url)
        content = await page.content()
        return content`
      ]
    }
  }
];
