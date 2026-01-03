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
