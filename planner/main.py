from src.rabbitmq_setup import setup_connection
import os

channel = setup_connection()

# Example of receiving a message
def callback(ch, method, properties, body):
    print(f" [x] Received {body}")

queue_name = os.getenv('QUEUE_NAME', 'task_queue')
channel.basic_consume(queue=queue_name,
                      on_message_callback=callback,
                      auto_ack=True)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()