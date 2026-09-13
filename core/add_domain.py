"""
core/add_domain.py
==================
Scaffolding & Generator Tool untuk menambah Domain Baru di RAG-MUNGIL.
Menyederhanakan penambahan domain baru secara otomatis:
  1. Membuat struktur folder `domains/<domain_id>/`
  2. Menghasilkan `config.json` deklaratif standar
  3. Mendaftarkan domain ke matrix `.github/workflows/harvest.yml` secara otomatis

Penggunaan:
  python -m core.add_domain --id 02_smart_contract_exploits --label "Smart Contract Exploits"
"""

import os
import sys
import json
import re
import argparse
from typing import List, Dict, Any

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOMAINS_DIR = os.path.join(BASE_DIR, "domains")
WORKFLOW_FILE = os.path.join(BASE_DIR, ".github", "workflows", "harvest.yml")

def sanitize_domain_id(domain_id: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", domain_id.strip().lower())
    if not cleaned:
        raise ValueError("Domain ID tidak boleh kosong.")
    return cleaned

def generate_default_config(domain_id: str, label: str, threshold: int, recency: bool) -> Dict[str, Any]:
    return {
        "domain_id": domain_id,
        "domain_label": label,
        "accept_threshold": threshold,
        "min_word_count": 100,
        "code_over_text_tolerance": True,
        "scoring_strategy": {
            "recency_sensitive": recency,
            "evergreen_bonus": not recency
        },
        "ingestion_targets": {
            "primary": "README.md",
            "source_file_patterns": [],
            "max_source_files": 0
        },
        "enabled_sources": [
            "github_seeds",
            "github_search",
            "hackernews"
        ],
        "seeds": [
            {
                "repo": "example/sample-repo",
                "topic": f"Curated Foundation for {label}"
            }
        ],
        "stratified_query_templates": [
            f"\"{domain_id.replace('_', ' ')}\" stars:5..1000",
            f"\"{label}\" technique tutorial"
        ],
        "template_variables": {},
        "hn_queries": [
            domain_id.replace('_', ' '),
            label.lower()
        ],
        "target_waf_tags": [],
        "actionable_code_signatures": [
            "def ", "class ", "import ", "function", "contract "
        ],
        "dummy_code_patterns": [
            "hello world"
        ],
        "technical_keywords": {
            label.lower(): 20
        },
        "spam_patterns": [
            "buy\\s+now",
            "discount\\s+\\d+%",
            "promo\\s+code",
            "affiliate\\s+link"
        ]
    }

def register_domain_in_workflow(domain_id: str) -> bool:
    if not os.path.exists(WORKFLOW_FILE):
        print(f"⚠️ File workflow {WORKFLOW_FILE} tidak ditemukan. Silakan tambahkan manual.")
        return False

    with open(WORKFLOW_FILE, "r", encoding="utf-8") as f:
        content = f.read()

    # Cek apakah domain sudah ada dalam file workflow
    if f"- {domain_id}" in content:
        print(f"ℹ️ Domain '{domain_id}' sudah terdaftar di workflow matrix.")
        return True

    # Cari blok matrix domain
    pattern = r"(matrix:\s*\n\s*domain:\s*\n)((?:\s*-\s*[\w\d_-]+\s*\n)+)"
    match = re.search(pattern, content)
    if match:
        existing_list = match.group(2)
        indent = "          "
        new_entry = f"{indent}- {domain_id}\n"
        updated_content = content[:match.end(1)] + existing_list + new_entry + content[match.end():]
        with open(WORKFLOW_FILE, "w", encoding="utf-8") as f:
            f.write(updated_content)
        print(f"✅ Berhasil mendaftarkan '{domain_id}' ke dalam matrix `.github/workflows/harvest.yml`!")
        return True
    else:
        print(f"⚠️ Gagal mencocokkan pattern matrix di {WORKFLOW_FILE}. Silakan tambahkan manual.")
        return False

def create_domain(domain_id: str, label: str, threshold: int = 75, recency: bool = True, update_workflow: bool = True):
    domain_id = sanitize_domain_id(domain_id)
    target_dir = os.path.join(DOMAINS_DIR, domain_id)

    if os.path.exists(target_dir):
        print(f"⚠️ Direktori domain '{target_dir}' sudah ada!")
    else:
        os.makedirs(os.path.join(target_dir, "raw"), exist_ok=True)
        os.makedirs(os.path.join(target_dir, "data"), exist_ok=True)
        print(f"📁 Membuat direktori domain: {target_dir}")

    config_path = os.path.join(target_dir, "config.json")
    if not os.path.exists(config_path):
        config_data = generate_default_config(domain_id, label, threshold, recency)
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(config_data, f, indent=2, ensure_ascii=False)
        print(f"📄 Menghasilkan config deklaratif: {config_path}")
    else:
        print(f"ℹ️ Config '{config_path}' sudah ada, tidak ditimpa.")

    # Buat backward-compatible wrapper crawler.py
    crawler_wrapper = os.path.join(target_dir, "crawler.py")
    if not os.path.exists(crawler_wrapper):
        with open(crawler_wrapper, "w", encoding="utf-8") as f:
            f.write(f'''"""
Backward-compatibility adapter for {domain_id}.
Mengarahkan eksekusi ke core generic engine secara seamless.
"""
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.crawler_engine import run_crawler_for_domain

def main():
    run_crawler_for_domain("{domain_id}")

if __name__ == "__main__":
    main()
''')
        print(f"📄 Menghasilkan wrapper crawler: {crawler_wrapper}")

    if update_workflow:
        register_domain_in_workflow(domain_id)

    print(f"\n🎉 Domain '{domain_id}' ({label}) siap digunakan!")
    print(f"💡 Untuk uji coba lokal:")
    print(f"   python -m core.crawler_engine --domain {domain_id}")

def main():
    parser = argparse.ArgumentParser(description="Tool Penambah Domain Baru RAG-MUNGIL")
    parser.add_argument("--id", type=str, required=True, help="ID domain (contoh: 02_smart_contract_exploits)")
    parser.add_argument("--label", type=str, default="", help="Label deskriptif domain")
    parser.add_argument("--threshold", type=int, default=75, help="Ambang batas skor kelulusan (default: 75)")
    parser.add_argument("--evergreen", action="store_true", help="Gunakan mode evergreen (bukan temporal/recency)")
    parser.add_argument("--skip-workflow", action="store_true", help="Jangan update file harvest.yml")

    args = parser.parse_args()
    label = args.label if args.label else args.id.replace("_", " ").title()
    create_domain(
        domain_id=args.id,
        label=label,
        threshold=args.threshold,
        recency=not args.evergreen,
        update_workflow=not args.skip_workflow
    )

if __name__ == "__main__":
    main()
