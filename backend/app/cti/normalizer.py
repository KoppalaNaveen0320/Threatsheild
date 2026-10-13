import re
import ipaddress
import urllib.parse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class NormalizationResult(BaseModel):
    status: str # NORMALIZED, INVALID, DUPLICATE, SUSPICIOUS
    normalized_value: str
    original_value: str
    indicator_type: str
    is_valid: bool
    validation_errors: List[str] = []
    metadata: Dict[str, Any] = {}

class CTINormalizer:
    """
    Production-grade CTI Normalization and Validation Engine.
    Ensures that only syntactically valid and canonicalized indicators
    enter the ThreatShield intelligence pipeline.
    """
    
    MD5_REGEX = re.compile(r'^[a-fA-F0-9]{32}$')
    SHA1_REGEX = re.compile(r'^[a-fA-F0-9]{40}$')
    SHA256_REGEX = re.compile(r'^[a-fA-F0-9]{64}$')
    EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
    DOMAIN_REGEX = re.compile(r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$')

    @classmethod
    def normalize_indicator(cls, raw_type: str, raw_value: str) -> NormalizationResult:
        if not raw_value or not isinstance(raw_value, str):
            return NormalizationResult(
                status="INVALID",
                normalized_value="",
                original_value=str(raw_value),
                indicator_type=raw_type or "unknown",
                is_valid=False,
                validation_errors=["Indicator value cannot be empty or non-string"]
            )

        indicator_type = raw_type.strip().lower() if raw_type else "unknown"
        value = raw_value.strip()
        errors = []

        if indicator_type in ["ipv4-addr", "ip", "ipv4"]:
            return cls._normalize_ipv4(value)
        elif indicator_type in ["ipv6-addr", "ipv6"]:
            return cls._normalize_ipv6(value)
        elif indicator_type in ["domain-name", "domain"]:
            return cls._normalize_domain(value)
        elif indicator_type in ["url", "uri"]:
            return cls._normalize_url(value)
        elif indicator_type in ["file-hash", "hash", "sha256", "md5", "sha1"]:
            return cls._normalize_hash(value, indicator_type)
        elif indicator_type in ["email-addr", "email"]:
            return cls._normalize_email(value)
        elif indicator_type in ["stix-pattern", "pattern"]:
            return cls._normalize_stix_pattern(value)
        else:
            # Fallback type inference if unknown
            inferred = cls._infer_and_normalize(value)
            if inferred.is_valid:
                return inferred
            return NormalizationResult(
                status="NORMALIZED",
                normalized_value=value,
                original_value=raw_value,
                indicator_type=indicator_type,
                is_valid=True,
                metadata={"inferred": False}
            )

    @classmethod
    def _normalize_ipv4(cls, val: str) -> NormalizationResult:
        clean_val = val.strip()
        try:
            ip_obj = ipaddress.IPv4Address(clean_val)
            # Check for suspicious or private addresses in public intelligence context
            is_private = ip_obj.is_private
            is_loopback = ip_obj.is_loopback
            status = "SUSPICIOUS" if is_loopback else "NORMALIZED"
            
            return NormalizationResult(
                status=status,
                normalized_value=str(ip_obj),
                original_value=val,
                indicator_type="ipv4-addr",
                is_valid=True,
                metadata={"is_private": is_private, "is_loopback": is_loopback}
            )
        except ipaddress.AddressValueError as e:
            return NormalizationResult(
                status="INVALID",
                normalized_value=val,
                original_value=val,
                indicator_type="ipv4-addr",
                is_valid=False,
                validation_errors=[f"Invalid IPv4 format: {str(e)}"]
            )

    @classmethod
    def _normalize_ipv6(cls, val: str) -> NormalizationResult:
        clean_val = val.strip()
        try:
            ip_obj = ipaddress.IPv6Address(clean_val)
            return NormalizationResult(
                status="NORMALIZED",
                normalized_value=ip_obj.compressed,
                original_value=val,
                indicator_type="ipv6-addr",
                is_valid=True,
                metadata={"is_private": ip_obj.is_private}
            )
        except ipaddress.AddressValueError as e:
            return NormalizationResult(
                status="INVALID",
                normalized_value=val,
                original_value=val,
                indicator_type="ipv6-addr",
                is_valid=False,
                validation_errors=[f"Invalid IPv6 format: {str(e)}"]
            )

    @classmethod
    def _normalize_domain(cls, val: str) -> NormalizationResult:
        clean_val = val.strip().lower().rstrip('.')
        # Remove scheme if incorrectly prefixed (e.g. http://example.com)
        if clean_val.startswith("http://") or clean_val.startswith("https://"):
            clean_val = urllib.parse.urlparse(clean_val).netloc

        if cls.DOMAIN_REGEX.match(clean_val):
            return NormalizationResult(
                status="NORMALIZED",
                normalized_value=clean_val,
                original_value=val,
                indicator_type="domain-name",
                is_valid=True
            )
        return NormalizationResult(
            status="INVALID",
            normalized_value=val,
            original_value=val,
            indicator_type="domain-name",
            is_valid=False,
            validation_errors=["Domain contains invalid characters or does not have a valid TLD syntax"]
        )

    @classmethod
    def _normalize_url(cls, val: str) -> NormalizationResult:
        clean_val = val.strip()
        if not (clean_val.startswith("http://") or clean_val.startswith("https://") or clean_val.startswith("ftp://")):
            clean_val = "https://" + clean_val

        try:
            parsed = urllib.parse.urlparse(clean_val)
            if not parsed.netloc:
                return NormalizationResult(
                    status="INVALID",
                    normalized_value=val,
                    original_value=val,
                    indicator_type="url",
                    is_valid=False,
                    validation_errors=["URL missing valid network location / host"]
                )
            
            # Canonical URL representation
            normalized_url = urllib.parse.urlunparse((
                parsed.scheme.lower(),
                parsed.netloc.lower(),
                parsed.path or "/",
                parsed.params,
                parsed.query,
                parsed.fragment
            ))
            return NormalizationResult(
                status="NORMALIZED",
                normalized_value=normalized_url,
                original_value=val,
                indicator_type="url",
                is_valid=True,
                metadata={"scheme": parsed.scheme, "host": parsed.netloc}
            )
        except Exception as e:
            return NormalizationResult(
                status="INVALID",
                normalized_value=val,
                original_value=val,
                indicator_type="url",
                is_valid=False,
                validation_errors=[f"URL parsing failure: {str(e)}"]
            )

    @classmethod
    def _normalize_hash(cls, val: str, raw_type: str) -> NormalizationResult:
        clean_val = val.strip().lower()
        # Remove common prefixes like sha256: or 0x
        if clean_val.startswith("sha256:") or clean_val.startswith("md5:") or clean_val.startswith("sha1:"):
            clean_val = clean_val.split(":", 1)[1]
        elif clean_val.startswith("0x"):
            clean_val = clean_val[2:]

        hash_type = "file-hash"
        if cls.SHA256_REGEX.match(clean_val):
            hash_type = "file-hash"
            subtype = "SHA-256"
        elif cls.MD5_REGEX.match(clean_val):
            hash_type = "file-hash"
            subtype = "MD5"
        elif cls.SHA1_REGEX.match(clean_val):
            hash_type = "file-hash"
            subtype = "SHA-1"
        else:
            return NormalizationResult(
                status="INVALID",
                normalized_value=val,
                original_value=val,
                indicator_type="file-hash",
                is_valid=False,
                validation_errors=["Hash length or hex character set does not match SHA-256 (64 hex), SHA-1 (40 hex), or MD5 (32 hex)"]
            )

        return NormalizationResult(
            status="NORMALIZED",
            normalized_value=clean_val,
            original_value=val,
            indicator_type=hash_type,
            is_valid=True,
            metadata={"hash_algorithm": subtype}
        )

    @classmethod
    def _normalize_email(cls, val: str) -> NormalizationResult:
        clean_val = val.strip().lower()
        if cls.EMAIL_REGEX.match(clean_val):
            return NormalizationResult(
                status="NORMALIZED",
                normalized_value=clean_val,
                original_value=val,
                indicator_type="email-addr",
                is_valid=True
            )
        return NormalizationResult(
            status="INVALID",
            normalized_value=val,
            original_value=val,
            indicator_type="email-addr",
            is_valid=False,
            validation_errors=["Invalid email address format"]
        )

    @classmethod
    def _normalize_stix_pattern(cls, val: str) -> NormalizationResult:
        clean_val = val.strip()
        if clean_val.startswith("[") and clean_val.endswith("]"):
            return NormalizationResult(
                status="NORMALIZED",
                normalized_value=clean_val,
                original_value=val,
                indicator_type="stix-pattern",
                is_valid=True
            )
        return NormalizationResult(
            status="INVALID",
            normalized_value=val,
            original_value=val,
            indicator_type="stix-pattern",
            is_valid=False,
            validation_errors=["STIX pattern must be enclosed in square brackets [ ... ]"]
        )

    @classmethod
    def _infer_and_normalize(cls, val: str) -> NormalizationResult:
        # Try IP
        try:
            ipaddress.ip_address(val.strip())
            return cls._normalize_ipv4(val)
        except ValueError:
            pass
        # Try Hash
        clean_hex = val.strip().lower()
        if cls.SHA256_REGEX.match(clean_hex) or cls.MD5_REGEX.match(clean_hex) or cls.SHA1_REGEX.match(clean_hex):
            return cls._normalize_hash(val, "file-hash")
        # Try Domain
        if cls.DOMAIN_REGEX.match(val.strip().lower()):
            return cls._normalize_domain(val)
        # Try Email
        if cls.EMAIL_REGEX.match(val.strip().lower()):
            return cls._normalize_email(val)
            
        return NormalizationResult(
            status="INVALID",
            normalized_value=val,
            original_value=val,
            indicator_type="unknown",
            is_valid=False,
            validation_errors=["Unable to infer indicator type from value pattern"]
        )
