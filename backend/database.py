import os

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    import psycopg
    from psycopg.rows import dict_row
    
    def get_connection():
        conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
        return conn

    def create_buses_table():
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("CREATE TABLE IF NOT EXISTS buses(bus_id SERIAL PRIMARY KEY, bus_no TEXT NOT NULL, bus_type TEXT NOT NULL, start_bus TEXT NOT NULL, end_bus TEXT NOT NULL)")

        conn.commit()
        conn.close()
        
    def create_bus_timings():
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("CREATE TABLE IF NOT EXISTS bus_timings(timing_id SERIAL PRIMARY KEY, bus_id INTEGER NOT NULL, trip_time TEXT NOT NULL, FOREIGN KEY (bus_id) REFERENCES buses(bus_id) ON DELETE CASCADE)")    
        
        conn.commit()
        cursor.close()
        conn.close()
        
    def create_stops_table():
        conn = get_connection()
        cursor = conn.cursor()
        
        cursor.execute("CREATE TABLE IF NOT EXISTS stops(stop_id SERIAL PRIMARY KEY, stop_name TEXT UNIQUE NOT NULL)")
        
        conn.commit()
        cursor.close()
        conn.close()
        
    def create_place_departures_table():
        """
        New table specifically for place-based search
        Stores: place_name, bus_no, bus_type, departure_time
        """
        conn = get_connection()
        cursor = conn.cursor()

        # Check if destination column exists (for migration)
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='place_departures' AND column_name='destination'
        """)
        if cursor.fetchone():
            cursor.execute("DROP TABLE place_departures CASCADE")
            conn.commit()

        cursor.execute("""
            CREATE TABLE IF NOT EXISTS place_departures(
                departure_id SERIAL PRIMARY KEY,
                place_name TEXT NOT NULL,
                bus_no TEXT NOT NULL,
                bus_type TEXT NOT NULL,
                departure_time TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()
        
else:
    import sqlite3
    
    DB_NAME = ".citybus_advisor.db"
    
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
    def create_place_departures_table():
        conn = get_connection()
        cursor = conn.cursor()
        
        # Check if destination column exists (for migration)
        cursor.execute("PRAGMA table_info(place_departures)")
        columns = [column[1] for column in cursor.fetchall()]
        if 'destination' in columns:
            cursor.execute("DROP TABLE place_departures")
            conn.commit()

        cursor.execute("""
                CREATE TABLE IF NOT EXISTS place_departures(
                    departure_id INTEGER PRIMARY KEY AUTOINCREMENT,
                    place_name TEXT NOT NULL,
                    bus_no TEXT NOT NULL,
                    bus_type TEXT NOT NULL,
                    departure_time TEXT NOT NULL
                )
            """)
        
        # Create index for faster queries
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_place_name 
            ON place_departures(place_name)
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        
def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()
        
