import pika
import os
from urllib.parse import urlparse
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file in the project root
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

def get_rabbitmq_config():
    """Get RabbitMQ configuration from environment variables"""
    amqp_url = os.getenv('AMQP_URL', 'amqp://localhost')
    queue_name = os.getenv('QUEUE_NAME', 'planner')
    return amqp_url, queue_name

def setup_connection():
    """Setup RabbitMQ connection using environment configuration"""
    amqp_url, queue_name = get_rabbitmq_config()
    
    # Parse the AMQP URL to extract connection parameters
    parsed_url = urlparse(amqp_url)
    
    # Extract host and port from the URL
    host = parsed_url.hostname or 'localhost'
    port = parsed_url.port or 5672
    
    # Handle authentication if present in URL
    username = parsed_url.username
    password = parsed_url.password
    
    # Create connection parameters
    if username and password:
        credentials = pika.PlainCredentials(username, password)
        connection_params = pika.ConnectionParameters(
            host=host, 
            port=port, 
            credentials=credentials
        )
    else:
        connection_params = pika.ConnectionParameters(host=host, port=port)
    
    # Try to establish connection with fallback for local development
    try:
        connection = pika.BlockingConnection(connection_params)
        print(f"Successfully connected to RabbitMQ at {host}:{port}")
    except Exception as e:
        print(f"Failed to connect to {host}:{port}: {e}")
        # Fallback to localhost for local development
        if host != 'localhost':
            print("Attempting to connect to localhost:5672 as fallback...")
            fallback_params = pika.ConnectionParameters(host='localhost', port=5672)
            try:
                connection = pika.BlockingConnection(fallback_params)
                print("Successfully connected to RabbitMQ at localhost:5672")
            except Exception as fallback_error:
                raise Exception(f"Failed to connect to both {host}:{port} and localhost:5672. "
                              f"Make sure RabbitMQ is running. Original error: {e}, "
                              f"Fallback error: {fallback_error}")
        else:
            raise Exception(f"Failed to connect to RabbitMQ at {host}:{port}. "
                          f"Make sure RabbitMQ is running. Error: {e}")
    
    # Setup channel and queue
    channel = connection.channel()
    channel.queue_declare(queue=queue_name, durable=False)
    
    return channel, queue_name