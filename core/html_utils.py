"""
HTML-to-Text Converter (stdlib-only, konsisten dengan filosofi proyek ini:
zero-dependency, gak nambah beban GitHub Actions runtime).

Dipakai buat ngolah halaman web (blog post, artikel security research) jadi
teks bersih yang bisa langsung dinilai SmartJudgeBot -- sama seperti README
GitHub, tanpa perlu jalur evaluasi terpisah.

Kunci desainnya: blok <pre>/<code> di HTML DIPERTAHANKAN dan dikonversi jadi
format fence markdown (```...```) SEBELUM tag lain di-strip. SmartJudgeBot
mendeteksi "kode implementasi nyata" lewat regex fence markdown
(lihat judge_engine.py baris ~47), jadi kalau blok kode di HTML dibiarkan
ke-strip jadi teks polos, Judge gak akan pernah menganggap artikel web
punya kode -- padahal snippet-nya ada, cuma hilang bentuknya.
"""

import re
import html as html_lib


def html_to_text(raw_html: str, max_chars: int = 20000) -> str:
    if not raw_html:
        return ""

    text = raw_html

    # 1. Amankan blok <pre>/<code> dulu -- ubah jadi fence markdown SEBELUM
    #    tag lain di-strip, biar Judge masih bisa mendeteksinya sebagai kode.
    def _fence_pre_block(match: "re.Match") -> str:
        inner = match.group(1)
        inner = re.sub(r"<[^>]+>", "", inner)  # buang tag nested (mis. <span> syntax highlight)
        inner = html_lib.unescape(inner)
        return f"\n```\n{inner.strip()}\n```\n"

    text = re.sub(r"<pre[^>]*>(.*?)</pre>", _fence_pre_block, text, flags=re.DOTALL | re.IGNORECASE)

    # 2. Buang elemen yang isinya bukan konten artikel (boilerplate/noise)
    for tag in ["script", "style", "nav", "header", "footer", "noscript", "svg", "form"]:
        text = re.sub(rf"<{tag}[^>]*>.*?</{tag}>", " ", text, flags=re.DOTALL | re.IGNORECASE)

    # 3. Baris baru di tempat yang wajar sebelum tag lain ikut hilang,
    #    supaya paragraf gak nge-blob jadi satu baris panjang.
    text = re.sub(r"</(p|div|h[1-6]|li|br|blockquote)>", "\n", text, flags=re.IGNORECASE)

    # 4. Strip semua tag HTML sisanya
    text = re.sub(r"<[^>]+>", " ", text)

    # 5. Decode entity (&amp; -> &, dst) dan rapikan whitespace
    text = html_lib.unescape(text)
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n\s*\n+", "\n\n", text)
    text = text.strip()

    return text[:max_chars]
