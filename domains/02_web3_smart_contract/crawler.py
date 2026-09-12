"""
Backward-compatibility adapter for 02_web3_smart_contract.
Mengarahkan eksekusi ke core generic engine secara seamless.
"""
import os
import sys

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.crawler_engine import run_crawler_for_domain

def main():
    run_crawler_for_domain("02_web3_smart_contract")

if __name__ == "__main__":
    main()
