from fastapi import FastAPI, Depends
from database import create_buses_table, get_db, create_bus_timings
from models import CreateBuses, Buses, CreateBusTimings, BusesWithTimings
from sqlite3 import Connection
from typing import List

app = FastAPI()

@app.on_event("startup")
def startup():
    create_buses_table() 
    create_bus_timings()

@app.post("/buses")
def add_buses(bus: CreateBuses, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("INSERT INTO buses (bus_no, bus_type, start_bus, end_bus) VALUES (?, ?, ?, ?)",(bus.bus_no, bus.bus_type, bus.start_bus, bus.end_bus))
    db.commit()
    return {"message": "Bus added successfully"}

@app.get("/buses", response_model=List[Buses])
def get_all_buses(db: Connection = Depends(get_db)):
    cursor = db.cursor()
    
    rows = cursor.execute("SELECT * FROM buses").fetchall()
    cursor.close()
    return [dict(row) for row in rows]


@app.post("/bus_timings")
def bus_timings(time: CreateBusTimings, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("INSERT INTO bus_timings(bus_id, trip_time) VALUES(?, ?)",(time.bus_id, time.trip_time))    
    db.commit()
    cursor.close()
    return {"message":"Timings added successfully"}


@app.get("/bus_timings/{bus_id}", response_model=List[BusesWithTimings])
def bus_timings_by_id(bus_id: int, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    rows = cursor.execute("SELECT b.bus_id, b.bus_no, b.bus_type, b.start_bus, b.end_bus, t.trip_time FROM buses b JOIN bus_timings t ON b.bus_id = t.bus_id WHERE b.bus_id = ? ORDER BY t.trip_time",(bus_id,)).fetchall()
    cursor.close()
    return [dict(row) for row in rows]