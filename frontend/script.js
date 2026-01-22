// ==========================================
// CITY BUS ADVISOR - JAVASCRIPT (COMPLETE WITH NEW PLACE SYSTEM)
// ==========================================

// API Configuration - Detect local vs production
const API_BASE_URL = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
    ? "http://127.0.0.1:8000"
    : "https://api.citybusadvisor.12022001.xyz";

// State Management (IN-MEMORY ONLY - no localStorage)
const state = {
    buses: [],
    stops: [],
    timings: [],
    placeDepartures: [], // NEW
    editingBusId: null,
    editingStopId: null,
    editingPlaceDepId: null, // NEW
    isAdminLoggedIn: false
};

// Admin credentials
const ADMIN_CREDENTIALS = {
    username: 'raju',
    password: 'Raju@2001'
};

// ==========================================
// NAVIGATION FUNCTIONS
// ==========================================

function showSection(sectionName) {
    const sections = document.querySelectorAll('.content-section');
    const navButtons = document.querySelectorAll('.nav-btn, .mobile-nav-btn');

    sections.forEach(section => section.classList.remove('active'));
    navButtons.forEach(btn => btn.classList.remove('active'));

    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        // Save state
        sessionStorage.setItem('activeSection', sectionName);
    }

    // Update nav buttons
    const matchingButtons = document.querySelectorAll(`[data-section="${sectionName}"]`);
    matchingButtons.forEach(btn => btn.classList.add('active'));

    // Close mobile menu
    document.getElementById('mobile-menu').classList.add('hidden');
}

// Make showSection globally available
window.showSection = showSection;

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

function checkAdminAuth() {
    updateAdminUI();
    return state.isAdminLoggedIn;
}

function loginAdmin(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        state.isAdminLoggedIn = true;
        updateAdminUI();
        return true;
    }
    return false;
}

function logoutAdmin() {
    state.isAdminLoggedIn = false;
    updateAdminUI();
    showSection('home');
}

function updateAdminUI() {
    const adminElements = document.querySelectorAll('.admin-only');
    const loginBtn = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const mobileLoginBtn = document.getElementById('mobile-admin-login-btn');
    const mobileLogoutBtn = document.getElementById('mobile-admin-logout-btn');

    if (state.isAdminLoggedIn) {
        adminElements.forEach(el => el.style.display = '');
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = '';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = '';
    } else {
        adminElements.forEach(el => el.style.display = 'none');
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('.toast-icon');

    toastMessage.textContent = message;
    toast.className = 'toast';

    if (type === 'error') {
        toast.classList.add('error');
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
    } else if (type === 'warning') {
        toast.classList.add('warning');
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
    } else {
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
    }

    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 3000);
}

function setLoading(isLoading) {
    const overlay = document.getElementById('loading-overlay');
    if (isLoading) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// NEW: Get current time in HH:MM format
function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// NEW: Check if time is in future
function isFutureTime(time) {
    const current = getCurrentTime();
    return time > current;
}

// ==========================================
// API FUNCTIONS - BUSES
// ==========================================

async function fetchBuses() {
    try {
        const response = await fetch(`${API_BASE_URL}/buses`);
        if (!response.ok) throw new Error('Failed to fetch buses');
        state.buses = await response.json();
        return state.buses;
    } catch (error) {
        console.error('Error fetching buses:', error);
        showToast('Failed to fetch buses', 'error');
        return [];
    }
}

async function addBus(busData) {
    try {
        const response = await fetch(`${API_BASE_URL}/buses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(busData)
        });
        if (!response.ok) throw new Error('Failed to add bus');
        return await response.json();
    } catch (error) {
        console.error('Error adding bus:', error);
        throw error;
    }
}

async function updateBus(busId, busData) {
    try {
        const response = await fetch(`${API_BASE_URL}/buses/${busId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(busData)
        });
        if (!response.ok) throw new Error('Failed to update bus');
        return await response.json();
    } catch (error) {
        console.error('Error updating bus:', error);
        throw error;
    }
}

async function deleteBus(busId) {
    try {
        const response = await fetch(`${API_BASE_URL}/buses/${busId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete bus');
        return await response.json();
    } catch (error) {
        console.error('Error deleting bus:', error);
        throw error;
    }
}

// ==========================================
// API FUNCTIONS - STOPS
// ==========================================

async function fetchStops() {
    try {
        const response = await fetch(`${API_BASE_URL}/stops`);
        if (!response.ok) throw new Error('Failed to fetch stops');
        state.stops = await response.json();
        return state.stops;
    } catch (error) {
        console.error('Error fetching stops:', error);
        showToast('Failed to fetch stops', 'error');
        return [];
    }
}

async function addStop(stopData) {
    try {
        const response = await fetch(`${API_BASE_URL}/stops`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stopData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add stop');
        }
        return await response.json();
    } catch (error) {
        console.error('Error adding stop:', error);
        throw error;
    }
}

async function updateStop(stopId, stopData) {
    try {
        const response = await fetch(`${API_BASE_URL}/stops/${stopId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(stopData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update stop');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating stop:', error);
        throw error;
    }
}

async function deleteStop(stopId) {
    try {
        const response = await fetch(`${API_BASE_URL}/stops/${stopId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete stop');
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting stop:', error);
        throw error;
    }
}

// ==========================================
// API FUNCTIONS - BUS TIMINGS
// ==========================================

async function addBusTimings(timingsData) {
    try {
        const response = await fetch(`${API_BASE_URL}/bus_timings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(timingsData)
        });
        if (!response.ok) throw new Error('Failed to add timings');
        return await response.json();
    } catch (error) {
        console.error('Error adding timings:', error);
        throw error;
    }
}

async function fetchBusTimings(busId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bus_timings/${busId}`);
        if (!response.ok) {
            if (response.status === 404) return [];
            throw new Error('Failed to fetch timings');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching timings:', error);
        return [];
    }
}

async function deleteBusTiming(timingId) {
    try {
        const response = await fetch(`${API_BASE_URL}/bus_timings/${timingId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete timing');
        return await response.json();
    } catch (error) {
        console.error('Error deleting timing:', error);
        throw error;
    }
}

// ==========================================
// API FUNCTIONS - ROUTE SEARCH
// ==========================================

async function searchBuses(source, destination, busNo = null, busType = null) {
    try {
        let url = `${API_BASE_URL}/routes/buses/timings?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;
        if (busNo) url += `&bus_no=${encodeURIComponent(busNo)}`;
        if (busType) url += `&bus_type=${encodeURIComponent(busType)}`;

        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) return [];
            throw new Error('Failed to search buses');
        }
        return await response.json();
    } catch (error) {
        console.error('Error searching buses:', error);
        throw error;
    }
}

// ==========================================
// API FUNCTIONS - PLACE SEARCH (NEW TABLE)
// ==========================================

async function fetchPlaces() {
    try {
        const response = await fetch(`${API_BASE_URL}/places/list`);
        if (!response.ok) throw new Error('Failed to fetch places');
        return await response.json();
    } catch (error) {
        console.error('Error fetching places:', error);
        return [];
    }
}

// NEW: Fetch all departures (for admin)
async function fetchAllPlaceDepartures() {
    try {
        const response = await fetch(`${API_BASE_URL}/place_departures`);
        if (!response.ok) throw new Error('Failed to fetch all departures');
        state.placeDepartures = await response.json();
        return state.placeDepartures;
    } catch (error) {
        console.error('Error fetching all departures:', error);
        return [];
    }
}

async function addPlaceDeparture(depData) {
    try {
        const response = await fetch(`${API_BASE_URL}/place_departures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(depData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to add departure');
        }
        return await response.json();
    } catch (error) {
        console.error('Error adding departure:', error);
        throw error;
    }
}

async function updatePlaceDeparture(depId, depData) {
    try {
        const response = await fetch(`${API_BASE_URL}/place_departures/${depId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(depData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to update departure');
        }
        return await response.json();
    } catch (error) {
        console.error('Error updating departure:', error);
        throw error;
    }
}

async function deletePlaceDeparture(depId) {
    try {
        const response = await fetch(`${API_BASE_URL}/place_departures/${depId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to delete departure');
        }
        return await response.json();
    } catch (error) {
        console.error('Error deleting departure:', error);
        throw error;
    }
}

async function getDeparturesByPlace(place) {
    try {
        const url = `${API_BASE_URL}/place_departures/${encodeURIComponent(place)}`;

        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error('No departures found from this location');
            }
            throw new Error('Failed to fetch departures');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching departures:', error);
        throw error;
    }
}

async function syncPlaceDepartures() {
    try {
        const response = await fetch(`${API_BASE_URL}/place_departures/sync`, {
            method: 'POST'
        });
        if (!response.ok) throw new Error('Failed to sync data');
        return await response.json();
    } catch (error) {
        console.error('Error syncing:', error);
        throw error;
    }
}

// ==========================================
// UI RENDERING FUNCTIONS
// ==========================================

async function populateStopDropdowns() {
    // Get stops from the database for route search
    const stops = await fetchStops();

    // Populate source and destination dropdowns (route search)
    const routeDropdowns = [
        document.getElementById('source'),
        document.getElementById('destination')
    ];

    routeDropdowns.forEach(dropdown => {
        if (!dropdown) return;

        const currentValue = dropdown.value;
        dropdown.innerHTML = '<option value="">Select stop</option>';

        stops.forEach(stop => {
            const option = document.createElement('option');
            option.value = stop.stop_name;
            option.textContent = capitalize(stop.stop_name);
            dropdown.appendChild(option);
        });

        if (currentValue) dropdown.value = currentValue;
    });

    // Populate place dropdown from place_departures table
    const placeDropdown = document.getElementById('place-select');
    if (placeDropdown) {
        const currentValue = placeDropdown.value;
        const places = await fetchPlaces(); // Get from new table

        placeDropdown.innerHTML = '<option value="">Choose a location</option>';

        places.forEach(place => {
            const option = document.createElement('option');
            option.value = place;
            option.textContent = capitalize(place);
            placeDropdown.appendChild(option);
        });

        if (currentValue) placeDropdown.value = currentValue;
    }
}

function renderBusesList(buses) {
    const container = document.getElementById('buses-list');

    if (!buses || buses.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No buses found</p>';
        return;
    }

    container.innerHTML = buses.map(bus => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${bus.bus_no}</div>
                <div class="list-item-subtitle">
                    ${capitalize(bus.bus_type)} • ${capitalize(bus.start_bus)} → ${capitalize(bus.end_bus)}
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon edit" onclick="editBus(${bus.bus_id})">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="btn-icon delete" onclick="confirmDeleteBus(${bus.bus_id})">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function renderStopsList(stops) {
    const container = document.getElementById('stops-list');

    if (!stops || stops.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No stops found</p>';
        return;
    }

    container.innerHTML = stops.map(stop => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${capitalize(stop.stop_name)}</div>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon edit" onclick="editStop(${stop.stop_id})">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="btn-icon delete" onclick="confirmDeleteStop(${stop.stop_id})">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function renderSearchResults(results) {
    const container = document.getElementById('results-container');
    const resultsSection = document.getElementById('search-results');
    const resultsCount = document.getElementById('results-count');

    if (!results || results.length === 0) {
        resultsSection.classList.add('hidden');
        showToast('No buses found for this route', 'warning');
        return;
    }

    resultsSection.classList.remove('hidden');
    resultsCount.textContent = `${results.length} ${results.length === 1 ? 'bus' : 'buses'} found`;

    container.innerHTML = results.map(bus => {
        // Filter only future timings
        const futureTimings = bus.timings.filter(time => isFutureTime(time));

        if (futureTimings.length === 0) {
            return ''; // Skip buses with no future timings
        }

        return `
            <div class="bus-card">
                <div class="bus-number">${bus.bus_no}</div>
                <span class="bus-type-badge bus-type-${bus.bus_type.toLowerCase()}">${capitalize(bus.bus_type)}</span>
                <div class="timings-container">
                    ${futureTimings.map((time, index) => `
                        <span class="timing-badge ${index < 2 ? 'timing-highlighted' : ''}">${formatTime(time)}</span>
                    `).join('')}
                </div>
            </div>
        `;
    }).filter(html => html !== '').join('');

    // If all buses were filtered out, show message
    if (container.innerHTML === '') {
        resultsSection.classList.add('hidden');
        showToast('No upcoming buses found for today', 'warning');
    }
}

// ==========================================
// PLACE SEARCH RENDERING (NEW)
// ==========================================

function renderPlaceResults(data) {
    const container = document.getElementById('place-results-container');
    const resultsSection = document.getElementById('place-results');
    const resultsTitle = document.getElementById('place-results-title');
    const resultsCount = document.getElementById('place-results-count');

    if (!data || !data.buses || Object.keys(data.buses).length === 0) {
        resultsSection.classList.add('hidden');
        showToast('No buses found from this location', 'warning');
        return;
    }

    resultsSection.classList.remove('hidden');
    resultsTitle.textContent = `Departures from ${capitalize(data.place)}`;

    const currentTime = getCurrentTime();
    const busCount = Object.keys(data.buses).length;
    resultsCount.textContent = `${busCount} ${busCount === 1 ? 'bus' : 'buses'}`;

    // Show ALL timings (past and future)
    container.innerHTML = Object.entries(data.buses).map(([busNo, busData]) => {
        if (busData.timings.length === 0) {
            return `
                <div class="bus-card">
                    <div class="bus-number">${busNo}</div>
                    <span class="bus-type-badge bus-type-${busData.bus_type.toLowerCase()}">${capitalize(busData.bus_type)}</span>
                    <p class="text-gray-500 mt-3 text-sm">No timings available</p>
                </div>
            `;
        }

        return `
            <div class="bus-card">
                <div class="bus-number">${busNo}</div>
                <span class="bus-type-badge bus-type-${busData.bus_type.toLowerCase()}">${capitalize(busData.bus_type)}</span>
                <div class="timings-container">
                    ${busData.timings.map((time) => {
            const isFuture = time > currentTime;
            const futureTimings = busData.timings.filter(t => t > currentTime);
            const isNextTwo = isFuture && futureTimings.indexOf(time) < 2;

            return `<span class="timing-badge ${isNextTwo ? 'timing-highlighted' : ''} ${!isFuture ? 'timing-past' : ''}">${formatTime(time)}</span>`;
        }).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// NEW: Render admin list of place departures
function renderAdminPlaceDepsList(deps) {
    const container = document.getElementById('place-deps-list');
    const filterText = document.getElementById('place-dep-filter').value.toLowerCase();

    if (!deps || deps.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No departures found</p>';
        return;
    }

    const filtered = deps.filter(d =>
        d.place_name.toLowerCase().includes(filterText) ||
        d.bus_no.toLowerCase().includes(filterText)
    );

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No matching departures found</p>';
        return;
    }

    container.innerHTML = filtered.map(dep => `
        <div class="list-item">
            <div class="list-item-content">
                <div class="list-item-title">${capitalize(dep.place_name)}</div>
                <div class="list-item-subtitle">
                    ${dep.bus_no} (${capitalize(dep.bus_type)}) • <span class="font-bold">${formatTime(dep.departure_time)}</span>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn-icon edit" onclick="editPlaceDep(${dep.departure_id})">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button class="btn-icon delete" onclick="confirmDeletePlaceDep(${dep.departure_id})">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

async function populateTimingBusSelect() {
    const buses = await fetchBuses();
    const select = document.getElementById('timing-bus-select');

    if (!select) return;

    select.innerHTML = '<option value="">Choose a bus</option>';

    buses.forEach(bus => {
        const option = document.createElement('option');
        option.value = bus.bus_id;
        option.textContent = `${bus.bus_no} - ${capitalize(bus.start_bus)} → ${capitalize(bus.end_bus)}`;
        select.appendChild(option);
    });
}

async function renderTimingsDisplay() {
    const container = document.getElementById('timings-display');

    if (!container) return;

    const buses = await fetchBuses();

    if (!buses || buses.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No buses available</p>';
        return;
    }

    let html = '';

    for (const bus of buses) {
        const timings = await fetchBusTimings(bus.bus_id);

        if (timings && timings.length > 0) {
            const tripTimes = timings.map(t => t.trip_time);

            html += `
                <div class="card-gradient">
                    <h4 class="font-display font-bold text-dark mb-2">${bus.bus_no}</h4>
                    <p class="text-sm text-gray-600 mb-3">
                        ${capitalize(bus.start_bus)} → ${capitalize(bus.end_bus)}
                    </p>
                    <div class="flex flex-wrap gap-2">
                        ${tripTimes.map(time => `
                            <span class="timing-badge">${formatTime(time)}</span>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    if (html === '') {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No timings added yet</p>';
    } else {
        container.innerHTML = html;
    }
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function setupModalHandlers() {
    const modal = document.getElementById('admin-modal');
    const loginBtn = document.getElementById('admin-login-btn');
    const mobileLoginBtn = document.getElementById('mobile-admin-login-btn');
    const closeBtn = document.getElementById('close-modal');
    const overlay = modal.querySelector('.modal-overlay');
    const loginForm = document.getElementById('admin-login-form');

    const openModal = () => {
        modal.classList.remove('hidden');
        document.getElementById('admin-username').focus();
    };

    const closeModal = () => {
        modal.classList.add('hidden');
        loginForm.reset();
    };

    if (loginBtn) {
        loginBtn.addEventListener('click', openModal);
    }
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', () => {
            openModal();
            document.getElementById('mobile-menu').classList.add('hidden');
        });
    }

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });

    // Ctrl+Shift+A shortcut
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            e.preventDefault();
            console.log('Admin shortcut detected!');
            if (!state.isAdminLoggedIn) {
                openModal();
                showToast('Admin login opened', 'success');
            }
        }
    });

    // Triple 'A' press shortcut (alternative)
    let aPressCount = 0;
    let aPressTimer = null;

    document.addEventListener('keydown', (e) => {
        if (e.key === 'a' || e.key === 'A') {
            aPressCount++;
            console.log('A pressed:', aPressCount, 'times');

            if (aPressCount === 3) {
                console.log('Triple A detected - opening admin!');
                if (!state.isAdminLoggedIn) {
                    openModal();
                    showToast('Admin login opened (Press AAA)', 'success');
                }
                aPressCount = 0;
            }

            clearTimeout(aPressTimer);
            aPressTimer = setTimeout(() => {
                aPressCount = 0;
            }, 1000);
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        if (loginAdmin(username, password)) {
            showToast('Admin login successful!');
            closeModal();
        } else {
            showToast('Invalid credentials. Try username: raju, password: Raju@2001', 'error');
        }
    });
}

function setupLogoutHandlers() {
    const logoutBtn = document.getElementById('admin-logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-admin-logout-btn');

    const handleLogout = () => {
        if (confirm('Are you sure you want to logout?')) {
            logoutAdmin();
            showToast('Logged out successfully');
            document.getElementById('mobile-menu').classList.add('hidden');
        }
    };

    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
}

function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn, .mobile-nav-btn');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.getAttribute('data-section');

            if (btn.classList.contains('admin-only') && !state.isAdminLoggedIn) {
                showToast('Please login as admin to access this section', 'warning');
                return;
            }

            showSection(targetSection);
        });
    });

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });
    }
}

// ROUTE SEARCH FORM
document.getElementById('search-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const source = document.getElementById('source').value;
    const destination = document.getElementById('destination').value;
    const busNo = document.getElementById('bus-no-filter').value || null;
    const busType = document.getElementById('bus-type-filter').value || null;

    if (!source || !destination) {
        showToast('Please select both source and destination', 'warning');
        return;
    }

    setLoading(true);

    try {
        const results = await searchBuses(source, destination, busNo, busType);
        renderSearchResults(results);
    } catch (error) {
        showToast('Search failed', 'error');
    } finally {
        setLoading(false);
    }
});

// PLACE SEARCH FORM
document.getElementById('place-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const place = document.getElementById('place-select').value;

    if (!place) {
        showToast('Please select a location', 'warning');
        return;
    }

    setLoading(true);

    try {
        const data = await getDeparturesByPlace(place);
        renderPlaceResults(data);
    } catch (error) {
        showToast(error.message || 'Failed to load departures', 'error');
    } finally {
        setLoading(false);
    }
});


// BUS FORM
document.getElementById('bus-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const busData = {
        bus_no: document.getElementById('bus-no').value.trim(),
        bus_type: document.getElementById('bus-type').value,
        start_bus: document.getElementById('start-bus').value.trim().toLowerCase(),
        end_bus: document.getElementById('end-bus').value.trim().toLowerCase()
    };

    if (busData.start_bus === busData.end_bus) {
        showToast('Starting point and destination must be different', 'warning');
        return;
    }

    setLoading(true);

    try {
        if (state.editingBusId) {
            await updateBus(state.editingBusId, busData);
            showToast('Bus updated successfully');
            cancelBusEdit();
        } else {
            await addBus(busData);
            showToast('Bus added successfully');
            document.getElementById('bus-form').reset();
        }

        const buses = await fetchBuses();
        renderBusesList(buses);
        await populateTimingBusSelect();
        await populateStopDropdowns();
    } catch (error) {
        showToast(error.message || 'Operation failed', 'error');
    } finally {
        setLoading(false);
    }
});

window.editBus = async (busId) => {
    const bus = state.buses.find(b => b.bus_id === busId);
    if (!bus) return;

    state.editingBusId = busId;

    document.getElementById('bus-no').value = bus.bus_no;
    document.getElementById('bus-type').value = bus.bus_type;
    document.getElementById('start-bus').value = bus.start_bus;
    document.getElementById('end-bus').value = bus.end_bus;

    document.getElementById('bus-form-title').textContent = 'Edit Bus';
    document.getElementById('bus-submit-text').textContent = 'Update Bus';
    document.getElementById('cancel-edit-bus').classList.remove('hidden');

    document.getElementById('bus-form').scrollIntoView({ behavior: 'smooth' });
};

function cancelBusEdit() {
    state.editingBusId = null;
    document.getElementById('bus-form').reset();
    document.getElementById('bus-form-title').textContent = 'Add New Bus';
    document.getElementById('bus-submit-text').textContent = 'Add Bus';
    document.getElementById('cancel-edit-bus').classList.add('hidden');
}

document.getElementById('cancel-edit-bus').addEventListener('click', cancelBusEdit);

window.confirmDeleteBus = async (busId) => {
    if (!confirm('Are you sure you want to delete this bus?')) return;

    setLoading(true);

    try {
        await deleteBus(busId);
        showToast('Bus deleted successfully');
        const buses = await fetchBuses();
        renderBusesList(buses);
        await populateTimingBusSelect();
        await populateStopDropdowns();
        await renderTimingsDisplay();
    } catch (error) {
        showToast('Failed to delete bus', 'error');
    } finally {
        setLoading(false);
    }
};

// STOP FORM
document.getElementById('stop-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const stopData = {
        stop_name: document.getElementById('stop-name').value
    };

    setLoading(true);

    try {
        if (state.editingStopId) {
            await updateStop(state.editingStopId, stopData);
            showToast('Stop updated successfully');
            cancelStopEdit();
        } else {
            await addStop(stopData);
            showToast('Stop added successfully');
            document.getElementById('stop-form').reset();
        }

        const stops = await fetchStops();
        renderStopsList(stops);
        await populateStopDropdowns();
    } catch (error) {
        showToast(error.message || 'Operation failed', 'error');
    } finally {
        setLoading(false);
    }
});

window.editStop = async (stopId) => {
    const stop = state.stops.find(s => s.stop_id === stopId);
    if (!stop) return;

    state.editingStopId = stopId;

    document.getElementById('stop-name').value = stop.stop_name;

    document.getElementById('stop-form-title').textContent = 'Edit Stop';
    document.getElementById('stop-submit-text').textContent = 'Update Stop';
    document.getElementById('cancel-edit-stop').classList.remove('hidden');

    document.getElementById('stop-form').scrollIntoView({ behavior: 'smooth' });
};

function cancelStopEdit() {
    state.editingStopId = null;
    document.getElementById('stop-form').reset();
    document.getElementById('stop-form-title').textContent = 'Add New Stop';
    document.getElementById('stop-submit-text').textContent = 'Add Stop';
    document.getElementById('cancel-edit-stop').classList.add('hidden');
}

document.getElementById('cancel-edit-stop').addEventListener('click', cancelStopEdit);

window.confirmDeleteStop = async (stopId) => {
    if (!confirm('Are you sure you want to delete this stop?')) return;

    setLoading(true);

    try {
        await deleteStop(stopId);
        showToast('Stop deleted successfully');
        const stops = await fetchStops();
        renderStopsList(stops);
        await populateStopDropdowns();
    } catch (error) {
        showToast(error.message || 'Failed to delete stop', 'error');
    } finally {
        setLoading(false);
    }
};

document.getElementById('add-timing-btn').addEventListener('click', async () => {
    const busId = document.getElementById('timing-bus-select').value;
    const tripTime = document.getElementById('trip-time').value;

    if (!busId || !tripTime) {
        showToast('Please select a bus and enter time', 'warning');
        return;
    }

    setLoading(true);

    try {
        await addBusTimings([{ bus_id: parseInt(busId), trip_time: tripTime }]);
        showToast('Timing added successfully');
        document.getElementById('trip-time').value = '';
        await renderTimingsDisplay();
    } catch (error) {
        showToast('Failed to add timing', 'error');
    } finally {
        setLoading(false);
    }
});

document.getElementById('refresh-buses').addEventListener('click', async () => {
    setLoading(true);
    const buses = await fetchBuses();
    renderBusesList(buses);
    await renderTimingsDisplay();
    setLoading(false);
    await populateStopDropdowns();
});

document.getElementById('refresh-stops').addEventListener('click', async () => {
    setLoading(true);
    const stops = await fetchStops();
    renderStopsList(stops);
    setLoading(false);
});

// PLACE DEPARTURE FORM
document.getElementById('place-dep-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const depData = {
        place_name: document.getElementById('pd-place-name').value.trim(),
        bus_no: document.getElementById('pd-bus-no').value.trim(),
        bus_type: document.getElementById('pd-bus-type').value,
        departure_time: document.getElementById('pd-departure-time').value
    };

    setLoading(true);

    try {
        if (state.editingPlaceDepId) {
            await updatePlaceDeparture(state.editingPlaceDepId, depData);
            showToast('Departure updated successfully');
            cancelPlaceDepEdit();
        } else {
            await addPlaceDeparture(depData);
            showToast('Departure added successfully');
            document.getElementById('place-dep-form').reset();
        }

        const deps = await fetchAllPlaceDepartures();
        renderAdminPlaceDepsList(deps);
        await populateStopDropdowns(); // Update frontend search dropdown
    } catch (error) {
        showToast(error.message || 'Operation failed', 'error');
    } finally {
        setLoading(false);
    }
});

window.editPlaceDep = async (depId) => {
    const dep = state.placeDepartures.find(d => d.departure_id === depId);
    if (!dep) return;

    state.editingPlaceDepId = depId;

    document.getElementById('pd-place-name').value = dep.place_name;
    document.getElementById('pd-bus-no').value = dep.bus_no;
    document.getElementById('pd-bus-type').value = dep.bus_type;
    document.getElementById('pd-departure-time').value = dep.departure_time;

    document.getElementById('place-dep-form-title').textContent = 'Edit Departure';
    document.getElementById('place-dep-submit-text').textContent = 'Update Departure';
    document.getElementById('cancel-edit-place-dep').classList.remove('hidden');

    document.getElementById('place-dep-form').scrollIntoView({ behavior: 'smooth' });
};

function cancelPlaceDepEdit() {
    state.editingPlaceDepId = null;
    document.getElementById('place-dep-form').reset();
    document.getElementById('place-dep-form-title').textContent = 'Add New Departure';
    document.getElementById('place-dep-submit-text').textContent = 'Add Departure';
    document.getElementById('cancel-edit-place-dep').classList.add('hidden');
}

document.getElementById('cancel-edit-place-dep').addEventListener('click', cancelPlaceDepEdit);

window.confirmDeletePlaceDep = async (depId) => {
    if (!confirm('Are you sure you want to delete this departure?')) return;

    setLoading(true);

    try {
        await deletePlaceDeparture(depId);
        showToast('Departure deleted successfully');
        const deps = await fetchAllPlaceDepartures();
        renderAdminPlaceDepsList(deps);
        await populateStopDropdowns();
    } catch (error) {
        showToast(error.message || 'Failed to delete departure', 'error');
    } finally {
        setLoading(false);
    }
};

document.getElementById('refresh-place-deps').addEventListener('click', async () => {
    setLoading(true);
    const deps = await fetchAllPlaceDepartures();
    renderAdminPlaceDepsList(deps);
    setLoading(false);
});

document.getElementById('place-dep-filter').addEventListener('input', () => {
    renderAdminPlaceDepsList(state.placeDepartures);
});

document.getElementById('admin-sync-btn').addEventListener('click', async () => {
    if (!confirm('Are you sure you want to sync? This will overwrite existing manual departures with data from current buses and timings.')) return;

    setLoading(true);
    try {
        await syncPlaceDepartures();
        showToast('Sync completed successfully');
        const deps = await fetchAllPlaceDepartures();
        renderAdminPlaceDepsList(deps);
        await populateStopDropdowns();
    } catch (error) {
        showToast('Sync failed', 'error');
    } finally {
        setLoading(false);
    }
});

// ==========================================
// INITIALIZATION
// ==========================================

async function init() {
    setLoading(true);

    try {
        checkAdminAuth();
        setupModalHandlers();
        setupLogoutHandlers();
        setupNavigation();

        await populateStopDropdowns();
        const buses = await fetchBuses();
        renderBusesList(buses);
        const stops = await fetchStops();
        renderStopsList(stops);
        const placeDeps = await fetchAllPlaceDepartures(); // NEW
        renderAdminPlaceDepsList(placeDeps); // NEW
        await populateTimingBusSelect();
        await renderTimingsDisplay();

        showToast('App loaded successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to load app', 'error');
    } finally {
        // Restore active section
        const savedSection = sessionStorage.getItem('activeSection');
        if (savedSection) {
            showSection(savedSection);
        } else {
            showSection('home');
        }
        setLoading(false);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==========================================
// EXPOSE SYNC FUNCTION FOR ONE-TIME DATA MIGRATION
// ==========================================
// Run this in browser console after first deployment:
// syncPlaceDepartures().then(r => console.log(r));
window.syncPlaceDepartures = syncPlaceDepartures;