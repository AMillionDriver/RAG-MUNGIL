"""
Backward-compatibility adapter for 01_rag_scraping explorer.
"""
import os
import sys
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.explorer_engine import AutonomousExplorer as CoreExplorer, ResilientHttpClient

class AutonomousExplorer(CoreExplorer):
    def __init__(self, http: ResilientHttpClient, judge):
        config_path = os.path.join(CURRENT_DIR, "config.json")
        config = {}
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        super().__init__(http=http, judge=judge, config=config, domain_dir=CURRENT_DIR)
