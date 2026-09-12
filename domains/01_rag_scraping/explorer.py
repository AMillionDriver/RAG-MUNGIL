import os
import json
import re
import random
import time
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from judge import SmartJudgeBot

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.join(CURRENT_DIR, "raw")
HISTORY_FILE = os.path.join(CURRENT_DIR, "exploration_history.json")

# Matrix Stratified Queries: Fokus ke exploit baru & teknik modern
STRATIFIED_QUERY_TEMPLATES = [
    '"{waf}" "{tool}" pushed:>2024-01-01',
    '"{waf}" bypass python stars:5..800',
    '"{tool}" anti-detect stars:10..1500',
    '"ja4" fingerprint bypass python',
    '"camoufox" turnstile OR datadome',
    '"curl-cffi" impersonate cloudflare',
    '"cdp" undetected bypass python',
    '"nodriver" cloudflare bypass'
]

WAF_TARGETS = ["turnstile", "datadome", "akamai", "kasada", "perimeterx", "cloudflare challenge"]
TOOL_TARGETS = ["camoufox", "curl-cffi", "tls-client", "playwright-stealth", "nodriver", "drissionpage"]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "RAG-Mungil-Harvester/4.0 (Enterprise-Harvester; Open-Source Research)"
]

def load_history() -> Dict[str, Any]:
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {"visited_repos": [], "visited_articles": [], "rejected": []}

def save_history(history: Dict[str, Any]):
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2, ensure_ascii=False)

class ResilientHttpClient:
    """
    HTTP Client dengan penanganan Rate-Limit GitHub API,
    rotasi User-Agent, dan exponential backoff.
    """
    def __init__(self, token: str = "", timeout: int = 15):
        self.token = token
        self.timeout = timeout

    def get(self, url: str, max_retries: int = 3) -> Optional[Tuple[int, str]]:
        headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": random.choice(USER_AGENTS)
        }
        if self.token:
            headers["Authorization"] = f"token {self.token}"

        req = urllib.request.Request(url, headers=headers)
        attempt = 0
        backoff = 2

        while attempt < max_retries:
            try:
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    status = resp.status
                    body = resp.read().decode("utf-8", errors="ignore")

                    # Periksa GitHub Rate Limit Headers
                    rate_remaining = resp.headers.get("X-RateLimit-Remaining")
                    if rate_remaining and int(rate_remaining) < 5:
                        print(f"⚠️ [Rate-Limit Warning] Sisa limit GitHub: {rate_remaining}. Pending sejenak...")
                        time.sleep(3)

                    return status, body

            except urllib.error.HTTPError as e:
                status_code = e.code
                if status_code == 429 or (status_code == 403 and "rate limit" in str(e).lower()):
                    reset_time = e.headers.get("X-RateLimit-Reset")
                    print(f"🛑 [Rate-Limited] HTTP {status_code}. Backoff {backoff} detik...")
                    time.sleep(backoff)
                    backoff *= 2
                    attempt += 1
                    continue
                elif status_code in (500, 502, 503, 504):
                    time.sleep(backoff)
                    backoff *= 2
                    attempt += 1
                    continue
                else:
                    # 404 atau client error lain
                    return status_code, ""
            except Exception as e:
                attempt += 1
                time.sleep(backoff)
                backoff *= 2

        return None

class AutonomousExplorer:
    def __init__(self, http: ResilientHttpClient, judge: SmartJudgeBot):
        self.http = http
        self.judge = judge
        self.history = load_history()
        self.visited_repos = set(self.history.get("visited_repos", []))
        self.visited_articles = set(self.history.get("visited_articles", []))
        self.rejected_items = set(self.history.get("rejected", []))
        os.makedirs(RAW_DIR, exist_ok=True)

    def generate_stratified_queries(self, count: int = 5) -> List[str]:
        """Menghasilkan pencarian terarah untuk menemukan 'hidden gems'."""
        queries = []
        for _ in range(count):
            tmpl = random.choice(STRATIFIED_QUERY_TEMPLATES)
            waf = random.choice(WAF_TARGETS)
            tool = random.choice(TOOL_TARGETS)
            q = tmpl.format(waf=waf, tool=tool)
            queries.append(q)
        return list(set(queries))[:count]

    def extract_actionable_code_blocks(self, text: str) -> List[str]:
        pattern = r"```(?:python|py|javascript|js|bash|sh|go|cpp)?\n(.*?)```"
        matches = re.findall(pattern, text, re.DOTALL)
        valid_blocks = []
        for m in matches:
            m_clean = m.strip()
            if len(m_clean) > 40 and not m_clean.startswith("#"):
                valid_blocks.append(m_clean)
        return valid_blocks[:6]

    def process_github_repo(self, repo_full_name: str, desc: str, html_url: str, stars: int, 
                            default_branch: str = "main", pushed_at: str = "", custom_topic: str = ""):
        if repo_full_name in self.visited_repos or repo_full_name in self.rejected_items:
            return

        # Ambil README
        raw_url = f"https://raw.githubusercontent.com/{repo_full_name}/{default_branch}"
        res = self.http.get(f"{raw_url}/README.md")
        if not res or res[0] != 200:
            res = self.http.get(f"{raw_url}/readme.md")

        if not res or res[0] != 200:
            self.rejected_items.add(repo_full_name)
            return

        content = res[1]
        metadata = {
            "stars": stars,
            "repo_name": repo_full_name,
            "pushed_at": pushed_at
        }

        # ⚖️ Bot Judge V4.0 Evaluasi
        accepted, score, judge_logs = self.judge.evaluate(
            title=custom_topic or desc or repo_full_name,
            content=content,
            metadata=metadata
        )

        if not accepted:
            print(f"⛔ [Judge REJECT] ({score} pts) {repo_full_name} -> {judge_logs[0]}")
            self.rejected_items.add(repo_full_name)
            return

        print(f"✨ [Judge ACCEPT] ({score} pts) {repo_full_name} -> Lolos kurasi Gold!")
        code_snippets = self.extract_actionable_code_blocks(content)

        waf_detected = []
        content_lower = content.lower()
        for w in ["cloudflare", "akamai", "datadome", "perimeterx", "kasada", "incapsula", "turnstile", "recaptcha"]:
            if w in content_lower:
                waf_detected.append(w.capitalize())

        record_id = f"scraping_gh_{repo_full_name.replace('/', '_')}"
        payload = {
            "id": record_id,
            "domain": "01_rag_scraping",
            "title": f"Teknik: {custom_topic or repo_full_name}",
            "summary": desc or f"Dokumentasi & implementasi anti-bot bypass dari {repo_full_name}",
            "content": content[:14000],
            "source_url": html_url,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "metadata": {
                "source_type": "github_repository",
                "stars": stars,
                "repo_name": repo_full_name,
                "pushed_at": pushed_at,
                "bypassed_wafs": waf_detected or ["Anti-Bot Mechanism"],
                "judge_score": score,
                "judge_verdict": "ACCEPTED",
                "judge_notes": judge_logs,
                "code_snippets_count": len(code_snippets),
                "code_snippets": code_snippets
            }
        }

        with open(os.path.join(RAW_DIR, f"{record_id}.json"), "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        self.visited_repos.add(repo_full_name)

        # 🔄 Recursive Link Hopper: Perluas batas hingga 10 referensi outbound
        outbound_repos = re.findall(r"github\.com/([a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+)", content)
        probed = 0
        for cand in outbound_repos:
            cand = cand.rstrip(".git").rstrip("/").split("#")[0]
            # Lewati tautan akun sendiri atau file static github
            if any(cand.startswith(x) for x in ["topics/", "features/", "sponsors/", "settings/", "user-attachments/"]):
                continue
            if cand != repo_full_name and cand not in self.visited_repos and cand not in self.rejected_items:
                print(f"   ↳ [Link Hopper] Menginvestigasi referensi: {cand}")
                self.probe_outbound_repo(cand)
                probed += 1
                if probed >= 8:
                    break

    def probe_outbound_repo(self, repo_name: str):
        res = self.http.get(f"https://api.github.com/repos/{repo_name}")
        if res and res[0] == 200:
            try:
                data = json.loads(res[1])
                self.process_github_repo(
                    repo_full_name=repo_name,
                    desc=data.get("description", ""),
                    html_url=data.get("html_url", f"https://github.com/{repo_name}"),
                    stars=data.get("stargazers_count", 0),
                    default_branch=data.get("default_branch", "main"),
                    pushed_at=data.get("pushed_at", "")
                )
            except Exception:
                pass

    def explore_github_search(self, queries: List[str]):
        print("\n--- [Eksplorasi Stratified GitHub Search API] ---")
        for q in queries:
            encoded_q = urllib.parse.quote(q)
            url = f"https://api.github.com/search/repositories?q={encoded_q}&sort=updated&order=desc&per_page=4"
            res = self.http.get(url)
            if not res or res[0] != 200:
                continue
            try:
                items = json.loads(res[1]).get("items", [])
                for it in items:
                    self.process_github_repo(
                        repo_full_name=it.get("full_name"),
                        desc=it.get("description", ""),
                        html_url=it.get("html_url"),
                        stars=it.get("stargazers_count", 0),
                        default_branch=it.get("default_branch", "main"),
                        pushed_at=it.get("pushed_at", "")
                    )
            except Exception as e:
                print(f"Error parse search query '{q}': {e}")

    def explore_hackernews(self):
        print("\n--- [Eksplorasi HackerNews Engineering Discussions] ---")
        hn_queries = ["anti-bot bypass", "cloudflare turnstile bypass", "browser fingerprinting ja4", "web scraping cdp"]
        for q in hn_queries:
            encoded_q = urllib.parse.quote(q)
            url = f"https://hn.algolia.com/api/v1/search?query={encoded_q}&tags=story&hitsPerPage=3"
            res = self.http.get(url)
            if not res or res[0] != 200:
                continue
            try:
                hits = json.loads(res[1]).get("hits", [])
                for h in hits:
                    hn_id = str(h.get("objectID"))
                    if hn_id in self.visited_articles:
                        continue

                    title = h.get("title", "")
                    story_url = h.get("url") or f"https://news.ycombinator.com/item?id={hn_id}"
                    story_text = h.get("story_text") or ""
                    combined_text = f"{title}\n\n{story_text}"

                    accepted, score, judge_logs = self.judge.evaluate(
                        title=title,
                        content=combined_text,
                        metadata={"stars": h.get("points", 0)}
                    )

                    if accepted:
                        print(f"✨ [Judge ACCEPT HN] ({score} pts) {title}")
                        record_id = f"scraping_hn_{hn_id}"
                        payload = {
                            "id": record_id,
                            "domain": "01_rag_scraping",
                            "title": f"HN Tech: {title}",
                            "summary": f"Diskusi teknis HackerNews tentang {q}",
                            "content": combined_text[:10000],
                            "source_url": story_url,
                            "created_at": datetime.utcnow().isoformat() + "Z",
                            "metadata": {
                                "source_type": "hackernews_discussion",
                                "points": h.get("points", 0),
                                "comments_count": h.get("num_comments", 0),
                                "judge_score": score,
                                "judge_verdict": "ACCEPTED",
                                "judge_notes": judge_logs
                            }
                        }
                        with open(os.path.join(RAW_DIR, f"{record_id}.json"), "w", encoding="utf-8") as f:
                            json.dump(payload, f, ensure_ascii=False, indent=2)

                    self.visited_articles.add(hn_id)
            except Exception as e:
                print(f"HN search error for '{q}': {e}")

    def save_state(self):
        self.history["visited_repos"] = list(self.visited_repos)[-1000:]
        self.history["visited_articles"] = list(self.visited_articles)[-1000:]
        self.history["rejected"] = list(self.rejected_items)[-1000:]
        save_history(self.history)
