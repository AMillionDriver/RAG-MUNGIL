import re
from typing import Dict, Any, Tuple, List

class SmartJudgeBot:
    """
    Bot Judge pintar berbasis multi-faktor heuristik untuk memvalidasi materi scraping:
    - Menilai kedalaman teknis (TLS, JA3/JA4, Browser Fingerprint, WAF).
    - Memastikan ada kode implementasi nyata.
    - Menendang konten sampah (spam proxy, promosi SaaS, tutorial hello-world, template kosong).
    """

    TECHNICAL_KEYWORDS = {
        # TLS & Network level
        "tls": 10, "ja3": 15, "ja4": 15, "handshake": 10, "cipher": 10,
        "alpn": 10, "http2": 8, "curl-cffi": 15, "tls-client": 15,
        "impersonate": 10,

        # Browser & Fingerprint evasion
        "cdp": 12, "devtools": 8, "canvas": 10, "webgl": 10, "audiobuffer": 10,
        "font enumeration": 10, "navigator.webdriver": 15, "stealth": 10,
        "camoufox": 15, "playwright-stealth": 12, "selenium-stealth": 10,
        "nodriver": 12, "drissionpage": 12, "undetected": 10,

        # WAF & Challenge Targets
        "turnstile": 15, "cloudflare": 8, "datadome": 15, "akamai": 15,
        "kasada": 15, "perimeterx": 15, "incapsula": 12, "recaptcha": 8,
        "antibot": 10, "anti-bot": 10, "bot detection": 10
    }

    SPAM_PATTERNS = [
        r"buy\s+(?:cheap|residential|mobile)\s+prox(?:y|ies)",
        r"coupon\s+code",
        r"discount\s+\d+%",
        r"promo\s+code",
        r"pricing\s+starts\s+at\s+\$",
        r"sign\s+up\s+for\s+(?:our|a)\s+free\s+trial",
        r"best\s+proxy\s+provider\s+of\s+202",
        r"affiliate\s+link",
    ]

    NOOB_PATTERNS = [
        r"quotes\.toscrape\.com",
        r"books\.toscrape\.com",
        r"scrape\s+quotes\s+with\s+beautifulsoup",
        r"my\s+first\s+python\s+scraper"
    ]

    def __init__(self, accept_threshold: int = 65):
        self.accept_threshold = accept_threshold

    def evaluate(self, title: str, content: str, metadata: Dict[str, Any] = None) -> Tuple[bool, int, List[str]]:
        if metadata is None:
            metadata = {}

        score = 0
        reasons = []
        content_lower = content.lower()
        title_lower = title.lower()

        # 1. Pengecekan Batas Minimum Konten
        word_count = len(content.split())
        if word_count < 100:
            return False, 0, ["DITOLAK: Konten terlalu pendek (< 100 kata) / kemungkinan template kosong."]

        if word_count > 300:
            score += 15
            reasons.append(f"Substansi teks memadai ({word_count} kata) (+15)")

        # 2. Filter Spam & Komersial / Promosi Jasa
        for pat in self.SPAM_PATTERNS:
            if re.search(pat, content_lower):
                score -= 60
                reasons.append(f"PENALTI SPAM: Terdeteksi promosi jasa/proxy komersial (-60)")
                break

        # 3. Filter Tutorial Hello-World / Pemula Tanpa Anti-Bot
        for pat in self.NOOB_PATTERNS:
            if re.search(pat, content_lower):
                score -= 50
                reasons.append(f"PENALTI NOOB: Tutorial scraping dasar tanpa teknik anti-bot (-50)")
                break

        # 4. Pengecekan Blok Kode Implementasi
        code_blocks = re.findall(r"```(?:python|py|javascript|js|bash|sh|go|cpp)?\n(.*?)```", content, re.DOTALL)
        meaningful_code_count = 0
        for block in code_blocks:
            lines = [l for l in block.strip().split("\n") if l.strip() and not l.strip().startswith("#")]
            if len(lines) >= 4:
                meaningful_code_count += 1

        if meaningful_code_count > 0:
            code_points = min(meaningful_code_count * 12, 35)
            score += code_points
            reasons.append(f"Terdapat {meaningful_code_count} blok kode implementasi valid (+{code_points})")
        else:
            reasons.append("Peringatan: Tidak ditemukan blok kode yang nyata (0 poin kode)")

        # 5. Penilaian Kosakata Teknis Mendalam (Max 40 poin)
        matched_terms = []
        term_score = 0
        for term, weight in self.TECHNICAL_KEYWORDS.items():
            if term in content_lower or term in title_lower:
                matched_terms.append(term)
                term_score += weight

        capped_term_score = min(term_score, 40)
        score += capped_term_score
        if matched_terms:
            reasons.append(f"Terminologi anti-bot tingkat lanjut ({', '.join(matched_terms[:6])}) (+{capped_term_score})")

        # 6. Repositori Metrik (Bintang / Relevansi GitHub)
        stars = metadata.get("stars", 0)
        if stars >= 50:
            score += 15
            reasons.append(f"Repositori terverifikasi populer ({stars} stars) (+15)")
        elif stars >= 5:
            score += 10
            reasons.append(f"Repositori aktif ({stars} stars) (+10)")

        is_accepted = score >= self.accept_threshold
        status_label = "DITERIMA" if is_accepted else "DITOLAK"
        reasons.insert(0, f"Keputusan: {status_label} (Skor Akhir: {score}/{self.accept_threshold})")

        return is_accepted, score, reasons
