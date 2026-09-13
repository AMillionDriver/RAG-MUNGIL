"""
Telegram Notification Engine for RAG-MUNGIL.
Dispatched from GitHub Actions when new gold-tier techniques are committed.
Supports graceful fallback if tokens are not configured in repository secrets.

Exit code contract:
  0 -> notifikasi terkirim sukses, ATAU sengaja di-skip (kredensial belum diisi
       / tidak ada item baru ronde ini). Kondisi ini bukan error.
  1 -> notifikasi GAGAL terkirim padahal seharusnya terkirim (kredensial ada,
       ada item baru, tapi Telegram API menolak/timeout). Ini ditandai gagal
       supaya GitHub Actions menampilkan status merah, bukan "success" palsu.
"""

import os
import sys
import json
import urllib.request
import urllib.parse
from typing import Dict, List, Any


def send_telegram_notification(summary_file: str = "harvest_summary.json") -> None:
    bot_token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    chat_id = os.environ.get("TELEGRAM_CHAT_ID", "").strip()
    commit_sha = os.environ.get("GITHUB_SHA", "")[:7]
    repo_name = os.environ.get("GITHUB_REPOSITORY", "AMillionDriver/RAG-MUNGIL")

    if not bot_token or not chat_id:
        print("ℹ️ Telegram credentials not provided (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID). Skipping notification.")
        return

    # Baca ringkasan perubahan jika ada
    new_items_by_domain: Dict[str, List[Dict[str, str]]] = {}
    total_added = 0
    total_records = 0

    if os.path.exists(summary_file):
        try:
            with open(summary_file, "r", encoding="utf-8") as f:
                summary_data = json.load(f)
                new_items_by_domain = summary_data.get("new_items", {})
                total_added = summary_data.get("total_added", 0)
                total_records = summary_data.get("total_records", 0)
        except Exception as e:
            print(f"⚠️ Error reading summary file: {e}")

    # Cek registry.json untuk fallback total data
    if total_records == 0 and os.path.exists("storage_final/registry.json"):
        try:
            with open("storage_final/registry.json", "r", encoding="utf-8") as f:
                reg = json.load(f)
                total_records = sum(d.get("total_records", 0) for d in reg.values())
        except Exception:
            pass

    if total_added == 0:
        print("ℹ️ No new techniques added in this run. Suppressing Telegram ping to avoid channel spam.")
        return

    # Susun pesan dengan format Markdown
    lines = [
        "🏺 *RAG-MUNGIL AUTO-HARVEST REPORT*",
        "━━━━━━━━━━━━━━━━━━━━━",
        f"✨ *{total_added} Teknik Baru Berhasil Di-Harvest!*",
        ""
    ]

    for domain_id, items in new_items_by_domain.items():
        domain_title = domain_id.replace("_", " ").upper()
        lines.append(f"📦 *{domain_title}* ({len(items)} items):")
        for item in items[:6]:  # Tampilkan maks 6 item teratas per domain agar pesan compact
            title = item.get("title", "Untitled Technique").replace("*", "\\*").replace("_", "\\_")
            source = item.get("source_url", "").replace("https://github.com/", "")
            lines.append(f"• *{title}*")
            if source:
                lines.append(f"  ↳ `gh:{source}`")
        if len(items) > 6:
            lines.append(f"  _...dan {len(items) - 6} teknik lainnya_")
        lines.append("")

    lines.append("━━━━━━━━━━━━━━━━━━━━━")
    if total_records > 0:
        lines.append(f"📊 *Total Corpus Gold:* `{total_records}` records")
    if commit_sha:
        lines.append(f"🔗 [Lihat Commit {commit_sha}](https://github.com/{repo_name}/commit/{commit_sha})")

    message_text = "\n".join(lines)

    # Kirim ke Telegram API
    telegram_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message_text,
        "parse_mode": "Markdown",
        "disable_web_page_preview": True
    }

    req = urllib.request.Request(
        telegram_url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            if resp.status == 200:
                print(f"✅ Telegram notification sent successfully to chat ID {chat_id}!")
            else:
                # Status non-200 tanpa exception itu tetep kegagalan pengiriman
                print(f"⚠️ Telegram API returned status {resp.status}")
                sys.exit(1)
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="ignore")
        print(f"❌ Failed to send Telegram notification (HTTP {e.code}): {err_body}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error sending Telegram notification: {e}")
        sys.exit(1)


if __name__ == "__main__":
    send_telegram_notification()
