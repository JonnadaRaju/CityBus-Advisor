from fastapi import FastAPI, Depends, HTTPException
from database import create_buses_table, get_db, create_bus_timings, create_stops_table, create_place_departures_table
from models import CreateBuses, Buses, CreateBusTimings, BusesWithTimings, CreateBusStop, BusStop, CreatePlaceDeparture, PlaceDeparture
from typing import List, Any
Connection = Any
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import os


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    create_buses_table() 
    create_bus_timings()
    create_stops_table()
    create_place_departures_table()
        
# Basic route to check if the API is running

@app.get("/")
def read_root():
    return {"message": "Welcome to the Bus Management API"}

# POST route to add new buses
@app.post("/buses")
def add_buses(bus: CreateBuses, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    try:    
        cursor.execute("INSERT INTO buses (bus_no, bus_type, start_bus, end_bus) VALUES (%s, %s, %s, %s)",(bus.bus_no, bus.bus_type, bus.start_bus, bus.end_bus))
        db.commit()
    finally:
        cursor.close()
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
    
    existing = cursor.execute("SELECT 1 FROM buses WHERE bus_id = %s",(bus_id,)).fetchone()
    
    if existing is None:
        cursor.close()
        raise HTTPException(status_code=404, detail="Bus not found")
    
    cursor.execute("UPDATE buses SET bus_no = %s, bus_type = %s, start_bus = %s, end_bus = %s WHERE bus_id = %s",(bus.bus_no, bus.bus_type, bus.start_bus, bus.end_bus, bus_id))
    
    db.commit()
    cursor.close()
    return {"message": "Bus updated successfully"}

# DELETE route to remove a bus

@app.delete("/buses/{bus_id}")
def delete_buses(bus_id: int, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    
    existing = cursor.execute("SELECT 1 FROM buses WHERE bus_id = %s",(bus_id,)).fetchone()
    
    if existing is None:
        cursor.close()
        raise HTTPException(status_code=404, detail="Bus not found")

    cursor.execute("DELETE FROM buses WHERE bus_id = %s",(bus_id,))    
    db.commit()
    cursor.close()
    return {"message":"Bus deleted successfully"}  

# POST route to add bus timings

@app.post("/bus_timings")
def bus_timings(time: List[CreateBusTimings], db: Connection = Depends(get_db)):
    cursor = db.cursor()
    
    multiple_data_insertion = [(t.bus_id, t.trip_time) for t in time]
    cursor.executemany("INSERT INTO bus_timings(bus_id, trip_time) VALUES(%s, %s)",multiple_data_insertion)    
    db.commit()
    cursor.close()
    return {"message":"Timings added successfully"}

# GET route to fetch bus timings by bus ID

@app.get("/bus_timings/{bus_id}", response_model=List[BusesWithTimings])
def bus_timings_by_id(bus_id: int, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    rows = cursor.execute("SELECT b.bus_id, b.bus_no, b.bus_type, b.start_bus, b.end_bus, t.trip_time FROM buses b JOIN bus_timings t ON b.bus_id = t.bus_id WHERE b.bus_id = %s ORDER BY t.trip_time",(bus_id,)).fetchall()
    cursor.close()
    if not rows:
        raise HTTPException(status_code=404, detail="Bus not found")
    return [dict(row) for row in rows]


@app.get("/routes/buses/timings")
def show_buses_with_timings(source: str, destination: str, bus_no: str | None = None, bus_type: str | None = None, db: Connection = Depends(get_db)):
    cursor = db.cursor()

    current_time = datetime.now().strftime("%H:%M")

    query = "SELECT b.bus_no, b.bus_type, t.trip_time FROM buses b JOIN bus_timings t ON b.bus_id = t.bus_id WHERE LOWER(b.start_bus) = %s AND LOWER(b.end_bus) = %s AND t.trip_time > %s"
    params = [source.lower(), destination.lower(), current_time]
    
    if bus_no:
        query += " AND LOWER(b.bus_no) = %s"
        params.append(bus_no.lower())
        
    if bus_type:
        query += " AND LOWER(b.bus_type) = %s"
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

@app.post("/stops")
def create_stops(stop: CreateBusStop, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    stop_name = stop.stop_name.strip().lower()
    
    try:
        cursor.execute("INSERT INTO stops(stop_name) VALUES(%s)", (stop_name,))
        db.commit()
    except Exception:
        raise HTTPException(status_code=400, detail="Stop already exists")
    finally:
        cursor.close()
    
    return {"message": "Bus Stop added successfully"}

@app.get("/stops", response_model=List[BusStop])
def get_stops(db: Connection = Depends(get_db)):
    cursor = db.cursor()
    
    rows = cursor.execute("SELECT stop_id, stop_name FROM stops").fetchall()
    cursor.close()
    
    return [dict(row) for row in rows]  

@app.put("/stops/{stop_id}")
def update_stops(stop_id: int, stop: CreateBusStop, db: Connection = Depends(get_db)):
    cursor = db.cursor()
    existing = cursor.execute("SELECT 1 FROM stops WHERE stop_id = %s", (stop_id,)).fetchone()
    
    if existing is None:
        cursor.close()
        raise HTTPException(status_code=404, detail="Stop not found")
    
    stop_name = stop.stop_name.strip().lower()
    
    try:
        cursor.execute("UPDATE stops SET stop_name = %s WHERE stop_id = %s", (stop_name, stop_id))
        db.commit()
    except Exception:
        raise HTTPException(status_code=400, detail="Stop name already exists")
    finally:
        cursor.close()
    
    return {"message": "Bus Stop updated successfully"}
@app.delete("/stops/{stop_id}")
def delete_stops(stop_id: int, db: Connection = Depends(get_db)):       
    cursor = db.cursor()
    existing = cursor.execute("SELECT 1 FROM stops WHERE stop_id = %s", (stop_id,)).fetchone()
    
    if existing is None:
        cursor.close()
        raise HTTPException(status_code=404, detail="Stop not found")

    cursor.execute("DELETE FROM stops WHERE stop_id = %s", (stop_id,))    
    db.commit()
    cursor.close()
    
    return {"message": "Bus Stop deleted successfully"}

@app.post("/place_departures")
def add_place_departure(departure: CreatePlaceDeparture, db: Connection = Depends(get_db)):
    """Add a single departure for a place"""
    cursor = db.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO place_departures 
            (place_name, bus_no, bus_type, departure_time) 
            VALUES (%s, %s, %s, %s)
        """, (
            departure.place_name.strip().lower(),
            departure.bus_no.strip(),
            departure.bus_type.strip().lower(),
            departure.departure_time
        ))
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to add departure: {str(e)}")
    finally:
        cursor.close()
    
    return {"message": "Departure added successfully"}


@app.get("/place_departures/{place_name}")
def get_departures_by_place(place_name: str, db: Connection = Depends(get_db)):
    """
    Get all departures from a specific place
    Returns buses grouped by bus_no with all their timings
    """
    cursor = db.cursor()
    
    rows = cursor.execute("""
        SELECT bus_no, bus_type, departure_time
        FROM place_departures
        WHERE LOWER(place_name) = %s
        ORDER BY bus_no, departure_time
    """, (place_name.lower(),)).fetchall()
    
    cursor.close()
    
    if not rows:
        raise HTTPException(
            status_code=404,
            detail=f"No departures found from '{place_name}'"
        )
    
    # Group by bus number
    buses_dict = {}
    
    for row in rows:
        bus_no = row["bus_no"]
        
        if bus_no not in buses_dict:
            buses_dict[bus_no] = {
                "bus_type": row["bus_type"],
                "timings": []
            }
        
        buses_dict[bus_no]["timings"].append(row["departure_time"])
    
    return {
        "place": place_name,
        "buses": buses_dict
    }


@app.get("/place_departures", response_model=List[PlaceDeparture])
def get_all_place_departures(db: Connection = Depends(get_db)):
    """Get all place departures"""
    cursor = db.cursor()
    rows = cursor.execute("SELECT * FROM place_departures ORDER BY place_name, departure_time").fetchall()
    cursor.close()
    return [dict(row) for row in rows]


@app.put("/place_departures/{departure_id}")
def update_place_departure(departure_id: int, departure: CreatePlaceDeparture, db: Connection = Depends(get_db)):
    """Update a specific departure"""
    cursor = db.cursor()
    
    existing = cursor.execute("SELECT 1 FROM place_departures WHERE departure_id = %s", (departure_id,)).fetchone()
    if not existing:
        cursor.close()
        raise HTTPException(status_code=404, detail="Departure not found")
        
    try:
        cursor.execute("""
            UPDATE place_departures 
            SET place_name = %s, bus_no = %s, bus_type = %s, departure_time = %s
            WHERE departure_id = %s
        """, (
            departure.place_name.strip().lower(),
            departure.bus_no.strip(),
            departure.bus_type.strip().lower(),
            departure.departure_time,
            departure_id
        ))
        db.commit()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update departure: {str(e)}")
    finally:
        cursor.close()
    
    return {"message": "Departure updated successfully"}


@app.get("/places/list")
def get_all_places(db: Connection = Depends(get_db)):
    """Get list of all unique places that have departures"""
    cursor = db.cursor()
    
    rows = cursor.execute("""
        SELECT DISTINCT place_name 
        FROM place_departures 
        ORDER BY place_name
    """).fetchall()
    
    cursor.close()
    
    return [row["place_name"] for row in rows]


@app.delete("/place_departures/{departure_id}")
def delete_place_departure(departure_id: int, db: Connection = Depends(get_db)):
    """Delete a specific departure"""
    cursor = db.cursor()
    
    existing = cursor.execute(
        "SELECT 1 FROM place_departures WHERE departure_id = %s", 
        (departure_id,)
    ).fetchone()
    
    if not existing:
        cursor.close()
        raise HTTPException(status_code=404, detail="Departure not found")
    
    cursor.execute("DELETE FROM place_departures WHERE departure_id = %s", (departure_id,))
    db.commit()
    cursor.close()
    
    return {"message": "Departure deleted successfully"}


@app.post("/place_departures/sync")
def sync_place_departures_from_buses(db: Connection = Depends(get_db)):
    """
    Auto-populate place_departures table from existing buses and timings
    This helps migrate your existing data
    """
    cursor = db.cursor()
    
    cursor.execute("DELETE FROM place_departures")
    
    rows = cursor.execute("""
        SELECT 
            b.start_bus as place_name,
            b.bus_no,
            b.bus_type,
            t.trip_time as departure_time
        FROM buses b
        LEFT JOIN bus_timings t ON b.bus_id = t.bus_id
        WHERE t.trip_time IS NOT NULL
        ORDER BY b.start_bus, b.bus_no, t.trip_time
    """).fetchall()
    
    if not rows:
        cursor.close()
        return {"message": "No data to sync"}
    
    data = [
        (row["place_name"].lower(), row["bus_no"], 
         row["bus_type"].lower(), 
         row["departure_time"])
        for row in rows
    ]
    
    cursor.executemany("""
        INSERT INTO place_departures 
        (place_name, bus_no, bus_type, departure_time) 
        VALUES (%s, %s, %s, %s)
    """, data)
    
    db.commit()
    synced_count = len(data)
    cursor.close()
    
    return {
        "message": f"Successfully synced {synced_count} departures",
        "count": synced_count
    }
