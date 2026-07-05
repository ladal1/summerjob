from __future__ import annotations

import json
import logging
import signal
import sys
from typing import Any

from src.config import LOG_LEVEL
from src.rabbitmq_setup import setup_connection
from src.solver import generate_plan_from_message

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL.upper(), logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

_shutdown = False
_channel: Any = None


def _handle_signal(signum: int, frame) -> None:
    global _shutdown
    if _shutdown:
        logger.warning("Forced exit")
        sys.exit(1)
    _shutdown = True
    name = signal.Signals(signum).name
    logger.info("Shutdown requested (%s)", name)
    if _channel is not None:
        logger.info("Stopping consumer...")
        try:
            _channel.stop_consuming()
        except Exception:
            pass


def on_message(ch, method, properties, body) -> None:
    logger.info("Received message (delivery tag: %s)", method.delivery_tag)
    try:
        message = json.loads(body)
        plan_id = message.get("planId")
        if plan_id is None:
            logger.error("Missing 'planId' in message")
            ch.basic_nack(delivery_tag=method.delivery_tag)
            return
    except (ValueError, json.JSONDecodeError):
        logger.error("Invalid message format: %s", body)
        ch.basic_nack(delivery_tag=method.delivery_tag)
        return

    generate_plan_from_message(plan_id)
    ch.basic_ack(delivery_tag=method.delivery_tag)


def main() -> None:
    global _channel
    signal.signal(signal.SIGINT, _handle_signal)
    signal.signal(signal.SIGTERM, _handle_signal)

    channel, queue_name = setup_connection()
    _channel = channel

    channel.basic_consume(
        queue=queue_name, on_message_callback=on_message, auto_ack=False
    )
    logger.info("Waiting for messages on '%s'. To exit press CTRL+C", queue_name)

    try:
        channel.start_consuming()
    except Exception:
        if _shutdown:
            logger.info("Consumer stopped during shutdown")
        else:
            raise
    finally:
        logger.info("Shutdown complete")


if __name__ == "__main__":
    main()
