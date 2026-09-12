import json
import sys
import os
import sqlite3

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DOMAINS_DIR = os.path.join(CURRENT_DIR, "domains")
CACHE_DB = os.path.join(CURRENT_DIR, "storage_final", "search_cache.db")

def init_sqlite_index(domain: str = "01_rag_scraping"):
    """
    Membangun index SQLite secara otomatis jika belum ada
    atau jika file JSONL diperbarui. Pencarian jadi instan (0.001 detik).
    """
    jsonl_path = os.path.join(DOMAINS_DIR, domain, "data", f"{domain}_clean.jsonl")
    if not os.path.exists(jsonl_path):
        return None

    os.makedirs(os.path.dirname(CACHE_DB), exist_ok=True)
    conn = sqlite3.connect(CACHE_DB)
    cursor = conn.cursor()

    # Tabel meta sinkronisasi
    cursor.execute("CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT)")
    cursor.execute("SELECT value FROM sync_meta WHERE key = ?", (f"{domain}_mtime",))
    row = cursor.fetchone()

    current_mtime = str(os.path.getmtime(jsonl_path))
    if row and row[0] == current_mtime:
        return conn

    # Gunakan nama tabel yang aman dengan escape tanda petik
    cursor.execute(f'DROP TABLE IF EXISTS "{domain}_records"')
    cursor.execute(f"""
        CREATE TABLE "{domain}_records" (
            id TEXT PRIMARY KEY,
            title TEXT,
            summary TEXT,
            content TEXT,
            source_url TEXT,
            metadata_json TEXT
        )
    """)

    with open(jsonl_path, "r", encoding="utf-8") as f:
        records_to_insert = []
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            records_to_insert.append((
                item.get("id"),
                item.get("title", ""),
                item.get("summary", ""),
                item.get("content", ""),
                item.get("source_url", ""),
                json.dumps(item.get("metadata", {}), ensure_ascii=False)
            ))

    cursor.executemany(
        f'INSERT OR REPLACE INTO "{domain}_records" VALUES (?, ?, ?, ?, ?, ?)',
        records_to_insert
    )
    cursor.execute("INSERT OR REPLACE INTO sync_meta VALUES (?, ?)", (f"{domain}_mtime", current_mtime))
    conn.commit()
    return conn

def search_rag(query: str, domain: str = "01_rag_scraping"):
    conn = init_sqlite_index(domain)
    if not conn:
        print(f"Data domain '{domain}' belum tersedia.")
        return

    cursor = conn.cursor()
    search_term = f"%{query}%"

    cursor.execute(f"""
        SELECT id, title, summary, source_url, metadata_json
        FROM "{domain}_records"
        WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?
        LIMIT 6
    """, (search_term, search_term, search_term))

    rows = cursor.fetchall()
    print(f"\n🔍 Ditemukan {len(rows)} teknik relevan untuk '{query}' (via Indexed SQLite Engine):\n")

    for idx, (rid, title, summary, source_url, meta_json) in enumerate(rows, 1):
        meta = json.loads(meta_json) if meta_json else {}
        print(f"{idx}. 📌 {title}")
        print(f"   🔗 Source: {source_url}")
        print(f"   💡 Summary: {summary}")
        if "bypassed_wafs" in meta:
            print(f"   🛡️ Target WAFs: {', '.join(meta['bypassed_wafs'])}")
        snippets = meta.get("code_snippets", [])
        if snippets:
            print(f"   💻 Code Snippet:\n   " + snippets[0].replace("\n", "\n   "))
        print("-" * 65)

    conn.close()

if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "cloudflare"
    search_rag(q)
