import os
import json
import re
import httpx
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(CURRENT_DIR, "raw")

# 1. Target repositori elite & pionir dalam dunia scraping / anti-bot bypass
CURATED_REPOS = [
    {"repo": "curl-cffi/curl-cffi", "topic": "TLS JA3/JA4 Fingerprint Impersonation & HTTP/2 Bypass"},
    {"repo": "kaliiiiiiiiii/Selenium-Stealth", "topic": "Selenium Chrome Fingerprint Masking"},
    {"repo": "berstend/puppeteer-extra", "topic": "Puppeteer Stealth Plugin Architecture"},
    {"repo": "daijro/camoufox", "topic": "Firefox C++ Engine Anti-Detect & Canvas/Audio Spoofing"},
    {"repo": "gospider007/requests", "topic": "Go TLS Client & Anti-Bot Emulation"},
    {"repo": "bogdanfinn/tls-client", "topic": "Advanced TLS Client for Golang & Python Bindings"},
    {"repo": "lorien/grab", "topic": "High-level Web Scraping Architecture & Spider Framework"},
    {"repo": "Scrapfly/scrapfly-python-sdk", "topic": "Anti-Scraping Defense Handling & Webhook Parsing"}
]

# 2. Query pencarian dinamis untuk menangkap trik terbaru dari komunitas global
DYNAMIC_QUERIES = [
    "cloudflare turnstile bypass playwright",
    "akamai bot manager bypass python",
    "ja4 fingerprint bypass",
    "scraping canvas fingerprint spoofing",
    "datadome slider bypass python"
]

def extract_code_blocks(markdown_text: str):
    """Mengekstrak blok kode program untuk memudahkan Agent Codex meniru implementasinya."""
    pattern = r"```(?:python|py|javascript|js|bash|sh)?\n(.*?)```"
    matches = re.findall(pattern, markdown_text, re.DOTALL)
    valid_snippets = [m.strip() for m in matches if len(m.strip()) > 30]
    return valid_snippets[:5] # Simpan hingga 5 snippet kode terbaik

def extract_repo_data(client: httpx.Client, repo_full_name: str, desc: str, html_url: str, stars: int, default_branch: str, custom_topic: str = ""):
    raw_url = f"https://raw.githubusercontent.com/{repo_full_name}/{default_branch}"
    
    # Coba ambil README utama
    readme_res = client.get(f"{raw_url}/README.md")
    if readme_res.status_code != 200:
        readme_res = client.get(f"{raw_url}/readme.md")

    if readme_res.status_code != 200 or len(readme_res.text) < 150:
        return

    content_text = readme_res.text
    code_snippets = extract_code_blocks(content_text)

    # Identifikasi teknik WAF yang disasar
    waf_detected = []
    content_lower = content_text.lower()
    for waf in ["cloudflare", "akamai", "datadome", "perimeterx", "kasada", "incapsula", "turnstile", "recaptcha"]:
        if waf in content_lower:
            waf_detected.append(waf.capitalize())

    record_id = f"scraping_{repo_full_name.replace('/', '_')}"
    payload = {
        "id": record_id,
        "domain": "01_rag_scraping",
        "title": f"Teknik: {custom_topic or repo_full_name}",
        "summary": desc or "Materi arsitektur dan implementasi teknik scraping tingkat lanjut.",
        "content": content_text[:12000], # Ambil konten mendalam hingga 12.000 karakter
        "source_url": html_url,
        "created_at": datetime.utcnow().isoformat() + "Z",
        "metadata": {
            "stars": stars,
            "repo_name": repo_full_name,
            "bypassed_wafs": waf_detected or ["General Anti-Bot"],
            "code_snippets_count": len(code_snippets),
            "code_snippets": code_snippets,
            "tier": "GOLD_CURATED" if custom_topic else "DISCOVERED"
        }
    }

    raw_file = os.path.join(RAW_DIR, f"{record_id}.json")
    with open(raw_file, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"✔️ Berhasil mengemas materi: {repo_full_name}")

def search_and_harvest():
    os.makedirs(RAW_DIR, exist_ok=True)
    github_token = os.environ.get("GITHUB_TOKEN", "")
    headers = {"Accept": "application/vnd.github.v3+json", "User-Agent": "RAG-Mungil-Harvester/2.0"}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    client = httpx.Client(headers=headers, timeout=20.0, follow_redirects=True)

    # 1. Harvest Curated Repositories (Sumber Teruji Emas)
    print("--- [Tahap 1: Memanen Curated Elite Repos] ---")
    for item in CURATED_REPOS:
        repo_name = item["repo"]
        try:
            res = client.get(f"https://api.github.com/repos/{repo_name}")
            if res.status_code == 200:
                data = res.json()
                extract_repo_data(
                    client=client,
                    repo_full_name=repo_name,
                    desc=data.get("description", ""),
                    html_url=data.get("html_url", f"https://github.com/{repo_name}"),
                    stars=data.get("stargazers_count", 0),
                    default_branch=data.get("default_branch", "main"),
                    custom_topic=item["topic"]
                )
        except Exception as e:
            print(f"Error pada {repo_name}: {e}")

    # 2. Harvest Dynamic Discovery (Update Terbaru dari Dunia)
    print("--- [Tahap 2: Memburu Teknik Terbaru via Search API] ---")
    for query in DYNAMIC_QUERIES:
        try:
            url = f"https://api.github.com/search/repositories?q={query}&sort=updated&order=desc&per_page=3"
            res = client.get(url)
            if res.status_code != 200:
                continue

            for repo in res.json().get("items", []):
                extract_repo_data(
                    client=client,
                    repo_full_name=repo.get("full_name"),
                    desc=repo.get("description", ""),
                    html_url=repo.get("html_url"),
                    stars=repo.get("stargazers_count", 0),
                    default_branch=repo.get("default_branch", "main")
                )
        except Exception as e:
            print(f"Error pada query '{query}': {e}")

if __name__ == "__main__":
    search_and_harvest()
