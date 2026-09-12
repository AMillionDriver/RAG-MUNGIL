import os
import json
import urllib.parse
from judge import SmartJudgeBot
from explorer import AutonomousExplorer, ResilientHttpClient

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(CURRENT_DIR, "raw")

# Seed Kategori Beragam (TLS, Browser C++, CDP, Mobile, Stealth)
DIVERSE_CURATED_SEEDS = [
    # 1. TLS & JA3/JA4 Impersonation
    {"repo": "lexiforest/curl_cffi", "topic": "TLS JA3/JA4 Fingerprint Impersonation & HTTP/2 Bypass"},
    {"repo": "bogdanfinn/tls-client", "topic": "High-Performance TLS Evasion Client"},
    {"repo": "lwthiker/curl-impersonate", "topic": "Engine C/C++ Level TLS Handshake Camouflage"},

    # 2. Browser Engine Level C++ Spoofing
    {"repo": "daijro/camoufox", "topic": "Firefox C++ Source-Level Anti-Detect Browser"},
    {"repo": "kaliiiiiiiiii/Selenium-Stealth", "topic": "Chrome DevTools Protocol (CDP) Masking"},
    {"repo": "berstend/puppeteer-extra", "topic": "Puppeteer Stealth Plugin Architecture"},

    # 3. Modern Async & Undetected Frameworks
    {"repo": "ultrafunkamsterdam/nodriver", "topic": "Asynchronous CDP Native Browser Without Webdriver"},
    {"repo": "goflyway/goproxy", "topic": "Tunneling & Traffic Mutation Patterns"},
    {"repo": "gcode-de/drissionpage", "topic": "Dual-Drive Web Control (DOM + Network Packet Sniffing)"}
]

def main():
    os.makedirs(RAW_DIR, exist_ok=True)
    github_token = os.environ.get("GITHUB_TOKEN", "")

    http = ResilientHttpClient(token=github_token, timeout=20)
    judge = SmartJudgeBot(accept_threshold=75)
    explorer = AutonomousExplorer(http=http, judge=judge)

    print("==========================================================")
    print("🚀 [RAG-MUNGIL] AUTONOMOUS EXPLORER & SMART JUDGE BOT v4.0")
    print("==========================================================")

    # 1. Ingest & Evaluasi Curated Seeds
    print("\n--- [Tahap 1: Verifikasi & Penilaian Curated Seeds] ---")
    for seed in DIVERSE_CURATED_SEEDS:
        repo_name = seed["repo"]
        res = http.get(f"https://api.github.com/repos/{repo_name}")
        if res and res[0] == 200:
            try:
                data = json.loads(res[1])
                explorer.process_github_repo(
                    repo_full_name=repo_name,
                    desc=data.get("description", ""),
                    html_url=data.get("html_url", f"https://github.com/{repo_name}"),
                    stars=data.get("stargazers_count", 0),
                    default_branch=data.get("default_branch", "main"),
                    pushed_at=data.get("pushed_at", ""),
                    custom_topic=seed["topic"]
                )
            except Exception as e:
                print(f"Gagal memproses seed {repo_name}: {e}")

    # 2. Penjelajahan Stratified Query (Hidden Gems Discovery)
    print("\n--- [Tahap 2: Menjelajah Stratified Queries (Targeting Hidden Gems)] ---")
    stratified_queries = explorer.generate_stratified_queries(count=5)
    print(f"Stratified queries siklus ini: {stratified_queries}")
    explorer.explore_github_search(stratified_queries)

    # 3. HackerNews Engineering Discussions
    print("\n--- [Tahap 3: Menjelajah Diskusi Teknis HackerNews] ---")
    explorer.explore_hackernews()

    # 4. Simpan State Riwayat
    explorer.save_state()
    print("\n🎉 Siklus penjelajahan & penghakiman v4.0 selesai!")

if __name__ == "__main__":
    main()
