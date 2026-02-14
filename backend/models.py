from pydantic import BaseModel

class CreateBuses(BaseModel):
    bus_no: str
    bus_type: str
    start_bus: str
    end_bus: str
    
class Buses(BaseModel):
    bus_id: int
    bus_no: str
    bus_type: str
    start_bus: str
    end_bus: str
    
class CreateBusTimings(BaseModel):
    bus_id: int
    trip_time: str

class BusesWithTimings(BaseModel):
    bus_id: int
    bus_no: str
    bus_type: str
    start_bus: str
    end_bus: str
    trip_time: str

# Separate models for request and response
class CreateBusStop(BaseModel):
    stop_name: str

class BusStop(BaseModel):
    stop_id: int
    stop_name: str
    
class CreatePlaceDeparture(BaseModel):
    place_name: str
    bus_no: str
    bus_type: str
    departure_time: str

class PlaceDeparture(BaseModel):
    departure_id: int
    place_name: str
    bus_no: str
    bus_type: str
    departure_time: str
    