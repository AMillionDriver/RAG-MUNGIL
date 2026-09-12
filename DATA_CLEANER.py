import os
import json
import hashlib
from datetime import datetime

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DOMAINS_DIR = os.path.join(ROOT_DIR, "domains")
STORAGE_FINAL_DIR = os.path.join(ROOT_DIR, "storage_final")

def get_content_hash(text: str) -> str:
    """Menghasilkan hash SHA-256 untuk mendeteksi data duplikat."""
    return hashlib.sha256(text.strip().encode("utf-8")).hexdigest()

def clean_and_normalize():
    os.makedirs(STORAGE_FINAL_DIR, exist_ok=True)
    registry_path = os.path.join(STORAGE_FINAL_DIR, "registry.json")
    
    registry = {}
    if os.path.exists(registry_path):
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                registry = json.load(f)
        except Exception:
            registry = {}

    total_added_global = 0

    # Iterasi semua folder domain
    for domain_folder in os.listdir(DOMAINS_DIR):
        domain_path = os.path.join(DOMAINS_DIR, domain_folder)
        if not os.path.isdir(domain_path):
            continue

        raw_dir = os.path.join(domain_path, "raw")
        data_dir = os.path.join(domain_path, "data")
        os.makedirs(data_dir, exist_ok=True)

        target_clean_jsonl = os.path.join(data_dir, f"{domain_folder}_clean.jsonl")

        # Load data yang sudah ada untuk cek duplikasi
        existing_hashes = set()
        if os.path.exists(target_clean_jsonl):
            with open(target_clean_jsonl, "r", encoding="utf-8") as f:
                for line in f:
                    try:
                        record = json.loads(line)
                        if "content" in record:
                            existing_hashes.add(get_content_hash(record["content"]))
                    except Exception:
                        continue

        if not os.path.exists(raw_dir):
            continue

        raw_files = [f for f in os.listdir(raw_dir) if f.endswith(".json")]
        new_valid_records = []

        for rf in raw_files:
            file_path = os.path.join(raw_dir, rf)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    item = json.load(f)

                # Validasi Fixed Core Envelop
                content = item.get("content", "").strip()
                title = item.get("title", "").strip()

                # Filter data sampah: terlalu pendek, kosong, atau halaman block
                if len(content) < 80 or len(title) < 5:
                    os.remove(file_path)
                    continue

                if "Just a moment..." in content or "403 Forbidden" in content:
                    os.remove(file_path)
                    continue

                c_hash = get_content_hash(content)
                if c_hash in existing_hashes:
                    os.remove(file_path) # Hapus file raw karena sudah pernah ada
                    continue

                # Normalisasi Record Sesuai Standar Fixed + Dynamic Metadata
                clean_record = {
                    "id": item.get("id", f"{domain_folder}_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{len(new_valid_records)}"),
                    "domain": item.get("domain", domain_folder),
                    "title": title,
                    "content": content,
                    "summary": item.get("summary", title),
                    "source_url": item.get("source_url", ""),
                    "created_at": item.get("created_at", datetime.utcnow().isoformat() + "Z"),
                    "metadata": item.get("metadata", {})
                }

                new_valid_records.append(clean_record)
                existing_hashes.add(c_hash)
                os.remove(file_path) # Raw sudah diproses, hapus agar disk hemat

            except Exception as e:
                print(f"Error parsing {file_path}: {e}")
                continue

        # Append data bersih ke file final
        if new_valid_records:
            with open(target_clean_jsonl, "a", encoding="utf-8") as f:
                for rec in new_valid_records:
                    f.write(json.dumps(rec, ensure_ascii=False) + "\n")
            print(f"[{domain_folder}] Berhasil menambahkan {len(new_valid_records)} materi baru.")
            total_added_global += len(new_valid_records)

        # Update registry status
        registry[domain_folder] = {
            "last_updated": datetime.utcnow().isoformat() + "Z",
            "total_records": len(existing_hashes)
        }

    # Simpan manifest
    with open(registry_path, "w", encoding="utf-8") as f:
        json.dump(registry, f, indent=2)

    print(f"Selesai! Total record baru global: {total_added_global}")

if __name__ == "__main__":
    clean_and_normalize()