#!/usr/bin/env python
import os
import pika
from planners.solver import generate_plan_from_message
from rabbitmq_setup import setup_connection, QUEUE_NAME

channel = setup_connection()

def on_message(ch, method, body):
    print(f'Received message (delivery tag: {method.delivery_tag}): {body}')
    generate_plan_from_message("9fdcbb17-5ade-4a68-a51d-1a9e7dc9e10b")
    ch.basic_ack(delivery_tag=method.delivery_tag)

channel.basic_consume(queue=QUEUE_NAME, on_message_callback=on_message, auto_ack=False)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()