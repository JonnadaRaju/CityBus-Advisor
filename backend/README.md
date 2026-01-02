## CityBus Advisor
### Scope

**Scope of CityBus Advisor:**
- City-level public bus guidance system
- Supports **source → destination** bus searching
- Covers **Ordinary** and **Metro Express** buses
- Displays **bus numbers and full-day timings**
- Provides **return journey alert notifications**
- Suggests **better boarding stops** based on crowd logic
- Works with **predefined bus schedules**

### Specification

#### Frontend Specifications:
- HTML for structure
- Tailwind CSS for styling and responsive design
- JavaScript / TypeScript for client-side logic
- API-based communication with backend

#### Backend Specifications:
- Framework: **FastAPI**
- API-based architecture
- RESTful endpoints for search, buses, alerts, and suggestions

#### Database Specifications:
- Database: **SQLite / MySQL**
- Relational database design
- Tables for users, buses, routes, stops, and timings
- ORM-based access using SQLAlchemy

#### Functional Specifications:
- User signup and login
- Source → destination bus search
- Bus categorization (Ordinary / Metro Express)
- Bus route and timing management
- Return journey alert logic based on system time
- Crowd-aware boarding suggestion logic based on route start point and distance
