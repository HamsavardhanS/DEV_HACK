import uuid
from datetime import datetime, timezone
import json
from dataclasses import dataclass, field, asdict

@dataclass
class AgentEvent:
    source_agent: str
    payload: dict
    confidence_score: float = 0.0
    reasoning: str = ""
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_json(self) -> str:
        return json.dumps(asdict(self))

    @classmethod
    def from_json(cls, json_str: str) -> "AgentEvent":
        data = json.loads(json_str)
        return cls(**data)
