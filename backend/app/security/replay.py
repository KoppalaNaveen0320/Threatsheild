import time
import hashlib
from typing import Dict, Tuple, Optional
from datetime import datetime, timezone

class ReplayProtectionEngine:
    """
    Cryptographic Replay Attack Detection and Nonce Verification Engine.
    
    Protects sensitive operations (CTI Ingestion, FL Model Updates, Trust Evaluations, Ledger Submissions)
    against replay attacks via:
    1. Cryptographic Digest Tracking (SHA-256 of Event Payload + Nonce)
    2. Enforced Timestamp Window (default: +/- 300 seconds)
    3. Per-Tenant Nonce De-duplication Cache with automated TTL expiry.
    """

    def __init__(self, window_seconds: int = 300):
        self.window_seconds = window_seconds
        # In-memory replay cache: {digest: timestamp_seen}
        self.seen_events: Dict[str, float] = {}

    def _cleanup_expired(self, current_time: float):
        cutoff = current_time - self.window_seconds
        expired_keys = [k for k, t in self.seen_events.items() if t < cutoff]
        for k in expired_keys:
            del self.seen_events[k]

    def verify_and_record_event(
        self,
        organization_id: str,
        event_id: str,
        event_timestamp: datetime,
        payload_canonical_str: str,
        nonce: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Validates event freshness and checks for replay attempts.
        Returns: (is_valid: bool, reason: str)
        """
        current_time = time.time()
        self._cleanup_expired(current_time)

        # 1. Verify Timestamp Window
        if event_timestamp.tzinfo is None:
            # Assume UTC
            event_ts_unix = event_timestamp.replace(tzinfo=timezone.utc).timestamp()
        else:
            event_ts_unix = event_timestamp.timestamp()

        drift = abs(current_time - event_ts_unix)
        if drift > self.window_seconds:
            return False, f"Event timestamp drift ({drift:.1f}s) exceeds maximum allowed window ({self.window_seconds}s)"

        # 2. Derive Cryptographic Digest
        unique_token = nonce or event_id
        digest_input = f"{organization_id}:{unique_token}:{payload_canonical_str}"
        digest = hashlib.sha256(digest_input.encode('utf-8')).hexdigest()

        # 3. Check for Duplicate Digest
        if digest in self.seen_events:
            return False, f"Replay attack detected: Event with digest {digest[:12]}... was already processed"

        # Record event
        self.seen_events[digest] = current_time
        return True, "Event verified and recorded"

# Global singleton
replay_engine = ReplayProtectionEngine()
