import sqlite3
import os
from config import DATABASE


def get_db():
    """Open a database connection."""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    """Initialize the database from schema.sql."""
    schema_path = os.path.join(
        os.path.dirname(__file__), "..", "database", "schema.sql"
    )
    conn = get_db()
    with open(schema_path, "r") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()
