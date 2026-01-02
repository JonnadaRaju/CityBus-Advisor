import sqlite3

DB_NAME = "citybus_advisor.db"

def get_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def create_buses_table():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("CREATE TABLE IF NOT EXISTS buses(bus_id INTEGER PRIMARY KEY AUTOINCREMENT, bus_no TEXT NOT NULL, bus_type TEXT NOT NULL, start_bus TEXT NOT NULL, end_bus TEXT NOT NULL)")

    conn.commit()
    conn.close()
    
def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()