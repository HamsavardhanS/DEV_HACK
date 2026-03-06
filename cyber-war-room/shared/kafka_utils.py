import json
import logging
from kafka import KafkaProducer, KafkaConsumer
from typing import Callable, Any

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

def get_producer(bootstrap_servers: str = 'localhost:9092') -> KafkaProducer:
    """Returns a Kafka producer instance that serializes values to JSON."""
    return KafkaProducer(
        bootstrap_servers=bootstrap_servers,
        value_serializer=lambda v: json.dumps(v).encode('utf-8'),
        key_serializer=lambda k: k.encode('utf-8') if k else None
    )

def get_consumer(topic: str, group_id: str, bootstrap_servers: str = 'localhost:9092') -> KafkaConsumer:
    """Returns a Kafka consumer instance that deserializes JSON values."""
    return KafkaConsumer(
        topic,
        bootstrap_servers=bootstrap_servers,
        group_id=group_id,
        auto_offset_reset='earliest',
        enable_auto_commit=True,
        value_deserializer=lambda x: json.loads(x.decode('utf-8')),
        api_version=(0, 11, 5) # Fixes MemberIdRequiredError
    )
