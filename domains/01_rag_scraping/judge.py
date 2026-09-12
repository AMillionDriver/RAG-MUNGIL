import re
from datetime import datetime
from typing import Dict, Any, Tuple, List

class SmartJudgeBot:
    """
    Bot Judge V4.0:
    - Temporal Recency Awareness (WAF bypasses expire fast).
    - Code Semantic Verification (Checks for real evasion calls, not just backticks).
    - Strict Heuristic Anti-Spam & Anti-Noob Gatekeeper.
    - Raised Threshold to 75 (Gold-Standard Only).
    """

    # Library & fungsi wajib yang membuktikan ini KODE EVASION ASLI
    ACTIONABLE_CODE_SIGNATURES = [
        r"curl_cffi", r"impersonate\s*=", r"tls_client", r"camoufox",
        r"selenium_stealth", r"stealth\(", r"nodriver", r"drissionpage",
        r"undetected_chromedriver", r"cdp\.", r"chrome_options\.add_argument",
        r"puppeteer-extra-plugin-stealth", r"playwright_stealth",
        r"ja3", r"ja4", r"ssl_context", r"ciphers\s*=", r"turnstile",
        r"navigator\.webdriver", r"user-agent", r"bypass", r"datadome"
    ]

    # Jebakan tutorial pemula
    DUMMY_CODE_PATTERNS = [
        r"requests\.get\(['\"][^'\"]+['\"]\)\s*$", # requests polos tanpa headers/ciphers
        r"BeautifulSoup\([^,]+,\s*['\"]html\.parser['\"]\)", # BS4 polos
        r"quotes\.toscrape\.com",
        r"books\.toscrape\.com"
    ]

    TECHNICAL_KEYWORDS = {
        # TLS & Fingerprinting
        "ja3": 15, "ja4": 15, "tls fingerprint": 15, "handshake": 10,
        "cipher suite": 12, "alpn": 10, "http/2": 8, "impersonate": 12,
        # Browser & CDP
        "cdp": 12, "devtools protocol": 12, "canvas noise": 12, "webgl fingerprint": 12,
        "audiobuffer": 10, "navigator.webdriver": 15, "stealth": 10,
        "camoufox": 15, "nodriver": 12, "drissionpage": 12, "anti-detect": 12,
        # WAF & Challenge Systems
        "turnstile": 15, "cloudflare challenge": 15, "datadome": 15,
        "akamai bot manager": 15, "kasada": 15, "perimeterx": 15,
        "browser fingerprinting": 10, "waf bypass": 12
    }

    SPAM_PATTERNS = [
        r"buy\s+(?:cheap|residential|mobile|datacenter)\s+prox(?:y|ies)",
        r"coupon\s+code",
        r"discount\s+\d+%",
        r"promo\s+code",
        r"pricing\s+starts\s+at\s+\$",
        r"sign\s+up\s+for\s+(?:our|a)\s+free\s+trial",
        r"best\s+proxy\s+provider\s+of\s+202",
        r"affiliate\s+link",
        r"order\s+now"
    ]

    def __init__(self, accept_threshold: int = 75):
        self.accept_threshold = accept_threshold

    def evaluate(self, title: str, content: str, metadata: Dict[str, Any] = None) -> Tuple[bool, int, List[str]]:
        if metadata is None:
            metadata = {}

        score = 0
        reasons = []
        content_lower = content.lower()
        title_lower = title.lower()

        # 1. Minimum Word Count Check
        word_count = len(content.split())
        if word_count < 120:
            return False, 0, ["DITOLAK: Konten terlalu pendek (< 120 kata) / kemungkinan template kosong."]

        if word_count > 400:
            score += 15
            reasons.append(f"Substansi teks memadai ({word_count} kata) (+15)")

        # 2. Filter Spam Komersial
        for pat in self.SPAM_PATTERNS:
            if re.search(pat, content_lower):
                score -= 70
                reasons.append(f"PENALTI SPAM: Promosi komersial/proxy terdeteksi (-70)")
                break

        # 3. Temporal Recency Check (WAF Bypasses Expire Fast!)
        # Periksa tanggal pushed_at dari GitHub metadata
        pushed_at = metadata.get("pushed_at") or metadata.get("updated_at")
        if pushed_at:
            try:
                # ISO format '2026-03-01T...'
                dt_pushed = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
                days_old = (datetime.now(dt_pushed.tzinfo) - dt_pushed).days
                if days_old <= 180:
                    score += 20
                    reasons.append(f"Segar & Terawat (Update {days_old} hari lalu) (+20)")
                elif days_old <= 365:
                    score += 10
                    reasons.append(f"Cukup Segar (Update {days_old} hari lalu) (+10)")
                elif days_old > 730:
                    # Lebih dari 2 tahun tanpa update = kemungkinan besar teknik sudah ditambal WAF
                    score -= 40
                    reasons.append(f"PENALTI USANG: Tidak ada update dalam {days_old} hari, teknik rawan obsolete (-40)")
            except Exception:
                pass

        # 4. Deep Code Semantic Verification (KUNCI KUALITAS UTAMA)
        code_blocks = re.findall(r"```(?:python|py|javascript|js|bash|sh|go|cpp)?\n(.*?)```", content, re.DOTALL)
        verified_evasion_code_blocks = 0
        dummy_detected = False

        for block in code_blocks:
            lines = [l for l in block.strip().split("\n") if l.strip() and not l.strip().startswith("#")]
            if len(lines) < 3:
                continue

            # Cek apakah kode hanya scraping noob
            for noob_pat in self.DUMMY_CODE_PATTERNS:
                if re.search(noob_pat, block):
                    dummy_detected = True

            # Cek apakah memuat signature teknik anti-bot nyata
            has_evasion_call = False
            for sig in self.ACTIONABLE_CODE_SIGNATURES:
                if re.search(sig, block, re.IGNORECASE):
                    has_evasion_call = True
                    break

            if has_evasion_call:
                verified_evasion_code_blocks += 1

        if dummy_detected and verified_evasion_code_blocks == 0:
            score -= 50
            reasons.append("PENALTI NOOB: Kode yang disajikan hanya scraping dasar tanpa proteksi anti-bot (-50)")

        if verified_evasion_code_blocks > 0:
            code_points = min(verified_evasion_code_blocks * 18, 50)
            score += code_points
            reasons.append(f"Ditemukan {verified_evasion_code_blocks} blok kode implementasi anti-bot nyata (+{code_points})")
        else:
            reasons.append("Peringatan: Tidak ada kode implementasi anti-bot yang dapat dieksekusi (0 poin kode)")

        # 5. Penilaian Terminologi Teknis & Target WAF (Max 35 poin)
        matched_terms = []
        term_score = 0
        for term, weight in self.TECHNICAL_KEYWORDS.items():
            if term in content_lower or term in title_lower:
                matched_terms.append(term)
                term_score += weight

        capped_term_score = min(term_score, 35)
        score += capped_term_score
        if matched_terms:
            reasons.append(f"Terminologi spesifik ({', '.join(matched_terms[:6])}) (+{capped_term_score})")

        # 6. Repositori Metrik (Stars & Forks)
        stars = metadata.get("stars", 0)
        if stars >= 500:
            score += 15
            reasons.append(f"Repositori terverifikasi sangat populer ({stars} stars) (+15)")
        elif stars >= 20:
            score += 10
            reasons.append(f"Hidden gem / Repositori berkembang ({stars} stars) (+10)")
        elif stars >= 5:
            score += 5

        is_accepted = score >= self.accept_threshold
        status_label = "DITERIMA" if is_accepted else "DITOLAK"
        reasons.insert(0, f"Keputusan: {status_label} (Skor Akhir: {score}/{self.accept_threshold})")

        return is_accepted, score, reasons
