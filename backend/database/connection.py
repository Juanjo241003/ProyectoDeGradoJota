"""
Gestor de Conexión y Inicialización de Base de Datos SQLite Relacional
"""
import sqlite3
import os
from backend.database.schema import DDL_SCHEMA

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "simulador_trinidad.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    try:
        conn.executescript(DDL_SCHEMA)
        conn.commit()
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    print(f"Base de datos inicializada con éxito en: {DB_PATH}")
