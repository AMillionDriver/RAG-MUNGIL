import os
import sys
import json
import re
import hashlib
from datetime import datetime
from typing import Set, List, Dict

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DOMAINS_DIR = os.path.join(BASE_DIR, "domains")
STORAGE_FINAL = os.path.join(BASE_DIR, "storage_final")
REGISTRY_FILE = os.path.join(STORAGE_FINAL, "registry.json")
MAX_HASHES_WINDOW = 5000

def get_content_hash(text: str) -> str:
    # Normalisasi teks: hilangkan spasi berlebih dan case
    clean = re.sub(r"\s+", " ", text.strip().lower())
    return hashlib.sha256(clean.encode("utf-8")).hexdigest()

def get_token_set(text: str) -> Set[str]:
    words = re.findall(r"\b[a-zA-Z0-9_]{3,}\b", text.lower())
    return set(words)

def jaccard_similarity(set1: Set[str], set2: Set[str]) -> float:
    """Mengukur kemiripan konten untuk membasmi fork / copy-paste."""
    if not set1 or not set2:
        return 0.0
    intersection = len(set1.intersection(set2))
    union = len(set1.union(set2))
    return intersection / union if union > 0 else 0.0

def load_registry() -> dict:
    if os.path.exists(REGISTRY_FILE):
        try:
            with open(REGISTRY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    # Skema flat: key domain_id langsung di top-level (BUKAN dibungkus "domains"),
    # supaya konsisten dengan cara process_domain()/main() membaca & menulisnya.
    return {
        "total_records": 0,
        "last_sync": "",
        "hashes": []
    }

def save_registry(data: dict):
    os.makedirs(STORAGE_FINAL, exist_ok=True)
    temp_file = REGISTRY_FILE + ".tmp"
    with open(temp_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(temp_file, REGISTRY_FILE)

def process_domain(domain_name: str, registry: dict) -> int:
    domain_dir = os.path.join(DOMAINS_DIR, domain_name)
    raw_dir = os.path.join(domain_dir, "raw")
    data_dir = os.path.join(domain_dir, "data")
    os.makedirs(data_dir, exist_ok=True)

    clean_file = os.path.join(data_dir, f"{domain_name}_clean.jsonl")

    # True FIFO/LRU Structure:
    # Gunakan Dict keys (Python 3.7+ strictly insertion-ordered) untuk lookup O(1)
    # sekaligus menjamin urutan kronologis yang akurat (bukan arbitrary set order)
    ordered_hashes: Dict[str, bool] = {h: True for h in registry.get("hashes", [])}
    existing_token_sets: List[Set[str]] = []

    # Baca file clean yang sudah ada jika ada untuk bangun token sets
    if os.path.exists(clean_file):
        with open(clean_file, "r", encoding="utf-8") as f:
            for line in f:
                try:
                    obj = json.loads(line)
                    existing_token_sets.append(get_token_set(obj.get("content", "")))
                except Exception:
                    pass

    if not os.path.exists(raw_dir):
        # Tidak ada artifact/raw item siklus ini (bisa karena job matrix domain
        # ini gagal, atau memang nol kandidat baru sehingga upload-artifact
        # tidak membuat apa-apa). Registry TETAP harus mencatat domain ini
        # dengan angka yang akurat dari clean_file yang sudah ada — supaya
        # frontend (src/lib/ragData.ts) yang menentukan daftar domain dari
        # Object.keys(registry) tidak diam-diam kehilangan domain yang datanya
        # sebenarnya masih utuh di disk, hanya karena siklus ini nihil.
        # last_updated sengaja TIDAK diubah di sini — itu representasi jujur
        # "kapan domain ini terakhir benar-benar disurvei", bukan basa-basi.
        if existing_token_sets or domain_name in registry:
            prev_entry = registry.get(domain_name, {})
            registry[domain_name] = {
                "last_updated": prev_entry.get("last_updated"),
                "total_records": len(existing_token_sets)
            }
        return 0, []

    added_count = 0
    new_records = []

    raw_files = [f for f in os.listdir(raw_dir) if f.endswith(".json")]
    for file_name in raw_files:
        file_path = os.path.join(raw_dir, file_name)
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue

        content = data.get("content", "")
        # 1. Exact Normal Hash via Insertion-Ordered Dict Lookup
        c_hash = get_content_hash(content)
        if c_hash in ordered_hashes:
            os.remove(file_path)
            continue

        # 2. Fuzzy Token Similarity Check (Basmi Fork & Copy-paste README)
        curr_tokens = get_token_set(content)
        is_fuzzy_duplicate = False
        for old_tokens in existing_token_sets:
            sim = jaccard_similarity(curr_tokens, old_tokens)
            if sim >= 0.82:  # Jika 82% kata-kata sama, anggap fork/duplikat
                is_fuzzy_duplicate = True
                break

        if is_fuzzy_duplicate:
            os.remove(file_path)
            continue

        # Format Fixed Core + Dynamic Metadata
        clean_record = {
            "id": data.get("id"),
            "domain": domain_name,
            "title": data.get("title"),
            "summary": data.get("summary"),
            "content": content,
            "source_url": data.get("source_url"),
            "created_at": data.get("created_at"),
            "metadata": data.get("metadata", {})
        }

        new_records.append(clean_record)
        # Tambahkan ke dictionary secara berurutan
        ordered_hashes[c_hash] = True
        existing_token_sets.append(curr_tokens)
        added_count += 1
        os.remove(file_path)

    # 3. Atomic Append ke file JSONL
    if new_records:
        temp_clean_file = clean_file + ".tmp"
        if os.path.exists(clean_file):
            with open(clean_file, "r", encoding="utf-8") as f_in, open(temp_clean_file, "w", encoding="utf-8") as f_out:
                f_out.write(f_in.read())
        
        with open(temp_clean_file, "a" if os.path.exists(temp_clean_file) else "w", encoding="utf-8") as f:
            for rec in new_records:
                f.write(json.dumps(rec, ensure_ascii=False) + "\n")
        
        os.replace(temp_clean_file, clean_file)

    # 4. True LRU Cap:
    # Karena ordered_hashes adalah dict insertion-ordered, list(ordered_hashes.keys())
    # menjamin urutan kronologis asli dari data tertua sampai terbaru.
    all_keys = list(ordered_hashes.keys())
    registry["hashes"] = all_keys[-MAX_HASHES_WINDOW:]

    # Catat status per-domain (bukan cuma agregat global) — dipakai frontend
    # (src/lib/ragData.ts) dan tooling lain untuk tahu kapan tiap situs
    # terakhir disurvei dan berapa total spesimennya masing-masing.
    registry[domain_name] = {
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "total_records": len(existing_token_sets)
    }
    return added_count, new_records

def main():
    registry = load_registry()
    total_added = 0
    summary_new_items = {}

    if os.path.exists(DOMAINS_DIR):
        for domain in sorted(os.listdir(DOMAINS_DIR)):
            domain_path = os.path.join(DOMAINS_DIR, domain)
            if os.path.isdir(domain_path) and not domain.startswith("."):
                added, domain_new_records = process_domain(domain, registry)
                if added > 0:
                    print(f"[{domain}] Terverifikasi & Ditambahkan: {added} materi Gold.")
                    summary_new_items[domain] = [
                        {
                            "id": r.get("id"),
                            "title": r.get("title"),
                            "source_url": r.get("source_url")
                        }
                        for r in domain_new_records
                    ]
                total_added += added

    # Total global dihitung ulang dari angka per-domain yang akurat (bukan
    # akumulasi total_added tiap run), supaya tidak pernah drift kalau nanti
    # ada record yang diarsipkan/dihapus di luar alur tambah-saja ini.
    registry["total_records"] = sum(
        v.get("total_records", 0) for k, v in registry.items()
        if isinstance(v, dict) and "total_records" in v
    )
    registry["last_sync"] = datetime.utcnow().isoformat() + "Z"
    save_registry(registry)

    # Simpan harvest_summary.json untuk notifikasi bot (Telegram / Webhook)
    summary_payload = {
        "total_added": total_added,
        "total_records": registry.get("total_records", 0),
        "new_items": summary_new_items,
        "timestamp": registry["last_sync"]
    }
    with open("harvest_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary_payload, f, indent=2)

    print(f"Pembersihan selesai! Total materi baru: {total_added}")

if __name__ == "__main__":
    main()
