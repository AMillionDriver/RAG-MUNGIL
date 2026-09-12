import json
import sys
import os
import re
import sqlite3
from typing import Tuple, Optional

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
DOMAINS_DIR = os.path.join(CURRENT_DIR, "domains")
CACHE_DB = os.path.join(CURRENT_DIR, "storage_final", "search_cache.db")

def sanitize_domain_name(domain: str) -> str:
    """Mencegah celah SQL injection bila domain dipassing dari CLI/user input."""
    if not re.match(r"^[a-zA-Z0-9_]+$", domain):
        raise ValueError(f"Domain name tidak valid: '{domain}'")
    return domain

def check_fts5_support(conn: sqlite3.Connection) -> bool:
    """
    Verifikasi dukungan FTS5 secara efisien.
    Hasil di-cache ke tabel sync_meta agar probe table tidak dibuat berulang tiap query.
    """
    cursor = conn.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS sync_meta (key TEXT PRIMARY KEY, value TEXT)")
    cursor.execute("SELECT value FROM sync_meta WHERE key = 'has_fts5'")
    cached = cursor.fetchone()
    if cached is not None:
        return cached[0] == "1"

    # Probe pertama kali
    is_supported = False
    try:
        cursor.execute("CREATE VIRTUAL TABLE IF NOT EXISTS _fts5_probe USING fts5(x)")
        cursor.execute("DROP TABLE IF EXISTS _fts5_probe")
        is_supported = True
    except sqlite3.OperationalError:
        is_supported = False

    cursor.execute("INSERT OR REPLACE INTO sync_meta VALUES ('has_fts5', ?)", ("1" if is_supported else "0",))
    conn.commit()
    return is_supported

def init_sqlite_index(domain: str = "01_rag_scraping") -> Tuple[Optional[sqlite3.Connection], bool]:
    """
    Membangun index SQLite.
    Prioritas 1: FTS5 Full-Text Search (O(1) Inverted Index & BM25 ranking).
    Fallback 2: Standard B-Tree SQLite Table (jika FTS5 tidak aktif di environment runner).
    Kompatibel mundur dari Python 3.8 hingga versi terbaru (typing.Tuple).
    """
    domain = sanitize_domain_name(domain)
    jsonl_path = os.path.join(DOMAINS_DIR, domain, "data", f"{domain}_clean.jsonl")
    if not os.path.exists(jsonl_path):
        return None, False

    os.makedirs(os.path.dirname(CACHE_DB), exist_ok=True)
    conn = sqlite3.connect(CACHE_DB)
    cursor = conn.cursor()

    has_fts5 = check_fts5_support(conn)

    cursor.execute("SELECT value FROM sync_meta WHERE key = ?", (f"{domain}_mtime",))
    row = cursor.fetchone()

    current_mtime = str(os.path.getmtime(jsonl_path))
    table_raw = f"{domain}_fts" if has_fts5 else f"{domain}_standard"
    table_quoted = f'"{table_raw}"'

    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_raw,))
    table_exists = cursor.fetchone()

    if row and row[0] == current_mtime and table_exists:
        return conn, has_fts5

    # Rebuild / Build Table
    cursor.execute(f"DROP TABLE IF EXISTS {table_quoted}")
    if has_fts5:
        cursor.execute(f"""
            CREATE VIRTUAL TABLE {table_quoted} USING fts5(
                id UNINDEXED,
                title,
                summary,
                content,
                source_url UNINDEXED,
                metadata_json UNINDEXED,
                tokenize = 'porter unicode61'
            )
        """)
    else:
        # Fallback tabel reguler jika modul FTS5 tidak ada di environment
        cursor.execute(f"""
            CREATE TABLE {table_quoted} (
                id TEXT PRIMARY KEY,
                title TEXT,
                summary TEXT,
                content TEXT,
                source_url TEXT,
                metadata_json TEXT
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
        f"INSERT INTO {table_quoted} (id, title, summary, content, source_url, metadata_json) VALUES (?, ?, ?, ?, ?, ?)",
        records_to_insert
    )
    cursor.execute("INSERT OR REPLACE INTO sync_meta VALUES (?, ?)", (f"{domain}_mtime", current_mtime))
    conn.commit()
    return conn, has_fts5

def search_rag(query: str, domain: str = "01_rag_scraping", limit: int = 6):
    domain = sanitize_domain_name(domain)
    conn, has_fts5 = init_sqlite_index(domain)
    if not conn:
        print(f"Data domain '{domain}' belum tersedia.")
        return

    cursor = conn.cursor()

    if has_fts5:
        table_quoted = f'"{domain}_fts"'
        clean_q = re.sub(r'[^\w\s-]', ' ', query).strip()
        fts_query = ' OR '.join(f'"{token}"' for token in clean_q.split() if len(token) > 1) or f'"{clean_q}"'
        try:
            cursor.execute(f"""
                SELECT id, title, summary, source_url, metadata_json
                FROM {table_quoted}
                WHERE {table_quoted} MATCH ?
                ORDER BY rank
                LIMIT ?
            """, (fts_query, limit))
            rows = cursor.fetchall()
            engine_name = "FTS5 Inverted Index (BM25)"
        except sqlite3.OperationalError:
            cursor.execute(f"""
                SELECT id, title, summary, source_url, metadata_json
                FROM {table_quoted}
                WHERE title LIKE ? OR summary LIKE ?
                LIMIT ?
            """, (f"%{query}%", f"%{query}%", limit))
            rows = cursor.fetchall()
            engine_name = "FTS5 Substring Fallback"
    else:
        # Fallback engine jika SQLite tanpa FTS5
        table_quoted = f'"{domain}_standard"'
        search_term = f"%{query}%"
        cursor.execute(f"""
            SELECT id, title, summary, source_url, metadata_json
            FROM {table_quoted}
            WHERE title LIKE ? OR summary LIKE ? OR content LIKE ?
            LIMIT ?
        """, (search_term, search_term, search_term, limit))
        rows = cursor.fetchall()
        engine_name = "Standard SQLite Table (FTS5 Unavailable)"

    print(f"\n🔍 Ditemukan {len(rows)} teknik relevan untuk '{query}' (Engine: {engine_name}):\n")

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
    d = sys.argv[2] if len(sys.argv) > 2 else "01_rag_scraping"
    search_rag(q, d)
