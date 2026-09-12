import json
import sys
import os
import re
import sqlite3

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DOMAINS_DIR = os.path.join(CURRENT_DIR, "domains")
CACHE_DB = os.path.join(CURRENT_DIR, "storage_final", "search_cache.db")

def sanitize_domain_name(domain: str) -> str:
    """Mencegah celah SQL injection bila domain dipassing dari CLI/user input."""
    if not re.match(r"^[a-zA-Z0-9_]+$", domain):
        raise ValueError(f"Domain name tidak valid: '{domain}'")
    return domain

def init_sqlite_fts_index(domain: str = "01_rag_scraping") -> sqlite3.Connection:
    """
    Membangun index SQLite Full-Text Search (FTS5) berkecepatan tinggi (BM25 ranking).
    Pencarian full-text berkecepatan O(1) indeks terbalik, bukan O(N) full-table scan.
    """
    domain = sanitize_domain_name(domain)
    jsonl_path = os.path.join(DOMAINS_DIR, domain, "data", f"{domain}_clean.jsonl")
    if not os.path.exists(jsonl_path):
        return None

    os.makedirs(os.path.dirname(CACHE_DB), exist_ok=True)
    conn = sqlite3.connect(CACHE_DB)
    cursor = conn.cursor()

    # Cek sinkronisasi file
    cursor.execute("CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT)")
    cursor.execute("SELECT value FROM sync_meta WHERE key = ?", (f"{domain}_mtime",))
    row = cursor.fetchone()

    current_mtime = str(os.path.getmtime(jsonl_path))
    table_name = f'"{domain}_fts"'

    # Periksa apakah tabel FTS sudah ada
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (f"{domain}_fts",))
    fts_exists = cursor.fetchone()

    if row and row[0] == current_mtime and fts_exists:
        return conn

    # Bangun Virtual Table FTS5 untuk pencarian full-text sejati
    cursor.execute(f"DROP TABLE IF EXISTS {table_name}")
    cursor.execute(f"""
        CREATE VIRTUAL TABLE {table_name} USING fts5(
            id UNINDEXED,
            title,
            summary,
            content,
            source_url UNINDEXED,
            metadata_json UNINDEXED,
            tokenize = 'porter unicode61'
        )
    """)

    records_to_insert = []
    with open(jsonl_path, "r", encoding="utf-8") as f:
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
        f"INSERT INTO {table_name} (id, title, summary, content, source_url, metadata_json) VALUES (?, ?, ?, ?, ?, ?)",
        records_to_insert
    )
    cursor.execute("INSERT OR REPLACE INTO sync_meta VALUES (?, ?)", (f"{domain}_mtime", current_mtime))
    conn.commit()
    return conn

def search_rag(query: str, domain: str = "01_rag_scraping", limit: int = 6):
    domain = sanitize_domain_name(domain)
    conn = init_sqlite_fts_index(domain)
    if not conn:
        print(f"Data domain '{domain}' belum tersedia.")
        return

    cursor = conn.cursor()
    table_name = f'"{domain}_fts"'

    # Sanitasi query untuk FTS5 query syntax
    clean_q = re.sub(r'[^\w\s-]', ' ', query).strip()
    if not clean_q:
        clean_q = query

    fts_query = ' OR '.join(f'"{token}"' for token in clean_q.split() if len(token) > 1)
    if not fts_query:
        fts_query = f'"{clean_q}"'

    try:
        # Gunakan MATCH dengan FTS5 BM25 relevance ranking
        cursor.execute(f"""
            SELECT id, title, summary, source_url, metadata_json, rank
            FROM {table_name}
            WHERE {table_name} MATCH ?
            ORDER BY rank
            LIMIT ?
        """, (fts_query, limit))
        rows = cursor.fetchall()
    except sqlite3.OperationalError:
        # Fallback jika sintaks query kompleks
        cursor.execute(f"""
            SELECT id, title, summary, source_url, metadata_json, 0 as rank
            FROM {table_name}
            WHERE title LIKE ? OR summary LIKE ?
            LIMIT ?
        """, (f"%{query}%", f"%{query}%", limit))
        rows = cursor.fetchall()

    print(f"\n🔍 Ditemukan {len(rows)} teknik relevan untuk '{query}' (via FTS5 Inverted Index Engine):\n")

    for idx, (rid, title, summary, source_url, meta_json, rank) in enumerate(rows, 1):
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
    d = sys.argv[2] if len(sys.argv) > 2 else "01_rag_scraping"
    search_rag(q, d)
