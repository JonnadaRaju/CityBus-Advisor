from fastapi import FastAPI, Depends, HTTPException
from database import create_buses_table, get_db, create_bus_timings
from models import CreateBuses, Buses, CreateBusTimings, BusesWithTimings
from sqlite3 import Connection
from typing import List
from datetime import datetime

app = FastAPI()

@app.on_event("startup")
def startup():
    create_buses_table() 
    create_bus_timings()
    
# Basic route to check if the API is running

@app.get("/")
def read_root():
    return {"message": "Welcome to the Bus Management API"}

# POST route to add new buses
@app.post("/buses")
def add_buses(bus: CreateBuses, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    cursor.execute("INSERT INTO buses (bus_no, bus_type, start_bus, end_bus) VALUES (?, ?, ?, ?)",(bus.bus_no, bus.bus_type, bus.start_bus, bus.end_bus))
    db.commit()
    return {"message": "Bus added successfully"}

# GET route to fetch all buses

@app.get("/buses", response_model=List[Buses])
def get_all_buses(db: Connection = Depends(get_db)):
    cursor = db.cursor()
    
    rows = cursor.execute("SELECT * FROM buses").fetchall()
    cursor.close()
    return [dict(row) for row in rows]

# PUT route to update bus details

@app.put("/buses/{bus_id}")
def update_bus(bus_id: int, bus: CreateBuses, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    
    existing = cursor.execute("SELECT 1 FROM buses WHERE bus_id = ?",(bus_id,)).fetchone()
    
    if existing is None:
        cursor.close()
        raise HTTPException(status_code=404, detail="Bus not found")
    
    cursor.execute("UPDATE buses SET bus_no = ?, bus_type = ?, start_bus = ?, end_bus = ? WHERE bus_id = ?",(bus.bus_no, bus.bus_type, bus.start_bus, bus.end_bus, bus_id))
    
    db.commit()
    cursor.close()
    return {"message": "Bus updated successfully"}

# DELETE route to remove a bus

@app.delete("/buses/{bus_id}")
def delete_buses(bus_id: int, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    
    existing = cursor.execute("SELECT 1 FROM buses WHERE bus_id = ?",(bus_id,)).fetchone()
    
    if existing is None:
        cursor.close()
        raise HTTPException(status_code=404, detail="Bus not found")

    cursor.execute("DELETE FROM buses WHERE bus_id = ?",(bus_id,))    
    db.commit()
    return {"message":"Bus deleted successfully"}  

# POST route to add bus timings

@app.post("/bus_timings")
def bus_timings(time: List[CreateBusTimings], db: Connection = Depends(get_db)):
    cursor = db.cursor()
    
    multiple_data_insertion = [(t.bus_id, t.trip_time) for t in time]
    cursor.executemany("INSERT INTO bus_timings(bus_id, trip_time) VALUES(?, ?)",multiple_data_insertion)    
    db.commit()
    cursor.close()
    return {"message":"Timings added successfully"}

# GET route to fetch bus timings by bus ID

@app.get("/bus_timings/{bus_id}", response_model=List[BusesWithTimings])
def bus_timings_by_id(bus_id: int, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    rows = cursor.execute("SELECT b.bus_id, b.bus_no, b.bus_type, b.start_bus, b.end_bus, t.trip_time FROM buses b JOIN bus_timings t ON b.bus_id = t.bus_id WHERE b.bus_id = ? ORDER BY t.trip_time",(bus_id,)).fetchall()
    cursor.close()
    if not rows:
        raise HTTPException(status_code=404, detail="Bus not found")
    return [dict(row) for row in rows]


@app.get("/routes/buses/timings")
def show_buses_with_timings(source: str, destination: str, bus_no: str | None = None, bus_type: str | None = None, db: Connection = Depends(get_db)):
    cursor = db.cursor()

    current_time = datetime.now().strftime("%H:%M")

    query = "SELECT b.bus_no, b.bus_type, t.trip_time FROM buses b JOIN bus_timings t ON b.bus_id = t.bus_id WHERE LOWER(b.start_bus) = ? AND LOWER(b.end_bus) = ? AND t.trip_time > ?"
    params = [source.lower(), destination.lower(), current_time]
    
    if bus_no:
        query += " AND LOWER(b.bus_no) = ?"
        params.append(bus_no.lower())
        
    if bus_type:
        query += " AND LOWER(b.bus_type) = ?"
        params.append(bus_type.lower())
        
    query += " ORDER BY t.trip_time"
    
    rows = cursor.execute(query, tuple(params)).fetchall()
    cursor.close()

    if not rows:
        raise HTTPException(status_code=404,detail="No upcoming buses for today")

    grouped = {}
    
    for row in rows:
        bus = row["bus_no"] 
        
        if bus not in grouped:
            grouped[bus] = {
                "bus_no": row["bus_no"],
                "bus_type": row["bus_type"],
                "timings": []
            }
            
        grouped[bus]["timings"].append(row["trip_time"])
    
    return list(grouped.values())
