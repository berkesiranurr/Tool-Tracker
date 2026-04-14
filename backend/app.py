"""
Milwaukee Tool Tracking System — Back-End API

A Flask API to manage tool samples across European demo accounts.

Endpoints:
  POST /auth/token   — Authenticate and get a JWT token
  GET  /tools        — List tools (warehouse or demo account)
  GET  /tools/all    — List all tools with location info
  POST /transfer     — Move tools to a demo account
  GET  /accounts     — List available demo accounts
  GET  /audit        — View the audit trail
"""

import os
import datetime
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt

from data import (CREDENTIALS, get_warehouse_tools, get_all_tools, transfer_tool,
                 get_demo_accounts, get_user_account_type, get_demo_account_tools)
from translations import get_message
from audit import log_action, get_audit_log, clear_audit_log

app = Flask(__name__)
CORS(app)

SECRET_KEY = os.environ.get("SECRET_KEY", "milwaukee-onekey-2024-secret")
TOKEN_EXPIRY_MINUTES = 60


def get_lang():
    """Get the language preference from the request (query param or header)."""
    lang = request.args.get("lang")
    if not lang:
        lang = request.headers.get("Accept-Language", "en")[:2]
    return lang if lang in ("en", "de") else "en"


def token_required(f):
    """Decorator that checks for a valid JWT token in the Authorization header."""
    @wraps(f)
    def decorated(*args, **kwargs):
        lang = get_lang()
        auth_header = request.headers.get("Authorization", "")

        if not auth_header.startswith("Bearer "):
            log_action("auth_check", "unknown", "Missing or malformed token", success=False)
            return jsonify({
                "error": True,
                "message": get_message("token_required", lang)
            }), 401

        token = auth_header.split(" ")[1]

        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.user = payload.get("client_id", "unknown")
        except jwt.ExpiredSignatureError:
            log_action("auth_check", "unknown", "Token expired", success=False)
            return jsonify({
                "error": True,
                "message": get_message("session_expired", lang)
            }), 401
        except jwt.InvalidTokenError:
            log_action("auth_check", "unknown", "Invalid token", success=False)
            return jsonify({
                "error": True,
                "message": get_message("invalid_token", lang)
            }), 401

        return f(*args, **kwargs)
    return decorated


@app.route("/auth/token", methods=["POST"])
def auth_token():
    """Authenticate with client_id and client_secret, receive a JWT token."""
    lang = get_lang()

    body = request.get_json(silent=True)
    if not body:
        log_action("login", "unknown", "No request body provided", success=False)
        return jsonify({
            "error": True,
            "message": get_message("missing_credentials", lang)
        }), 400

    client_id = body.get("client_id", "")
    client_secret = body.get("client_secret", "")

    if not client_id or not client_secret:
        log_action("login", client_id or "unknown", "Missing credentials", success=False)
        return jsonify({
            "error": True,
            "message": get_message("missing_credentials", lang)
        }), 400

    if client_id not in CREDENTIALS or CREDENTIALS[client_id] != client_secret:
        log_action("login", client_id, "Invalid credentials", success=False)
        return jsonify({
            "error": True,
            "message": get_message("login_failed", lang)
        }), 401

    account_info = get_user_account_type(client_id)

    payload = {
        "client_id": client_id,
        "account_type": account_info["type"],
        "country_code": account_info.get("country_code", ""),
        "country": account_info.get("country", ""),
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=TOKEN_EXPIRY_MINUTES),
        "iat": datetime.datetime.now(datetime.timezone.utc)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm="HS256")

    log_action("login", client_id, f"Login successful ({account_info['type']} account)", success=True)

    return jsonify({
        "error": False,
        "message": get_message("login_success", lang),
        "token": token,
        "expires_in": TOKEN_EXPIRY_MINUTES * 60,
        "account_type": account_info["type"],
        "country_code": account_info.get("country_code", ""),
        "country": account_info.get("country", "")
    }), 200


@app.route("/me", methods=["GET"])
@token_required
def get_me():
    """Return info about the currently logged-in user."""
    account_info = get_user_account_type(request.user)
    return jsonify({
        "error": False,
        "client_id": request.user,
        "account_type": account_info["type"],
        "country_code": account_info.get("country_code", ""),
        "country": account_info.get("country", "")
    }), 200


@app.route("/tools", methods=["GET"])
@token_required
def list_tools():
    """Return tools based on account type: warehouse tools or received demo tools."""
    lang = get_lang()
    account_info = get_user_account_type(request.user)

    if account_info["type"] == "demo":
        country_code = account_info["country_code"]
        tools = get_demo_account_tools(country_code)
        label = f"{account_info['country']} Demo"
        log_action("fetch_tools", request.user, f"Listed {len(tools)} tools in {label}", success=True)
        return jsonify({
            "error": False,
            "warehouse": label,
            "tool_count": len(tools),
            "tools": tools
        }), 200
    else:
        tools = get_warehouse_tools()
        log_action("fetch_tools", request.user, f"Listed {len(tools)} available tools", success=True)
        return jsonify({
            "error": False,
            "warehouse": "Central Warehouse",
            "tool_count": len(tools),
            "tools": tools
        }), 200


@app.route("/tools/all", methods=["GET"])
@token_required
def list_all_tools():
    """Return ALL tools — available and transferred — with location info."""
    tools = get_all_tools()
    log_action("fetch_all_tools", request.user, f"Listed all {len(tools)} tools (full inventory)", success=True)

    return jsonify({
        "error": False,
        "warehouse": "Central Warehouse",
        "tool_count": len(tools),
        "tools": tools
    }), 200


@app.route("/transfer", methods=["POST"])
@token_required
def transfer_tools():
    """Move selected tools from the warehouse to a demo account."""
    lang = get_lang()

    body = request.get_json(silent=True)
    if not body:
        return jsonify({
            "error": True,
            "message": get_message("no_tools_selected", lang)
        }), 400

    tool_ids = body.get("tool_ids", [])
    target_account = body.get("target_account", "")

    if not tool_ids:
        log_action("transfer", request.user, "No tools selected", success=False)
        return jsonify({
            "error": True,
            "message": get_message("no_tools_selected", lang)
        }), 400

    if not target_account:
        log_action("transfer", request.user, "No target account specified", success=False)
        return jsonify({
            "error": True,
            "message": get_message("invalid_country", lang)
        }), 400

    results = []
    success_count = 0
    fail_count = 0

    for tool_id in tool_ids:
        success, msg_key = transfer_tool(tool_id, target_account)
        results.append({
            "tool_id": tool_id,
            "success": success,
            "message": get_message(msg_key, lang)
        })
        if success:
            success_count += 1
        else:
            fail_count += 1

        log_action(
            "transfer",
            request.user,
            f"Tool {tool_id} -> {target_account}: {msg_key}",
            success=success
        )

    if fail_count == 0:
        status_code = 200
        message = get_message("transfer_success", lang)
    elif success_count == 0:
        status_code = 400
        message = results[0]["message"]
    else:
        status_code = 207
        message = get_message("transfer_partial", lang, success=success_count, failed=fail_count)

    return jsonify({
        "error": fail_count > 0,
        "message": message,
        "results": results,
        "transferred": success_count,
        "failed": fail_count
    }), status_code


@app.route("/accounts", methods=["GET"])
@token_required
def list_accounts():
    """Return all available demo accounts."""
    accounts = get_demo_accounts()
    log_action("fetch_accounts", request.user, f"Listed {len(accounts)} accounts", success=True)

    return jsonify({
        "error": False,
        "accounts": accounts
    }), 200


@app.route("/audit", methods=["GET"])
@token_required
def audit_trail():
    """Return the full audit trail."""
    entries = get_audit_log()
    return jsonify({
        "error": False,
        "entries": entries,
        "total": len(entries)
    }), 200


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": True, "message": "This page does not exist."}), 404


@app.errorhandler(500)
def internal_error(e):
    lang = get_lang()
    return jsonify({"error": True, "message": get_message("server_error", lang)}), 500


if __name__ == "__main__":
    clear_audit_log()
    print("Milwaukee Tool Tracking API running on http://localhost:5000")
    app.run(debug=True, port=5000)
