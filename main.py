from planner.src.rabbitmq_setup import setup_connection

channel = setup_connection()

# Example of receiving a message
def callback(ch, method, properties, body):
    print(f" [x] Received {body}")

channel.basic_consume(queue='task_queue',
                      on_message_callback=callback,
                      auto_ack=True)

print(' [*] Waiting for messages. To exit press CTRL+C')
channel.start_consuming()