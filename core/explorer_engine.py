import os
import sys
import json
import re
import fnmatch
import random
import time
import urllib.request
import urllib.error
import urllib.parse
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from core.judge_engine import SmartJudgeBot

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
    "RAG-Mungil-Harvester/6.0 (Enterprise-Harvester; Open-Source Research)"
]

class ResilientHttpClient:
    """
    HTTP Client tangguh dengan rate-limit protection,
    rotasi User-Agent, dan exponential backoff.
    """
    def __init__(self, token: str = "", timeout: int = 15):
        self.token = token
        self.timeout = timeout

    def get(self, url: str, headers: Optional[Dict[str, str]] = None, max_retries: int = 3) -> Optional[Tuple[int, str]]:
        req_headers = {
            "User-Agent": random.choice(USER_AGENTS),
            "Accept": "application/vnd.github.v3+json, text/html, application/json, text/plain, */*"
        }
        if self.token and "github.com" in url:
            req_headers["Authorization"] = f"Bearer {self.token}"

        if headers:
            req_headers.update(headers)

        for attempt in range(max_retries):
            try:
                req = urllib.request.Request(url, headers=req_headers)
                with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                    code = resp.getcode()
                    content = resp.read().decode("utf-8", errors="replace")
                    return code, content
            except urllib.error.HTTPError as e:
                # GitHub Primary / Secondary Rate Limit
                if e.code in [403, 429]:
                    reset_time = e.headers.get("x-ratelimit-reset")
                    if reset_time:
                        wait_sec = max(int(reset_time) - int(time.time()), 2)
                        wait_sec = min(wait_sec, 60)
                        print(f"⚠️ [Rate Limit] GitHub API 403/429. Tidur {wait_sec} detik...")
                        time.sleep(wait_sec)
                    else:
                        backoff = (attempt + 1) * 4
                        time.sleep(backoff)
                elif e.code in [404, 451, 410]:
                    return e.code, ""
                else:
                    time.sleep(1.5)
            except Exception:
                time.sleep(1.5)

        return None

class AutonomousExplorer:
    """
    Universal Domain-Agnostic Explorer:
    - Ingestion multi-target (README + source code pattern file fetcher via Tree API).
    - Membaca target & template pencarian dari config domain.
    - Menjelajah repositori GitHub dan referensi outbound (Link Hopper).
    - Memproses diskusi teknis HackerNews.
    - Menyimpan artefak valid ke direktori raw domain target.
    """
    def __init__(self, http: ResilientHttpClient, judge: SmartJudgeBot, config: Dict[str, Any], domain_dir: str):
        self.http = http
        self.judge = judge
        self.config = config
        self.domain_id = config.get("domain_id", "default_domain")
        self.domain_dir = domain_dir
        self.raw_dir = os.path.join(domain_dir, "raw")
        self.history_file = os.path.join(domain_dir, "exploration_history.json")

        # Ingestion Target Config
        ingestion_targets = config.get("ingestion_targets", {})
        self.source_file_patterns: List[str] = ingestion_targets.get("source_file_patterns", [])
        self.max_source_files: int = ingestion_targets.get("max_source_files", 3)

        os.makedirs(self.raw_dir, exist_ok=True)
        self.history = self._load_history()
        self.visited_repos = set(self.history.get("visited_repos", []))
        self.visited_articles = set(self.history.get("visited_articles", []))
        self.rejected_items = set(self.history.get("rejected", []))

    def _load_history(self) -> Dict[str, Any]:
        if os.path.exists(self.history_file):
            try:
                with open(self.history_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {"visited_repos": [], "visited_articles": [], "rejected": []}

    def save_state(self):
        self.history["visited_repos"] = list(self.visited_repos)[-1000:]
        self.history["visited_articles"] = list(self.visited_articles)[-1000:]
        self.history["rejected"] = list(self.rejected_items)[-1000:]
        with open(self.history_file, "w", encoding="utf-8") as f:
            json.dump(self.history, f, indent=2, ensure_ascii=False)

    def generate_stratified_queries(self, count: int = 5) -> List[str]:
        templates = self.config.get("stratified_query_templates", [])
        variables = self.config.get("template_variables", {})
        if not templates:
            return []

        queries = []
        for _ in range(count * 2):
            tmpl = random.choice(templates)
            format_kwargs = {}
            for var_key, var_options in variables.items():
                if var_options:
                    format_kwargs[var_key] = random.choice(var_options)
            try:
                q = tmpl.format(**format_kwargs)
                queries.append(q)
            except KeyError:
                queries.append(tmpl)

        return list(set(queries))[:count]

    def extract_actionable_code_blocks(self, text: str) -> List[str]:
        pattern = r"```(?:[a-zA-Z0-9_-]+)?\n(.*?)```"
        matches = re.findall(pattern, text, re.DOTALL)
        valid_blocks = []
        for m in matches:
            m_clean = m.strip()
            if len(m_clean) > 40 and not m_clean.startswith("#"):
                valid_blocks.append(m_clean)
        return valid_blocks[:6]

    def fetch_source_code_files(self, repo_full_name: str, default_branch: str) -> str:
        """
        Mengambil konten file source code asli (*.t.sol, *.sol, *.py, dll)
        berdasarkan pola glob di ingestion_targets.
        """
        if not self.source_file_patterns:
            return ""

        tree_url = f"https://api.github.com/repos/{repo_full_name}/git/trees/{default_branch}?recursive=1"
        res = self.http.get(tree_url)
        if not res or res[0] != 200:
            return ""

        try:
            tree_data = json.loads(res[1])
            tree = tree_data.get("tree", [])
        except Exception:
            return ""

        matched_paths = []
        for item in tree:
            if item.get("type") != "blob":
                continue
            path = item.get("path", "")
            for pat in self.source_file_patterns:
                if fnmatch.fnmatch(path, pat) or fnmatch.fnmatch(os.path.basename(path), pat):
                    matched_paths.append(path)
                    break

        if not matched_paths:
            return ""

        # Batasi pengambilan file agar tidak melebihi kuota/timeout
        matched_paths = matched_paths[:self.max_source_files]
        combined_source = "\n\n### 📦 Source Code Files (Foundry / Exploit PoC / Source):\n"

        for path in matched_paths:
            raw_file_url = f"https://raw.githubusercontent.com/{repo_full_name}/{default_branch}/{path}"
            file_res = self.http.get(raw_file_url)
            if file_res and file_res[0] == 200:
                ext = path.split(".")[-1] if "." in path else ""
                combined_source += f"\nFile: `{path}`\n```{ext}\n{file_res[1][:4000]}\n```\n"

        return combined_source

    def process_github_repo(self, repo_full_name: str, desc: str, html_url: str, stars: int,
                            default_branch: str = "main", pushed_at: str = "", custom_topic: str = ""):
        if repo_full_name in self.visited_repos or repo_full_name in self.rejected_items:
            return

        raw_url = f"https://raw.githubusercontent.com/{repo_full_name}/{default_branch}"
        res = self.http.get(f"{raw_url}/README.md")
        if not res or res[0] != 200:
            res = self.http.get(f"{raw_url}/readme.md")

        content = res[1] if (res and res[0] == 200) else ""

        # Tarik source code files jika domain memintanya (misal PoC Foundry / Exploit)
        source_code_content = self.fetch_source_code_files(repo_full_name, default_branch)
        full_content = (content + "\n\n" + source_code_content).strip()

        if not full_content:
            self.rejected_items.add(repo_full_name)
            return

        metadata = {
            "stars": stars,
            "repo_name": repo_full_name,
            "pushed_at": pushed_at
        }

        # Evaluasi dengan Judge
        accepted, score, judge_logs = self.judge.evaluate(
            title=custom_topic or desc or repo_full_name,
            content=full_content,
            metadata=metadata
        )

        if not accepted:
            print(f"⛔ [Judge REJECT] ({score} pts) {repo_full_name} -> {judge_logs[0]}")
            self.rejected_items.add(repo_full_name)
            return

        print(f"✨ [Judge ACCEPT] ({score} pts) {repo_full_name} -> Lolos kurasi Gold!")
        code_snippets = self.extract_actionable_code_blocks(full_content)

        # Ekstraksi tag spesifik dari config domain
        tag_labels = self.config.get("target_waf_tags", [])
        matched_tags = []
        content_lower = full_content.lower()
        for tag in tag_labels:
            if tag.lower() in content_lower:
                matched_tags.append(tag.capitalize())

        record_id = f"{self.domain_id}_gh_{repo_full_name.replace('/', '_')}"
        payload = {
            "id": record_id,
            "domain": self.domain_id,
            "title": f"Teknik: {custom_topic or repo_full_name}",
            "summary": desc or f"Dokumentasi & implementasi teknik dari {repo_full_name}",
            "content": full_content[:18000],
            "source_url": html_url,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "metadata": {
                "source_type": "github_repository",
                "stars": stars,
                "repo_name": repo_full_name,
                "pushed_at": pushed_at,
                "bypassed_wafs": matched_tags or [f"{self.config.get('domain_label', 'Teknik')} Implementasi"],
                "judge_score": score,
                "judge_verdict": "ACCEPTED",
                "judge_notes": judge_logs,
                "code_snippets_count": len(code_snippets),
                "code_snippets": code_snippets
            }
        }

        with open(os.path.join(self.raw_dir, f"{record_id}.json"), "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        self.visited_repos.add(repo_full_name)

        # Recursive Link Hopper (maksimal 8 investigasi per repo)
        outbound_repos = re.findall(r"github\.com/([a-zA-Z0-9_-]+/[a-zA-Z0-9_.-]+)", full_content)
        probed = 0
        IGNORED_PREFIXES = [
            "topics/", "features/", "sponsors/", "settings/", "user-attachments/",
            "actions/", "marketplace/", "orgs/", "site/", "explore/", "collections/"
        ]
        IGNORED_SUFFIXES = [".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".badge"]

        for cand in outbound_repos:
            cand = cand.split("#")[0].rstrip("/")
            if cand.endswith(".git"):
                cand = cand[:-4]

            if any(cand.startswith(x) for x in IGNORED_PREFIXES) or any(cand.endswith(x) for x in IGNORED_SUFFIXES):
                continue

            parts = cand.split("/")
            if len(parts) != 2 or not parts[0] or not parts[1]:
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
        hn_queries = self.config.get("hn_queries", [])
        if not hn_queries:
            return

        print("\n--- [Eksplorasi Diskusi HackerNews] ---")
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
                        record_id = f"{self.domain_id}_hn_{hn_id}"
                        payload = {
                            "id": record_id,
                            "domain": self.domain_id,
                            "title": f"HN: {title}",
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
                        with open(os.path.join(self.raw_dir, f"{record_id}.json"), "w", encoding="utf-8") as f:
                            json.dump(payload, f, ensure_ascii=False, indent=2)

                    self.visited_articles.add(hn_id)
            except Exception as e:
                print(f"HN search error for '{q}': {e}")
