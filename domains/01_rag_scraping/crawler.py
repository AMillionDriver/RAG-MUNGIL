import os
import json
import urllib.parse
from judge import SmartJudgeBot
from explorer import AutonomousExplorer, HttpClient

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(CURRENT_DIR, "raw")

# Seed Repo Pionir Emas Terverifikasi
CURATED_SEEDS = [
    {"repo": "lexiforest/curl_cffi", "topic": "TLS JA3/JA4 Fingerprint Impersonation & HTTP/2 Bypass"},
    {"repo": "kaliiiiiiiiii/Selenium-Stealth", "topic": "Selenium Chrome Fingerprint Masking"},
    {"repo": "berstend/puppeteer-extra", "topic": "Puppeteer Stealth Plugin Architecture"},
    {"repo": "daijro/camoufox", "topic": "Firefox C++ Engine Anti-Detect & Canvas/Audio Spoofing"},
    {"repo": "gospider007/requests", "topic": "Go TLS Client & Anti-Bot Emulation"},
    {"repo": "bogdanfinn/tls-client", "topic": "Advanced TLS Client for Golang & Python Bindings"},
    {"repo": "lorien/grab", "topic": "High-level Web Scraping Architecture & Spider Framework"},
    {"repo": "Scrapfly/scrapfly-python-sdk", "topic": "Anti-Scraping Defense Handling & Webhook Parsing"}
]

def main():
    os.makedirs(RAW_DIR, exist_ok=True)
    github_token = os.environ.get("GITHUB_TOKEN", "")
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "RAG-Mungil-Harvester/3.0"
    }
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    http = HttpClient(headers=headers, timeout=20)
    judge = SmartJudgeBot(accept_threshold=60)
    explorer = AutonomousExplorer(http=http, judge=judge)

    print("==========================================================")
    print("🚀 [RAG-MUNGIL] AUTONOMOUS EXPLORER & SMART JUDGE BOT v3.0")
    print("==========================================================")

    # 1. Verifikasi Curated Seeds
    print("\n--- [Tahap 1: Verifikasi & Penilaian Curated Seeds] ---")
    for seed in CURATED_SEEDS:
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
                    custom_topic=seed["topic"]
                )
            except Exception as e:
                print(f"Gagal memproses seed {repo_name}: {e}")

    # 2. Penjelajahan Internet Dinamis
    print("\n--- [Tahap 2: Menjelajah Internet dengan Query Dinamis] ---")
    dynamic_queries = explorer.generate_dynamic_queries(count=4)
    print(f"Query terpilih untuk penjelajahan siklus ini: {dynamic_queries}")
    explorer.explore_github_search(dynamic_queries)

    # 3. Penjelajahan HackerNews Engineering Discussions
    print("\n--- [Tahap 3: Menjelajah Diskusi Teknis HackerNews] ---")
    explorer.explore_hackernews()

    # 4. Simpan State Riwayat
    explorer.save_state()
    print("\n🎉 Siklus penjelajahan & penghakiman selesai!")

if __name__ == "__main__":
    main()
