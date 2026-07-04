from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

DATABASE_URL: str = os.getenv("DATABASE_URL", "")
AMQP_URL: str = os.getenv("AMQP_URL", "amqp://localhost")
QUEUE_NAME: str = os.getenv("QUEUE_NAME", "planner")
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

if not DATABASE_URL:
    POSTGRES_USER = os.getenv("POSTGRES_USER", "")
    POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_DB = os.getenv("POSTGRES_DB", "")
    DATABASE_URL = f"postgresql://{POSTGRES_USER}:{POSTGRES_PASSWORD}@localhost:5432/{POSTGRES_DB}"
