import os
import sys
import json
import argparse
from typing import Dict, Any
from core.judge_engine import SmartJudgeBot
from core.explorer_engine import AutonomousExplorer, ResilientHttpClient

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAINS_DIR = os.path.join(BASE_DIR, "domains")

def run_github_seeds_adapter(explorer: AutonomousExplorer, http: ResilientHttpClient, config: Dict[str, Any]):
    seeds = config.get("seeds", [])
    if not seeds:
        return
    print("\n--- [Source Adapter: GitHub Curated Seeds] ---")
    for seed in seeds:
        repo_name = seed.get("repo")
        if not repo_name:
            continue
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
                    custom_topic=seed.get("topic", "")
                )
            except Exception as e:
                print(f"Gagal memproses seed {repo_name}: {e}")

def run_github_search_adapter(explorer: AutonomousExplorer, http: ResilientHttpClient, config: Dict[str, Any]):
    stratified_queries = explorer.generate_stratified_queries(count=5)
    if not stratified_queries:
        return
    print("\n--- [Source Adapter: Stratified GitHub Search] ---")
    print(f"Queries siklus ini: {stratified_queries}")
    explorer.explore_github_search(stratified_queries)

def run_hackernews_adapter(explorer: AutonomousExplorer, http: ResilientHttpClient, config: Dict[str, Any]):
    hn_queries = config.get("hn_queries", [])
    if not hn_queries:
        return
    print("\n--- [Source Adapter: HackerNews Technical Discussions] ---")
    explorer.explore_hackernews()

SOURCE_ADAPTER_REGISTRY = {
    "github_seeds": run_github_seeds_adapter,
    "github_search": run_github_search_adapter,
    "hackernews": run_hackernews_adapter
}

def run_crawler_for_domain(domain_id: str):
    domain_dir = os.path.join(DOMAINS_DIR, domain_id)
    config_file = os.path.join(domain_dir, "config.json")

    if not os.path.exists(config_file):
        raise FileNotFoundError(f"Config domain tidak ditemukan: {config_file}")

    with open(config_file, "r", encoding="utf-8") as f:
        config = json.load(f)

    github_token = os.environ.get("GITHUB_TOKEN", "")
    http = ResilientHttpClient(token=github_token, timeout=20)
    judge = SmartJudgeBot(config=config)
    explorer = AutonomousExplorer(http=http, judge=judge, config=config, domain_dir=domain_dir)

    print("==========================================================")
    print(f"🚀 [RAG-MUNGIL] PLUG-IN DRIVEN HARVESTER: {config.get('domain_label', domain_id)}")
    print(f"📁 Domain ID: {domain_id} | Threshold: {config.get('accept_threshold', 75)} pts")
    recency_mode = "Temporal Sensitive" if judge.recency_sensitive else "Evergreen Canonical"
    print(f"⏱️ Recency Mode: {recency_mode} | Min Words: {judge.min_word_count}")
    print("==========================================================")

    # Sumber-sumber ingestion yang aktif untuk domain ini
    enabled_sources = config.get("enabled_sources", ["github_seeds", "github_search", "hackernews"])

    for source_id in enabled_sources:
        adapter = SOURCE_ADAPTER_REGISTRY.get(source_id)
        if adapter:
            try:
                adapter(explorer, http, config)
            except Exception as e:
                print(f"⚠️ Error pada adapter '{source_id}': {e}")
        else:
            print(f"⚠️ Source adapter '{source_id}' belum terdaftar di SOURCE_ADAPTER_REGISTRY.")

    # Simpan State Riwayat
    explorer.save_state()
    print(f"\n🎉 Siklus penjelajahan domain '{domain_id}' selesai!")

def main():
    parser = argparse.ArgumentParser(description="Generic RAG-Mungil Harvester Runner")
    parser.add_argument("--domain", type=str, default="01_rag_scraping", help="ID domain yang ingin diharvest")
    args = parser.parse_args()

    run_crawler_for_domain(args.domain)

if __name__ == "__main__":
    main()
