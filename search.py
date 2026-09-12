import json
import sys
import os

def search_rag(query: str, domain: str = "01_rag_scraping"):
    file_path = os.path.join("domains", domain, "data", f"{domain}_clean.jsonl")
    if not os.path.exists(file_path):
        print(f"File database {file_path} belum ditemukan.")
        return

    query = query.lower()
    results = []

    with open(file_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            item = json.loads(line)
            searchable = f"{item.get('title', '')} {item.get('summary', '')} {item.get('content', '')}".lower()
            if query in searchable:
                results.append(item)

    print(f"\n🔍 Ditemukan {len(results)} teknik untuk pencarian '{query}':\n")
    for idx, r in enumerate(results[:5], 1):
        print(f"{idx}. 📌 {r.get('title')}")
        print(f"   🔗 Source: {r.get('source_url')}")
        print(f"   💡 Summary: {r.get('summary')}")
        meta = r.get("metadata", {})
        if "bypassed_wafs" in meta:
            print(f"   🛡️ Target WAFs: {', '.join(meta['bypassed_wafs'])}")
        snippets = meta.get("code_snippets", [])
        if snippets:
            print(f"   💻 Code Snippet:\n   " + snippets[0].replace("\n", "\n   "))
        print("-" * 60)

if __name__ == "__main__":
    q = sys.argv[1] if len(sys.argv) > 1 else "cloudflare"
    search_rag(q)
