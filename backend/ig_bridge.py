"""
Instagram Private API Bridge
Called by Node.js via child_process.

Session-first approach:
1. Try loading saved session
2. Validate with a lightweight call
3. Only login if no valid session exists
4. Save session after successful login

Credentials from env vars IG_USERNAME and IG_PASSWORD.
Never hardcode credentials.
"""
import os
import sys
import json

from instagrapi import Client
from instagrapi.exceptions import (
    BadPassword,
    ChallengeRequired,
    LoginRequired,
    PleaseWaitFewMinutes,
    RateLimitError,
)

ACTION = os.environ.get("IG_ACTION", "test")
SESSION_FILE = os.environ.get("IG_SESSION_FILE", "ig_session.json")
USERNAME = os.environ.get("IG_USERNAME", "")
PASSWORD = os.environ.get("IG_PASSWORD", "")


def output(data: dict):
    print(json.dumps(data))
    sys.exit(0)


def output_error(msg: str):
    output({"ok": False, "error": msg})


def get_client() -> Client:
    """Load session if available, login only if necessary."""
    cl = Client()
    cl.delay_range = [2, 5]

    # Try loading saved session first
    if os.path.exists(SESSION_FILE):
        try:
            cl.load_settings(SESSION_FILE)
            cl.login(USERNAME, PASSWORD)
            # Validate session with lightweight call
            cl.account_info()
            return cl
        except LoginRequired:
            # Session expired, need fresh login
            pass
        except Exception:
            # Session file corrupt or invalid
            pass

    # No valid session — do ONE fresh login
    if not USERNAME or not PASSWORD:
        raise RuntimeError("IG_USERNAME and IG_PASSWORD env vars required")

    try:
        cl.login(USERNAME, PASSWORD)
        cl.dump_settings(SESSION_FILE)
        return cl
    except BadPassword as e:
        raise RuntimeError(
            f"Login rejected (BadPassword). This may be IP/challenge related, not password. "
            f"Clear checkpoints manually in the Instagram app. Detail: {e}"
        )
    except ChallengeRequired as e:
        raise RuntimeError(
            f"Instagram requires challenge verification. "
            f"Log in manually in the app and clear the checkpoint. Detail: {e}"
        )
    except PleaseWaitFewMinutes:
        raise RuntimeError("Rate limited. Wait before retrying.")
    except RateLimitError:
        raise RuntimeError("Rate limited. Wait before retrying.")


# ── Actions ──

def action_test():
    try:
        cl = get_client()
        info = cl.account_info()
        output({"ok": True, "username": info.username, "pk": str(info.pk)})
    except Exception as e:
        output_error(str(e))


def action_send_dm():
    username = os.environ.get("IG_ARG_USERNAME", "")
    text = os.environ.get("IG_ARG_TEXT", "")
    if not username or not text:
        output_error("username and text required")

    try:
        cl = get_client()
        clean = username.lstrip("@").strip().lower()
        user_id = cl.user_id_from_username(clean)
        cl.direct_send(text, [user_id])
        output({"ok": True})
    except Exception as e:
        output_error(str(e))


def action_check_user():
    username = os.environ.get("IG_ARG_USERNAME", "")
    if not username:
        output_error("username required")

    try:
        cl = get_client()
        clean = username.lstrip("@").strip().lower()
        cl.user_id_from_username(clean)
        output({"ok": True, "exists": True})
    except Exception as e:
        if "not found" in str(e).lower():
            output({"ok": True, "exists": False})
        output_error(str(e))


# ── Main ──

if __name__ == "__main__":
    actions = {
        "test": action_test,
        "send_dm": action_send_dm,
        "check_user": action_check_user,
    }

    fn = actions.get(ACTION)
    if not fn:
        output_error(f"Unknown action: {ACTION}")

    fn()
