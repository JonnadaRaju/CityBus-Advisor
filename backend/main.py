from fastapi import FastAPI
from database import create_buses_table

app = FastAPI()

@app.on_event("startup")
def startup():
    create_buses_table()