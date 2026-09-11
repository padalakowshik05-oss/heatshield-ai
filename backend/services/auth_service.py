"""
HeatShield AI — Authentication & User Management Service
=========================================================
Provides secure user credential storage via persistent SQLite,
bcrypt password hashing, and signed JWT authentication tokens.
"""

import os
import sqlite3
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta, timezone

from contextlib import contextmanager

import bcrypt
import jwt

logger = logging.getLogger(__name__)

# ============================================================
# CONFIGURATION & ENVIRONMENT
# ============================================================

ENVIRONMENT = os.getenv("ENVIRONMENT", "development").lower()

DB_DIR = Path(__file__).resolve().parent.parent / "data"
DB_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH = DB_DIR / "heatshield.db"

DATABASE_URL = os.getenv("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

IS_POSTGRES = bool(DATABASE_URL)

JWT_SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "heatshield-ai-jwt-secret-key-32chars-min-security-token-2026"
)
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))


# ============================================================
# DATABASE ABSTRACTION & INITIALIZATION
# ============================================================

class CursorWrapper:
    """Wraps DB cursor to normalize placeholder syntax and row dictionaries."""
    def __init__(self, raw_cursor, is_postgres: bool):
        self._cur = raw_cursor
        self.is_postgres = is_postgres

    @property
    def lastrowid(self):
        return getattr(self._cur, "lastrowid", None)

    def execute(self, sql: str, params=None):
        if self.is_postgres:
            sql = sql.replace("?", "%s")
        if params is None:
            return self._cur.execute(sql)
        return self._cur.execute(sql, params)

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self):
        rows = self._cur.fetchall()
        return [dict(r) for r in rows]

    def __getattr__(self, name):
        return getattr(self._cur, name)


class DBWrapper:
    """Wraps connection to provide unified cursor interface and transaction handling."""
    def __init__(self, raw_conn, is_postgres: bool):
        self._conn = raw_conn
        self.is_postgres = is_postgres

    def cursor(self):
        return CursorWrapper(self._conn.cursor(), self.is_postgres)

    def commit(self):
        return self._conn.commit()

    def rollback(self):
        return self._conn.rollback()

    def close(self):
        return self._conn.close()


@contextmanager
def get_db_connection():
    """Context manager for thread-safe DB connection (PostgreSQL or SQLite)."""
    if IS_POSTGRES:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        wrapper = DBWrapper(conn, is_postgres=True)
        try:
            yield wrapper
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    else:
        conn = sqlite3.connect(str(DB_PATH), timeout=10.0)
        conn.row_factory = sqlite3.Row
        wrapper = DBWrapper(conn, is_postgres=False)
        try:
            yield wrapper
        finally:
            conn.close()


def get_db_type() -> str:
    """Return active database engine type."""
    return "postgresql" if IS_POSTGRES else "sqlite"


def check_db_health() -> bool:
    """Quick connectivity test for health check endpoint."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
            return bool(row)
    except Exception as e:
        logger.error("DB health check failed: %s", e)
        return False


def init_db():
    """Initialize database tables and seed default demo officer account."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if IS_POSTGRES:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL,
                    hashed_password TEXT NOT NULL,
                    role TEXT DEFAULT 'officer',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_alert_logs (
                    id SERIAL PRIMARY KEY,
                    alert_id TEXT,
                    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                    recipient TEXT NOT NULL,
                    alert_level TEXT NOT NULL,
                    location TEXT NOT NULL,
                    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    status TEXT NOT NULL,
                    error_message TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_alert_states (
                    user_id INTEGER NOT NULL,
                    location TEXT NOT NULL,
                    last_emailed_level TEXT,
                    last_emailed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, location)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_monitored_locations (
                    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    monitored_latitude REAL NOT NULL,
                    monitored_longitude REAL NOT NULL,
                    monitored_location_name TEXT NOT NULL,
                    monitoring_enabled INTEGER DEFAULT 1,
                    last_risk_score REAL,
                    last_alert_level TEXT,
                    last_checked_at TIMESTAMP WITH TIME ZONE,
                    last_email_sent_at TIMESTAMP WITH TIME ZONE,
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """)
        else:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    username TEXT UNIQUE NOT NULL,
                    full_name TEXT NOT NULL,
                    hashed_password TEXT NOT NULL,
                    role TEXT DEFAULT 'officer',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_alert_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    alert_id TEXT,
                    user_id INTEGER,
                    recipient TEXT NOT NULL,
                    alert_level TEXT NOT NULL,
                    location TEXT NOT NULL,
                    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status TEXT NOT NULL,
                    error_message TEXT
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS email_alert_states (
                    user_id INTEGER NOT NULL,
                    location TEXT NOT NULL,
                    last_emailed_level TEXT,
                    last_emailed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (user_id, location)
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS user_monitored_locations (
                    user_id INTEGER PRIMARY KEY,
                    monitored_latitude REAL NOT NULL,
                    monitored_longitude REAL NOT NULL,
                    monitored_location_name TEXT NOT NULL,
                    monitoring_enabled INTEGER DEFAULT 1,
                    last_risk_score REAL,
                    last_alert_level TEXT,
                    last_checked_at TIMESTAMP,
                    last_email_sent_at TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            """)
        conn.commit()

    seed_default_user()


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password: str) -> str:
    """Hash password using bcrypt with random salt."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hashed password."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )
    except Exception:
        return False


# ============================================================
# JWT TOKEN HANDLING
# ============================================================

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create signed HMAC-SHA256 JWT access token."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate HMAC-SHA256 JWT token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


# ============================================================
# USER QUERIES
# ============================================================

def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve user dictionary by ID."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Retrieve user dictionary by email."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (email.strip(),))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Retrieve user dictionary by username."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE LOWER(username) = LOWER(?)", (username.strip(),))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_user_by_identifier(identifier: str) -> Optional[Dict[str, Any]]:
    """Lookup user by either email or username."""
    clean = identifier.strip().lower()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM users WHERE LOWER(email) = ? OR LOWER(username) = ?",
            (clean, clean)
        )
        row = cursor.fetchone()
        return dict(row) if row else None


def create_user(
    email: str,
    username: str,
    full_name: str,
    password: str,
    role: str = "officer"
) -> Dict[str, Any]:
    """Create and persist a new user."""
    clean_email = email.strip().lower()
    clean_username = username.strip().lower()
    hashed = hash_password(password)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO users (email, username, full_name, hashed_password, role)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
            """, (clean_email, clean_username, full_name.strip(), hashed, role))
            row = cursor.fetchone()
            user_id = row["id"]
        else:
            cursor.execute("""
                INSERT INTO users (email, username, full_name, hashed_password, role)
                VALUES (?, ?, ?, ?, ?)
            """, (clean_email, clean_username, full_name.strip(), hashed, role))
            conn.commit()
            user_id = cursor.lastrowid

    user = get_user_by_id(user_id)
    if not user:
        raise RuntimeError("Failed to retrieve created user")
    return user


def seed_default_user():
    """Seed initial demo officer account if in development mode."""
    if ENVIRONMENT == "production":
        return
    default_email = "officer@heatshield.ai"
    existing = get_user_by_email(default_email)
    if not existing:
        create_user(
            email=default_email,
            username="officer",
            full_name="Disaster Officer",
            password="Password123!",
            role="Disaster Management Officer"
        )


# ============================================================
# EMAIL ALERT AUDIT LOGGING & STATE MANAGEMENT
# ============================================================

def log_email_attempt(
    recipient: str,
    alert_level: str,
    location: str,
    status: str,
    alert_id: Optional[str] = None,
    user_id: Optional[int] = None,
    error_message: Optional[str] = None,
) -> int:
    """Log an email dispatch attempt to the database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if IS_POSTGRES:
            cursor.execute("""
                INSERT INTO email_alert_logs (alert_id, user_id, recipient, alert_level, location, status, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                RETURNING id
            """, (alert_id, user_id, recipient, alert_level, location, status, error_message))
            row = cursor.fetchone()
            return row["id"] if row else 0
        else:
            cursor.execute("""
                INSERT INTO email_alert_logs (alert_id, user_id, recipient, alert_level, location, status, error_message)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (alert_id, user_id, recipient, alert_level, location, status, error_message))
            conn.commit()
            return cursor.lastrowid


def get_last_emailed_level(user_id: int, location: str) -> Optional[str]:
    """Retrieve the alert_level of the most recent notification state for user and location."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT last_emailed_level FROM email_alert_states
            WHERE user_id = ? AND LOWER(location) = LOWER(?)
        """, (user_id, location.strip()))
        row = cursor.fetchone()
        return row["last_emailed_level"] if row else None


def update_last_emailed_level(user_id: int, location: str, level: Optional[str]) -> None:
    """Update or insert the tracked last emailed alert level for user and location."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO email_alert_states (user_id, location, last_emailed_level, last_emailed_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, location) DO UPDATE SET
                last_emailed_level = excluded.last_emailed_level,
                last_emailed_at = CURRENT_TIMESTAMP
        """, (user_id, location.strip().lower(), level))
        conn.commit()


def get_email_logs_for_user(user_id: int, limit: int = 20) -> list:
    """Retrieve recent email notification logs for a user."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, alert_id, recipient, alert_level, location, sent_at, status, error_message
            FROM email_alert_logs
            WHERE user_id = ?
            ORDER BY id DESC LIMIT ?
        """, (user_id, limit))
        return [dict(row) for row in cursor.fetchall()]


# ============================================================
# USER MONITORED LOCATIONS (AUTONOMOUS MONITORING)
# ============================================================

def set_user_monitored_location(
    user_id: int,
    latitude: float,
    longitude: float,
    location_name: str,
    monitoring_enabled: bool = True,
) -> Dict[str, Any]:
    """Store or update user explicit consent for monitored coordinates."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO user_monitored_locations (
                user_id, monitored_latitude, monitored_longitude, monitored_location_name,
                monitoring_enabled, updated_at
            )
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
                monitored_latitude = excluded.monitored_latitude,
                monitored_longitude = excluded.monitored_longitude,
                monitored_location_name = excluded.monitored_location_name,
                monitoring_enabled = excluded.monitoring_enabled,
                updated_at = CURRENT_TIMESTAMP
        """, (user_id, float(latitude), float(longitude), location_name.strip(), 1 if monitoring_enabled else 0))
        conn.commit()

    return get_user_monitored_location(user_id)


def get_user_monitored_location(user_id: int) -> Optional[Dict[str, Any]]:
    """Retrieve user's active monitored location record."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT user_id, monitored_latitude, monitored_longitude, monitored_location_name,
                   monitoring_enabled, last_risk_score, last_alert_level, last_checked_at,
                   last_email_sent_at, updated_at
            FROM user_monitored_locations
            WHERE user_id = ?
        """, (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else None


def get_all_active_monitored_locations() -> list:
    """Retrieve all locations with active monitoring joined with user accounts."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT m.user_id, m.monitored_latitude, m.monitored_longitude, m.monitored_location_name,
                   m.last_risk_score, m.last_alert_level, m.last_checked_at, m.last_email_sent_at,
                   u.email, u.full_name
            FROM user_monitored_locations m
            JOIN users u ON m.user_id = u.id
            WHERE m.monitoring_enabled = 1
        """)
        return [dict(row) for row in cursor.fetchall()]


def update_monitored_location_state(
    user_id: int,
    risk_score: float,
    alert_level: str,
    email_sent: bool = False,
) -> None:
    """Update telemetry and alert transition state for a monitored location."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if email_sent:
            cursor.execute("""
                UPDATE user_monitored_locations
                SET last_risk_score = ?,
                    last_alert_level = ?,
                    last_checked_at = CURRENT_TIMESTAMP,
                    last_email_sent_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (float(risk_score), alert_level, user_id))
        else:
            cursor.execute("""
                UPDATE user_monitored_locations
                SET last_risk_score = ?,
                    last_alert_level = ?,
                    last_checked_at = CURRENT_TIMESTAMP
                WHERE user_id = ?
            """, (float(risk_score), alert_level, user_id))
        conn.commit()


# Initialize database on module load (safe fallback if connection is deferred)
try:
    init_db()
except Exception as e:
    logger.warning("Initial init_db deferred or failed: %s", e)



