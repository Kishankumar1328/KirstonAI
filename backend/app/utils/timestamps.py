from datetime import datetime, timezone

def utc_now() -> datetime:
    return datetime.now(timezone.utc)

def iso_format(dt: datetime) -> str:
    return dt.isoformat()
