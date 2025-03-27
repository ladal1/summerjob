import pika

RABBITMQ_HOST = 'localhost'
RABBITMQ_PORT = 5672
QUEUE_NAME = 'task_queue'

def setup_connection():
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST, port=RABBITMQ_PORT))
    channel = connection.channel()
    channel.queue_declare(queue=QUEUE_NAME)
    return channel