#!/usr/bin/env python
from dotenv import load_dotenv
from pathlib import Path
from src.solver import generate_plan_from_message
from src.rabbitmq_setup import setup_connection

# Load environment variables from .env file in the project root
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

channel, queue_name = setup_connection()

def on_message(ch, method, body):
    print(f'Received message (delivery tag: {method.delivery_tag}): {body}')
    generate_plan_from_message("9fdcbb17-5ade-4a68-a51d-1a9e7dc9e10b")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue=queue_name, on_message_callback=on_message, auto_ack=False)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()