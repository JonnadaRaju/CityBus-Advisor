# 🚌 CityBus Advisor

## 📄 Current Module Specification


## Objective
The objective of this module is to **store city bus details** for the selected route using a POST-based API.  
This module forms the **data foundation** for future features like route search, timings, and alerts.

---

## Route Covered
- **Source Bus Stop:** Complex Bus Stop  
- **Destination Bus Stop:** Kommadi Bus Stop  

---

## Bus Categories
- Ordinary Buses  
- Metro Express Buses  

---

## Current Functionality
- Add bus details using **POST API**
- Store both Ordinary and Metro Express buses in the database
- Differentiate bus types using a `bus_type` field
- Persist bus data using **SQLAlchemy ORM**

---

## Technology Used
- Backend Framework: **FastAPI**
- Database: **SQLite**
- ORM: **SQLAlchemy**
- Architecture: **API-based**

---