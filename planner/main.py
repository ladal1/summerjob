#!/usr/bin/env python
from dotenv import load_dotenv
from pathlib import Path
from src.solver import generate_plan_from_message
from src.rabbitmq_setup import setup_connection
import json

# Load environment variables from .env file in the project root
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

channel, queue_name = setup_connection()

def on_message(ch, method, properties, body):
    print(f'Received message (delivery tag: {method.delivery_tag}): {body}')
    # Get the plan ID from the message body - the body is json { "planId": 123 }
    try:
        message = json.loads(body)
        plan_id = message.get("planId")
    except (ValueError, json.JSONDecodeError):
        print("Invalid message format")
        ch.basic_nack(delivery_tag=method.delivery_tag)
        return

    generate_plan_from_message(plan_id)
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue=queue_name, on_message_callback=on_message, auto_ack=False)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()