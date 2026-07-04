from __future__ import annotations

import logging
from urllib.parse import urlparse

import pika
from pika.adapters.blocking_connection import BlockingChannel

from src.config import AMQP_URL, QUEUE_NAME

logger = logging.getLogger(__name__)


def get_rabbitmq_config() -> tuple[str, str]:
    return AMQP_URL, QUEUE_NAME


def setup_connection() -> tuple[BlockingChannel, str]:
    amqp_url, queue_name = get_rabbitmq_config()
    parsed_url = urlparse(amqp_url)
    host: str = parsed_url.hostname or "localhost"
    port: int = parsed_url.port or 5672
    username: str | None = parsed_url.username
    password: str | None = parsed_url.password

    if username and password:
        credentials = pika.PlainCredentials(username, password)
        connection_params = pika.ConnectionParameters(
            host=host, port=port, credentials=credentials
        )
    else:
        connection_params = pika.ConnectionParameters(host=host, port=port)

    try:
        connection = pika.BlockingConnection(connection_params)
        logger.info("Connected to RabbitMQ at %s:%s", host, port)
    except Exception as e:
        logger.error("Failed to connect to %s:%s: %s", host, port, e)
        if host != "localhost":
            logger.info("Falling back to localhost:5672...")
            fallback_params = pika.ConnectionParameters(
                host="localhost", port=5672
            )
            try:
                connection = pika.BlockingConnection(fallback_params)
                logger.info("Connected to RabbitMQ at localhost:5672")
            except Exception as fallback_error:
                raise Exception(
                    f"Failed to connect to both {host}:{port} and localhost:5672. "
                    f"Make sure RabbitMQ is running. Original error: {e}, "
                    f"Fallback error: {fallback_error}"
                )
        else:
            raise Exception(
                f"Failed to connect to RabbitMQ at {host}:{port}. "
                f"Make sure RabbitMQ is running. Error: {e}"
            )

    channel = connection.channel()
    channel.queue_declare(queue=queue_name, durable=False)
    logger.info("Queue '%s' declared", queue_name)
    return channel, queue_name
