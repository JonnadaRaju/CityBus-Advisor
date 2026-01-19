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
    
def create_bus_timings():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("CREATE TABLE IF NOT EXISTS bus_timings(timing_id INTEGER PRIMARY KEY AUTOINCREMENT, bus_id INTEGER NOT NULL, trip_time TEXT NOT NULL, FOREIGN KEY (bus_id) REFERENCES buses(bus_id))")    
    
    conn.commit()
    conn.close()
    
def create_stops_table():
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("CREATE TABLE IF NOT EXISTS stops(stop_id INTEGER PRIMARY KEY AUTOINCREMENT, stop_name TEXT UNIQUE NOT NULL)")
    
    conn.commit()
    conn.close()
    
def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
        
