import re
from datetime import datetime
from typing import Dict, Any, Tuple, List, Optional

class SmartJudgeBot:
    """
    Universal Domain-Agnostic Heuristic Judge:
    - Menerima konfigurasi domain deklaratif (keywords, weights, signatures, spam patterns).
    - Temporal Recency Verification (Mendeteksi keusangan teknik/repositori).
    - Code Semantic Verification (Memvalidasi keberadaan implementasi kode actionable).
    - Anti-Noob & Anti-Spam Gatekeeper.
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        config = config or {}
        self.accept_threshold = config.get("accept_threshold", 75)
        self.technical_keywords: Dict[str, int] = config.get("technical_keywords", {})
        self.actionable_signatures: List[str] = config.get("actionable_code_signatures", [])
        self.dummy_patterns: List[str] = config.get("dummy_code_patterns", [])
        self.spam_patterns: List[str] = config.get("spam_patterns", [])

    def evaluate(self, title: str, content: str, metadata: Optional[Dict[str, Any]] = None) -> Tuple[bool, int, List[str]]:
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
        for pat in self.spam_patterns:
            if re.search(pat, content_lower):
                score -= 70
                reasons.append("PENALTI SPAM: Promosi komersial/proxy/affiliate terdeteksi (-70)")
                break

        # 3. Temporal Recency Check
        pushed_at = metadata.get("pushed_at") or metadata.get("updated_at")
        if pushed_at:
            try:
                dt_pushed = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
                days_old = (datetime.now(dt_pushed.tzinfo) - dt_pushed).days
                if days_old <= 180:
                    score += 20
                    reasons.append(f"Segar & Terawat (Update {days_old} hari lalu) (+20)")
                elif days_old <= 365:
                    score += 10
                    reasons.append(f"Cukup Segar (Update {days_old} hari lalu) (+10)")
                elif days_old > 730:
                    score -= 40
                    reasons.append(f"PENALTI USANG: Tidak ada update dalam {days_old} hari (-40)")
            except Exception:
                pass

        # 4. Deep Code Semantic Verification
        code_blocks = re.findall(r"```(?:python|py|javascript|js|bash|sh|go|cpp|ts|tsx)?\n(.*?)```", content, re.DOTALL)
        verified_code_blocks = 0
        dummy_detected = False

        for block in code_blocks:
            lines = [l for l in block.strip().split("\n") if l.strip() and not l.strip().startswith("#")]
            if len(lines) < 3:
                continue

            for dummy_pat in self.dummy_patterns:
                if re.search(dummy_pat, block):
                    dummy_detected = True

            has_actionable_call = False
            for sig in self.actionable_signatures:
                if re.search(sig, block, re.IGNORECASE):
                    has_actionable_call = True
                    break

            if has_actionable_call:
                verified_code_blocks += 1

        if dummy_detected and verified_code_blocks == 0:
            score -= 50
            reasons.append("PENALTI NOOB: Kode yang disajikan hanya implementasi pemula/dummy (-50)")

        if verified_code_blocks > 0:
            code_points = min(verified_code_blocks * 18, 50)
            score += code_points
            reasons.append(f"Ditemukan {verified_code_blocks} blok kode implementasi nyata (+{code_points})")
        else:
            reasons.append("Peringatan: Tidak ada kode implementasi yang dapat dieksekusi (0 poin kode)")

        # 5. Penilaian Terminologi Teknis Domain (Max 35 poin)
        matched_terms = []
        term_score = 0
        for term, weight in self.technical_keywords.items():
            if term in content_lower or term in title_lower:
                matched_terms.append(term)
                term_score += weight

        capped_term_score = min(term_score, 35)
        score += capped_term_score
        if matched_terms:
            reasons.append(f"Terminologi spesifik ({', '.join(matched_terms[:6])}) (+{capped_term_score})")

        # 6. Repositori Metrik (Stars)
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
