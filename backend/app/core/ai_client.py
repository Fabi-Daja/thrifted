import os

import anthropic

# Klienti Anthropic i perbashket - perdoret nga chat_service.py (5.1) dhe
# image_analysis_service.py (5.2). I nxjerre ketu qe te mos instanciohet
# nga e para per çdo servis te ri qe perdor Claude.
client = anthropic.AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MODEL = "claude-haiku-4-5"
