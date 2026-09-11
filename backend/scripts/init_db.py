"""
HeatShield AI — Standalone Database Initialization Script
==========================================================
Used during build or deployment steps (e.g. Railway / Render)
to ensure database tables and schemas are created.

Usage:
    python scripts/init_db.py
"""

import sys
from pathlib import Path

# Ensure backend root is in sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from services.auth_service import init_db, check_db_health, get_db_type, IS_POSTGRES


def main():
    db_type = get_db_type()
    print(f"[*] Initializing HeatShield AI database ({db_type.upper()})...")
    try:
        init_db()
        healthy = check_db_health()
        if healthy:
            print(f"[+] Database initialization successful. Engine: {db_type.upper()} | Status: HEALTHY")
            sys.exit(0)
        else:
            print(f"[-] Database connectivity check returned unhealthy state.")
            sys.exit(1)
    except Exception as e:
        print(f"[!] Error initializing database: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
