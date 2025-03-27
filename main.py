from planner.src.rabbitmq_setup import setup_connection

channel = setup_connection()

def send_message(message):
    channel.basic_publish(exchange='',
                          routing_key='task_queue',
                          body=message)
    print(f" [x] Sent {message}")

# Send a test message before starting to consume
send_message("Test message")

# Example of receiving a message
def callback(ch, method, properties, body):
    print(f" [x] Received {body}")

channel.basic_consume(queue='task_queue',
                      on_message_callback=callback,
                      auto_ack=True)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()