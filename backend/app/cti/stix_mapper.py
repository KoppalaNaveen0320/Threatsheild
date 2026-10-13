import stix2
import uuid
import json
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple

class STIX21Engine:
    """
    OASIS STIX 2.1 CTI Normalization, Interoperability, and Serialization Engine.
    Supports SDOs: Indicator, Malware, ThreatActor, AttackPattern, Vulnerability, Infrastructure, Identity.
    Supports SROs: Relationship, Sighting.
    """

    @staticmethod
    def _to_valid_uuid_str(val: Any) -> str:
        if isinstance(val, uuid.UUID):
            return str(val)
        try:
            return str(uuid.UUID(str(val)))
        except Exception:
            return str(uuid.uuid5(uuid.NAMESPACE_DNS, str(val)))

    @staticmethod
    def to_stix_identity(org_name: str, org_id: str) -> stix2.Identity:
        formatted_id = f"identity--{STIX21Engine._to_valid_uuid_str(org_id)}"
        return stix2.Identity(
            id=formatted_id,
            name=org_name,
            identity_class="organization",
            spec_version="2.1"
        )

    @staticmethod
    def cti_record_to_stix_indicator(record, org_id: Optional[str] = None) -> stix2.Indicator:
        pattern = ""
        rec_type = getattr(record, 'type', 'custom-object')
        rec_val = getattr(record, 'value', '')
        
        if rec_type in ["ipv4-addr", "ip"]:
            pattern = f"[ipv4-addr:value = '{rec_val}']"
        elif rec_type in ["ipv6-addr"]:
            pattern = f"[ipv6-addr:value = '{rec_val}']"
        elif rec_type in ["domain-name", "domain"]:
            pattern = f"[domain-name:value = '{rec_val}']"
        elif rec_type in ["file-hash", "hash"]:
            if len(rec_val) == 64:
                pattern = f"[file:hashes.'SHA-256' = '{rec_val}']"
            elif len(rec_val) == 32:
                pattern = f"[file:hashes.MD5 = '{rec_val}']"
            elif len(rec_val) == 40:
                pattern = f"[file:hashes.'SHA-1' = '{rec_val}']"
            else:
                pattern = f"[file:hashes.'SHA-256' = '{rec_val}']"
        elif rec_type == "url":
            pattern = f"[url:value = '{rec_val}']"
        elif rec_type == "email-addr":
            pattern = f"[email-addr:value = '{rec_val}']"
        else:
            pattern = f"[custom-object:value = '{rec_val}']"

        try:
            created_time = getattr(record, 'created_at', datetime.utcnow())
        except Exception:
            created_time = datetime.utcnow()

        conf = getattr(record, 'confidence', None)
        int_conf = None
        if conf is not None:
            int_conf = int(conf * 100) if conf <= 1.0 else int(conf)

        creator_id = org_id or getattr(record, 'organization_id', None)
        created_by_ref = f"identity--{STIX21Engine._to_valid_uuid_str(creator_id)}" if creator_id else None

        indicator_id = f"indicator--{STIX21Engine._to_valid_uuid_str(getattr(record, 'id', uuid.uuid4()))}"
        
        return stix2.Indicator(
            id=indicator_id,
            spec_version="2.1",
            name=f"ThreatShield {rec_type.upper()}: {rec_val}",
            description=getattr(record, 'description', '') or "Validated ThreatShield CTI Indicator",
            indicator_types=["malicious-activity"],
            pattern_type="stix",
            pattern=pattern,
            valid_from=created_time,
            confidence=int_conf,
            created_by_ref=created_by_ref
        )

    @staticmethod
    def create_threat_actor(name: str, aliases: List[str] = None) -> stix2.ThreatActor:
        return stix2.ThreatActor(
            id=f"threat-actor--{uuid.uuid4()}",
            spec_version="2.1",
            name=name,
            aliases=aliases or [],
            threat_actor_types=["cyber-espionage", "crime-syndicate"]
        )

    @staticmethod
    def create_malware(name: str, is_family: bool = False) -> stix2.Malware:
        return stix2.Malware(
            id=f"malware--{uuid.uuid4()}",
            spec_version="2.1",
            name=name,
            is_family=is_family,
            malware_types=["trojan", "ransomware"]
        )

    @staticmethod
    def create_attack_pattern(name: str, external_id: str = "T1059") -> stix2.AttackPattern:
        return stix2.AttackPattern(
            id=f"attack-pattern--{uuid.uuid4()}",
            spec_version="2.1",
            name=name,
            external_references=[
                stix2.ExternalReference(
                    source_name="mitre-attack",
                    external_id=external_id
                )
            ]
        )

    @staticmethod
    def create_relationship(source_ref: str, relationship_type: str, target_ref: str) -> stix2.Relationship:
        return stix2.Relationship(
            id=f"relationship--{uuid.uuid4()}",
            spec_version="2.1",
            source_ref=source_ref,
            relationship_type=relationship_type,
            target_ref=target_ref
        )

    @staticmethod
    def create_sighting(sighting_of_ref: str, where_sighted_refs: List[str] = None, count: int = 1) -> stix2.Sighting:
        return stix2.Sighting(
            id=f"sighting--{uuid.uuid4()}",
            spec_version="2.1",
            sighting_of_ref=sighting_of_ref,
            where_sighted_refs=where_sighted_refs or [],
            count=count
        )

    @classmethod
    def create_stix_bundle(cls, records: List[Any], org_name: str, org_id: str) -> stix2.Bundle:
        identity = cls.to_stix_identity(org_name, org_id)
        objects = [identity]
        
        for r in records:
            ind = cls.cti_record_to_stix_indicator(r, org_id)
            objects.append(ind)
            
            # SRO: Relationship Organization -> Submitted -> Indicator
            rel = cls.create_relationship(identity.id, "submits", ind.id)
            objects.append(rel)

        return stix2.Bundle(objects=objects, allow_custom=True)

    @classmethod
    def parse_and_validate_stix_bundle(cls, bundle_json: str) -> Tuple[bool, List[Dict[str, Any]], List[str]]:
        """
        Parses an incoming STIX 2.1 JSON bundle, validates compliance,
        and extracts normalized CTI records along with validation errors.
        """
        errors = []
        parsed_records = []

        try:
            bundle_dict = json.loads(bundle_json) if isinstance(bundle_json, str) else bundle_json
            bundle_obj = stix2.parse(bundle_dict, allow_custom=True)
        except Exception as e:
            return False, [], [f"STIX 2.1 Bundle parsing error: {str(e)}"]

        if not hasattr(bundle_obj, 'objects') or not bundle_obj.objects:
            return False, [], ["STIX bundle contains no objects"]

        for obj in bundle_obj.objects:
            obj_type = getattr(obj, 'type', '')
            if obj_type == "indicator":
                pattern = getattr(obj, 'pattern', '')
                rec_type = "unknown"
                rec_value = ""

                # Extract pattern values
                if "ipv4-addr:value" in pattern:
                    rec_type = "ipv4-addr"
                    rec_value = pattern.split("'")[1] if "'" in pattern else ""
                elif "ipv6-addr:value" in pattern:
                    rec_type = "ipv6-addr"
                    rec_value = pattern.split("'")[1] if "'" in pattern else ""
                elif "domain-name:value" in pattern:
                    rec_type = "domain-name"
                    rec_value = pattern.split("'")[1] if "'" in pattern else ""
                elif "file:hashes" in pattern:
                    rec_type = "file-hash"
                    rec_value = pattern.split("'")[1] if "'" in pattern else ""
                elif "url:value" in pattern:
                    rec_type = "url"
                    rec_value = pattern.split("'")[1] if "'" in pattern else ""
                elif "email-addr:value" in pattern:
                    rec_type = "email-addr"
                    rec_value = pattern.split("'")[1] if "'" in pattern else ""

                if not rec_value:
                    errors.append(f"Indicator {getattr(obj, 'id', 'unknown')} has unparsable pattern: {pattern}")
                    continue

                conf = getattr(obj, 'confidence', 80)
                parsed_records.append({
                    "stix_id": getattr(obj, 'id', str(uuid.uuid4())),
                    "type": rec_type,
                    "value": rec_value,
                    "description": getattr(obj, 'description', '') or getattr(obj, 'name', ''),
                    "confidence": (conf / 100.0) if conf and conf > 1.0 else (conf or 0.8),
                    "severity": 7.0,
                    "created_by_ref": getattr(obj, 'created_by_ref', None)
                })

        return len(errors) == 0, parsed_records, errors

# Backward compatibility functions
to_stix_identity = STIX21Engine.to_stix_identity
cti_record_to_stix_indicator = STIX21Engine.cti_record_to_stix_indicator
create_stix_bundle = STIX21Engine.create_stix_bundle
