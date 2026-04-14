"""
In-memory mock data store for the Milwaukee Tool Tracking System.
Simulates a warehouse with tool samples and demo accounts across Europe.
"""

CREDENTIALS = {
    "milwaukee_admin": "onekey2024!",
    "demo_user": "secret123",
    "france_demo": "france123",
    "germany_demo": "germany123",
    "spain_demo": "spain123",
    "italy_demo": "italy123",
    "turkiye_demo": "turkiye123"
}

ACCOUNT_TYPES = {
    "milwaukee_admin": {"type": "warehouse"},
    "demo_user":       {"type": "warehouse"},
    "france_demo":     {"type": "demo", "country_code": "FR", "country": "France"},
    "germany_demo":    {"type": "demo", "country_code": "DE", "country": "Germany"},
    "spain_demo":      {"type": "demo", "country_code": "ES", "country": "Spain"},
    "italy_demo":      {"type": "demo", "country_code": "IT", "country": "Italy"},
    "turkiye_demo":    {"type": "demo", "country_code": "TR", "country": "Türkiye"}
}

WAREHOUSE = {
    "account_id": "WH-001",
    "name": "Central Warehouse",
    "tools": [
        {
            "id": "T001",
            "name": "M18 FUEL™ Hammer Drill",
            "model": "2904-20",
            "category": "Drilling",
            "status": "available",
            "serial_number": "SN-2024-001"
        },
        {
            "id": "T002",
            "name": "M18 FUEL™ Impact Driver",
            "model": "2953-20",
            "category": "Fastening",
            "status": "available",
            "serial_number": "SN-2024-002"
        },
        {
            "id": "T003",
            "name": "M18 FUEL™ Circular Saw",
            "model": "2732-20",
            "category": "Cutting",
            "status": "available",
            "serial_number": "SN-2024-003"
        },
        {
            "id": "T004",
            "name": "M18 FUEL™ Angle Grinder",
            "model": "2880-20",
            "category": "Grinding",
            "status": "available",
            "serial_number": "SN-2024-004"
        },
        {
            "id": "T005",
            "name": "M18 FUEL™ Reciprocating Saw",
            "model": "2821-20",
            "category": "Cutting",
            "status": "available",
            "serial_number": "SN-2024-005"
        },
        {
            "id": "T006",
            "name": "M18™ Compact Router",
            "model": "2723-20",
            "category": "Routing",
            "status": "available",
            "serial_number": "SN-2024-006"
        },
        {
            "id": "T007",
            "name": "M12 FUEL™ Installation Drill",
            "model": "2505-20",
            "category": "Drilling",
            "status": "available",
            "serial_number": "SN-2024-007"
        },
        {
            "id": "T008",
            "name": "M18 FUEL™ SDS Plus Rotary Hammer",
            "model": "2715-20",
            "category": "Drilling",
            "status": "available",
            "serial_number": "SN-2024-008"
        }
    ]
}

DEMO_ACCOUNTS = {
    "DE": {"account_id": "DA-DE", "name": "Germany Demo", "country": "Germany", "tools": []},
    "FR": {"account_id": "DA-FR", "name": "France Demo", "country": "France", "tools": []},
    "TR": {"account_id": "DA-TR", "name": "Türkiye Demo", "country": "Türkiye", "tools": []},
    "IT": {"account_id": "DA-IT", "name": "Italy Demo", "country": "Italy", "tools": []},
    "ES": {"account_id": "DA-ES", "name": "Spain Demo", "country": "Spain", "tools": []}
}


def get_warehouse_tools():
    """Return only available (not yet transferred) tools from the warehouse."""
    return [t for t in WAREHOUSE["tools"] if t["status"] == "available"]


def get_all_tools():
    """Return ALL tools — available and transferred — with location info."""
    return WAREHOUSE["tools"]


def get_user_account_type(client_id):
    """Return the account type info for a given user."""
    return ACCOUNT_TYPES.get(client_id, {"type": "warehouse"})


def get_demo_account_tools(country_code):
    """Return tools that have been received by a specific demo account."""
    if country_code in DEMO_ACCOUNTS:
        return DEMO_ACCOUNTS[country_code]["tools"]
    return []


def get_tool_by_id(tool_id):
    """Find a tool in the warehouse by its ID."""
    for tool in WAREHOUSE["tools"]:
        if tool["id"] == tool_id:
            return tool
    return None


def transfer_tool(tool_id, target_country):
    """
    Move a tool from the warehouse to a demo account.
    The tool stays in the master list but its status changes to 'transferred'
    and a 'location' field is added. A copy is also placed in the target
    demo account's tool list with 'in_use' status.
    Returns (success, message_key) tuple.
    """
    if target_country not in DEMO_ACCOUNTS:
        return False, "invalid_country"

    tool = get_tool_by_id(tool_id)
    if tool is None:
        return False, "tool_not_found"

    if tool["status"] != "available":
        return False, "tool_not_available"

    tool["status"] = "transferred"
    tool["location"] = DEMO_ACCOUNTS[target_country]["country"]
    tool["account_code"] = target_country

    transferred_copy = tool.copy()
    transferred_copy["status"] = "in_use"
    DEMO_ACCOUNTS[target_country]["tools"].append(transferred_copy)

    return True, "transfer_success"


def get_demo_accounts():
    """Return all demo accounts and their tool counts."""
    result = []
    for code, account in DEMO_ACCOUNTS.items():
        result.append({
            "code": code,
            "name": account["name"],
            "country": account["country"],
            "tool_count": len(account["tools"])
        })
    return result
