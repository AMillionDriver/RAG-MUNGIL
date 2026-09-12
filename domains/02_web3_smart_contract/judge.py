"""
Backward-compatibility adapter for 02_web3_smart_contract judge.
"""
import os
import sys
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(os.path.dirname(CURRENT_DIR))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from core.judge_engine import SmartJudgeBot as CoreJudgeBot

class SmartJudgeBot(CoreJudgeBot):
    def __init__(self):
        config_path = os.path.join(CURRENT_DIR, "config.json")
        config = {}
        if os.path.exists(config_path):
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
        super().__init__(config=config)
