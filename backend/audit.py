"""
Audit trail module — logs every action to a JSON file.
Records: timestamp, action, user, details, and success/failure status.
"""

import json
import os
from datetime import datetime, timezone

AUDIT_LOG_FILE = os.path.join(os.path.dirname(__file__), "audit_log.json")


def _load_log():
    """Load existing audit log or return empty list."""
    if os.path.exists(AUDIT_LOG_FILE):
        try:
            with open(AUDIT_LOG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return []
    return []


def _save_log(entries):
    """Save audit log entries to file."""
    with open(AUDIT_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2, ensure_ascii=False)


def log_action(action, user, details, success=True):
    """
    Record an action in the audit trail.

    Args:
        action: What happened (e.g., "login", "transfer", "fetch_tools")
        user: Who triggered the action (client_id or "system")
        details: Extra information about the action
        success: Whether the action succeeded
    """
    entries = _load_log()

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action": action,
        "user": user,
        "details": details,
        "success": success
    }

    entries.append(entry)
    _save_log(entries)

    return entry


def get_audit_log():
    """Return all audit log entries."""
    return _load_log()


def clear_audit_log():
    """Clear the audit log."""
    _save_log([])
