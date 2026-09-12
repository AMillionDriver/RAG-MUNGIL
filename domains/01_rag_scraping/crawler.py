"""
Backward-compatibility adapter for 01_rag_scraping.
Mengarahkan eksekusi ke core generic engine secara seamless.
"""
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.judge_engine import SmartJudgeBot
from core.explorer_engine import AutonomousExplorer, ResilientHttpClient
from core.crawler_engine import run_crawler_for_domain

def main():
    run_crawler_for_domain("01_rag_scraping")

if __name__ == "__main__":
    main()
