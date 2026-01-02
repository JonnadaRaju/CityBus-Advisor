from fastapi import FastAPI, Depends
from database import create_buses_table, get_connection
from models import CreateBuses, Buses
from sqlite3 import Connection
from typing import List

app = FastAPI()

@app.on_event("startup")
def startup():
    create_buses_table()
    
@app.post("/buses")
def add_buses(bus: CreateBuses, db: Connection = Depends(get_connection)):
    cursor = db.cursor()
    cursor.execute("INSERT INTO buses (bus_no, bus_type, start_bus, end_bus) VALUES (?, ?, ?, ?)",(bus.bus_no, bus.bus_type, bus.start_bus, bus.end_bus))
    db.commit()
    db.close()
    return {"message": "Bus added successfully"}

@app.get("/buses", response_model=List[Buses])
def get_all_buses(db: Connection = Depends(get_connection)):
    cursor = db.cursor()
    
    rows = cursor.execute("SELECT * FROM buses").fetchall()
    cursor.close()
    db.close()
    return [dict(row) for row in rows]