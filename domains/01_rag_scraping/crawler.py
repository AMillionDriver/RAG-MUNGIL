import os
import json
import httpx
from datetime import datetime

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(CURRENT_DIR, "raw")

# Kata kunci pemburu teknik scraping tingkat tinggi
TARGET_QUERIES = [
    "cloudflare bypass playwright",
    "tls fingerprinting curl impersonate",
    "web scraping anti bot bypass python",
    "undetected chromedriver bypass"
]

def search_github_knowledge():
    os.makedirs(RAW_DIR, exist_ok=True)
    github_token = os.environ.get("GITHUB_TOKEN", "")
    headers = {"Accept": "application/vnd.github.v3+json"}
    if github_token:
        headers["Authorization"] = f"token {github_token}"

    client = httpx.Client(headers=headers, timeout=15.0)

    for query in TARGET_QUERIES:
        try:
            url = f"https://api.github.com/search/repositories?q={query}&sort=updated&order=desc&per_page=3"
            res = client.get(url)
            if res.status_code != 200:
                continue

            items = res.json().get("items", [])
            for repo in items:
                repo_full_name = repo.get("full_name")
                desc = repo.get("description") or "Tidak ada deskripsi."
                html_url = repo.get("html_url")
                stars = repo.get("stargazers_count", 0)

                # Coba ambil README repo tersebut sebagai materi RAG
                readme_url = f"https://raw.githubusercontent.com/{repo_full_name}/main/README.md"
                readme_res = client.get(readme_url)
                if readme_res.status_code != 200:
                    readme_url = f"https://raw.githubusercontent.com/{repo_full_name}/master/README.md"
                    readme_res = client.get(readme_url)

                if readme_res.status_code == 200 and len(readme_res.text) > 150:
                    record_id = f"scraping_gh_{repo.get('id')}"
                    payload = {
                        "id": record_id,
                        "domain": "rag_scraping",
                        "title": f"Teknik & Tool: {repo_full_name}",
                        "summary": desc,
                        "content": readme_res.text[:8000], # Ambil max 8000 char inti
                        "source_url": html_url,
                        "created_at": datetime.utcnow().isoformat() + "Z",
                        "metadata": {
                            "stars": stars,
                            "repo_name": repo_full_name,
                            "search_keyword": query,
                            "tool_category": "anti_bot_or_scraping"
                        }
                    }

                    # Simpan ke folder raw sementara untuk dibersihkan oleh DATA_CLEANER.py
                    raw_file = os.path.join(RAW_DIR, f"{record_id}.json")
                    with open(raw_file, "w", encoding="utf-8") as f:
                        json.dump(payload, f, ensure_ascii=False, indent=2)

        except Exception as e:
            print(f"Gagal memproses query '{query}': {e}")
            continue

if __name__ == "__main__":
    print("Mulai mencari teknik scraping baru...")
    search_github_knowledge()
    print("Selesai mengumpulkan data mentah.")