"""
Backfill content_tier ke record yang udah ada sebelum field ini ditambahin.
Idempotent -- aman dijalanin berkali-kali, cuma nulis ulang kalau ada
perubahan beneran. Berguna lagi nanti kalau ada field metadata baru lain
yang perlu di-backfill ke corpus lama.

Pakai: python core/backfill_content_tier.py
"""
import os
import sys
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from DATA_CLEANER import infer_content_tier, DOMAINS_DIR


def backfill_domain(domain_id: str) -> int:
    clean_file = os.path.join(DOMAINS_DIR, domain_id, "data", f"{domain_id}_clean.jsonl")
    if not os.path.exists(clean_file):
        return 0

    records = []
    changed = 0
    with open(clean_file, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            record = json.loads(line)
            meta = record.get("metadata", {})
            if "content_tier" not in meta:
                meta["content_tier"] = infer_content_tier(meta)
                record["metadata"] = meta
                changed += 1
            records.append(record)

    if changed > 0:
        tmp_file = clean_file + ".tmp"
        with open(tmp_file, "w", encoding="utf-8") as f:
            for r in records:
                f.write(json.dumps(r, ensure_ascii=False) + "\n")
        os.replace(tmp_file, clean_file)

    return changed


def main():
    if not os.path.isdir(DOMAINS_DIR):
        print("Direktori domains/ tidak ditemukan.")
        return

    total_changed = 0
    for domain_id in sorted(os.listdir(DOMAINS_DIR)):
        changed = backfill_domain(domain_id)
        if changed > 0:
            print(f"[{domain_id}] {changed} record di-backfill content_tier-nya.")
        total_changed += changed

    print(f"\nSelesai. Total {total_changed} record diperbarui.")


if __name__ == "__main__":
    main()
