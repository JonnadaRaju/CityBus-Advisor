// ==========================================
// CITY BUS ADVISOR - JAVASCRIPT
// ==========================================

// API Configuration
const API_BASE_URL ="https://citybus-advisor.onrender.com"; // Change this to your FastAPI backend URL

// State Management
const state = {
    buses: [],
    stops: [],
    timings: [],
    editingBusId: null,
    editingStopId: null,
    isAdminLoggedIn: false
};

// Admin credentials (In production, this should be handled by backend authentication)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

// Check if admin is logged in (from localStorage)
function checkAdminAuth() {
    const isAdmin = localStorage.getItem('isAdminLoggedIn') === 'true';
    state.isAdminLoggedIn = isAdmin;
    updateAdminUI();
    return isAdmin;
}

// Login admin
function loginAdmin(username, password) {
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        state.isAdminLoggedIn = true;
        localStorage.setItem('isAdminLoggedIn', 'true');
        updateAdminUI();
        return true;
    }
    return false;
}

// Logout admin
function logoutAdmin() {
    state.isAdminLoggedIn = false;
    localStorage.removeItem('isAdminLoggedIn');
    updateAdminUI();
    
    // Return to search section
    const searchSection = document.querySelector('[data-section="search"]');
    if (searchSection) searchSection.click();
}

// Update UI based on admin status
function updateAdminUI() {
    const adminElements = document.querySelectorAll('.admin-only');
    const loginBtn = document.getElementById('admin-login-btn');
    const logoutBtn = document.getElementById('admin-logout-btn');
    const mobileLoginBtn = document.getElementById('mobile-admin-login-btn');
    const mobileLogoutBtn = document.getElementById('mobile-admin-logout-btn');
    
    if (state.isAdminLoggedIn) {
        // Show admin sections
        adminElements.forEach(el => el.style.display = '');
        
        // Update buttons
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = '';
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = '';
    } else {
        // Hide admin sections
        adminElements.forEach(el => el.style.display = 'none');
        
        // Update buttons
        if (loginBtn) loginBtn.style.display = '';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (mobileLoginBtn) mobileLoginBtn.style.display = '';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    
    // Set message
    toastMessage.textContent = message;
    
    // Set type
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
    
    // Show toast
    toast.classList.remove('hidden');
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Show/hide loading overlay
function setLoading(isLoading) {
    const overlay = document.getElementById('loading-overlay');
    if (isLoading) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

// Format time for display
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Capitalize first letter
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ==========================================
// API FUNCTIONS
// ==========================================

// Fetch all buses
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

// Add new bus
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

// Update bus
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

// Delete bus
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

// Fetch all stops
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

// Add new stop
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

// Update stop
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

// Delete stop
async function deleteStop(stopId) {
    try {
        const response = await fetch(`${API_BASE_URL}/stops/${stopId}`, {S
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete stop');
        return true;
    } catch (error) {
        console.error('Error deleting stop:', error);
        throw error;
    }
}

// Add bus timings
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

// Search buses
async function searchBuses(source, destination, busNo = null, busType = null) {
    try {
        let url = `${API_BASE_URL}/routes/buses/timings?source=${encodeURIComponent(source)}&destination=${encodeURIComponent(destination)}`;
        if (busNo) url += `&bus_no=${encodeURIComponent(busNo)}`;
        if (busType) url += `&bus_type=${encodeURIComponent(busType)}`;
        
        const response = await fetch(url);
        if (!response.ok) {
            if (response.status === 404) {
                return [];
            }
            throw new Error('Failed to search buses');
        }
        return await response.json();
    } catch (error) {
        console.error('Error searching buses:', error);
        throw error;
    }
}

// ==========================================
// UI RENDERING FUNCTIONS
// ==========================================

// Populate stop dropdowns
async function populateStopDropdowns() {
    const stops = await fetchStops();
    
    const dropdowns = [
        document.getElementById('source'),
        document.getElementById('destination')
    ];
    
    dropdowns.forEach(dropdown => {
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
}

// Render buses list
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

// Render stops list
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

// Render search results
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
    
    container.innerHTML = results.map(bus => `
        <div class="bus-card">
            <div class="bus-number">${bus.bus_no}</div>
            <span class="bus-type-badge bus-type-${bus.bus_type.toLowerCase()}">${capitalize(bus.bus_type)}</span>
            <div class="timings-container">
                ${bus.timings.map(time => `
                    <span class="timing-badge">${formatTime(time)}</span>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// Populate timing bus select
async function populateTimingBusSelect() {
    const buses = await fetchBuses();
    const select = document.getElementById('timing-bus-select');
    
    select.innerHTML = '<option value="">Choose a bus</option>';
    
    buses.forEach(bus => {
        const option = document.createElement('option');
        option.value = bus.bus_id;
        option.textContent = `${bus.bus_no} - ${capitalize(bus.start_bus)} → ${capitalize(bus.end_bus)}`;
        select.appendChild(option);
    });
}

// ==========================================
// EVENT HANDLERS
// ==========================================

// Modal handlers
function setupModalHandlers() {
    const modal = document.getElementById('admin-modal');
    const loginBtn = document.getElementById('admin-login-btn');
    const mobileLoginBtn = document.getElementById('mobile-admin-login-btn');
    const closeBtn = document.getElementById('close-modal');
    
    // Safety check - if modal doesn't exist, exit
    if (!modal || !loginBtn) {
        console.error('Modal or login button not found');
        return;
    }
    
    const overlay = modal.querySelector('.modal-overlay');
    const loginForm = document.getElementById('admin-login-form');
    
    // Open modal
    const openModal = () => {
        modal.classList.remove('hidden');
        const usernameInput = document.getElementById('admin-username');
        if (usernameInput) usernameInput.focus();
    };
    
    // Close modal
    const closeModal = () => {
        modal.classList.add('hidden');
        if (loginForm) loginForm.reset();
    };
    
    // Add click listeners with safety checks
    if (loginBtn) {
        loginBtn.addEventListener('click', openModal);
    }
    
    if (mobileLoginBtn) {
        mobileLoginBtn.addEventListener('click', () => {
            openModal();
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) mobileMenu.classList.add('hidden');
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeModal);
    }
    
    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
    
    // Handle login form
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            if (loginAdmin(username, password)) {
                showToast('Admin login successful!');
                closeModal();
            } else {
                showToast('Invalid credentials. Try username: admin, password: admin123', 'error');
            }
        });
    }
}
// Logout handler
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
    
    logoutBtn.addEventListener('click', handleLogout);
    mobileLogoutBtn.addEventListener('click', handleLogout);
}

// Navigation
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn, .mobile-nav-btn');
    const sections = document.querySelectorAll('.content-section');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetSection = btn.getAttribute('data-section');
            
            // Check if admin-only section and user is not admin
            if (btn.classList.contains('admin-only') && !state.isAdminLoggedIn) {
                showToast('Please login as admin to access this section', 'warning');
                return;
            }
            
            // Update active states
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Find matching buttons in both desktop and mobile nav
            const matchingButtons = document.querySelectorAll(`[data-section="${targetSection}"]`);
            matchingButtons.forEach(b => b.classList.add('active'));
            
            // Show target section
            sections.forEach(section => {
                if (section.id === `${targetSection}-section`) {
                    section.classList.add('active');
                } else {
                    section.classList.remove('active');
                }
            });
            
            // Close mobile menu
            document.getElementById('mobile-menu').classList.add('hidden');
        });
    });
    
    // Mobile menu toggle
    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        document.getElementById('mobile-menu').classList.toggle('hidden');
    });
}

// Bus form submission
document.getElementById('bus-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const busData = {
    bus_no: document.getElementById('bus-no').value.trim(),
    bus_type: document.getElementById('bus-type').value,
    start_bus: document.getElementById('start-bus').value.trim().toLowerCase(),
    end_bus: document.getElementById('end-bus').value.trim().toLowerCase()
};

    // Validate that start and end are different
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

// Edit bus
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
    
    // Scroll to form
    document.getElementById('bus-form').scrollIntoView({ behavior: 'smooth' });
};

// Cancel bus edit
function cancelBusEdit() {
    state.editingBusId = null;
    document.getElementById('bus-form').reset();
    document.getElementById('bus-form-title').textContent = 'Add New Bus';
    document.getElementById('bus-submit-text').textContent = 'Add Bus';
    document.getElementById('cancel-edit-bus').classList.add('hidden');
}

document.getElementById('cancel-edit-bus').addEventListener('click', cancelBusEdit);

// Delete bus
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
    } catch (error) {
        showToast('Failed to delete bus', 'error');
    } finally {
        setLoading(false);
    }
};

// Stop form submission
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

// Edit stop
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

// Cancel stop edit
function cancelStopEdit() {
    state.editingStopId = null;
    document.getElementById('stop-form').reset();
    document.getElementById('stop-form-title').textContent = 'Add New Stop';
    document.getElementById('stop-submit-text').textContent = 'Add Stop';
    document.getElementById('cancel-edit-stop').classList.add('hidden');
}

document.getElementById('cancel-edit-stop').addEventListener('click', cancelStopEdit);

// Delete stop
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
        showToast('Failed to delete stop', 'error');
    } finally {
        setLoading(false);
    }
};

// Search form submission
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

// Add timing
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
    } catch (error) {
        showToast('Failed to add timing', 'error');
    } finally {
        setLoading(false);
    }
});

// Refresh buttons
document.getElementById('refresh-buses').addEventListener('click', async () => {
    setLoading(true);
    const buses = await fetchBuses();
    renderBusesList(buses);
    setLoading(false);
    await populateStopDropdowns();
});

document.getElementById('refresh-stops').addEventListener('click', async () => {
    setLoading(true);
    const stops = await fetchStops();
    renderStopsList(stops);
    setLoading(false);
});

// ==========================================
// INITIALIZATION
// ==========================================

async function init() {
    setLoading(true);
    
    try {
        // Check admin authentication
        checkAdminAuth();
        
        // Setup modal handlers
        setupModalHandlers();
        setupLogoutHandlers();
        
        // Setup navigation
        setupNavigation();
        
        // Load initial data
        await populateStopDropdowns();
        const buses = await fetchBuses();
        renderBusesList(buses);
        const stops = await fetchStops();
        renderStopsList(stops);
        await populateTimingBusSelect();
        
        showToast('App loaded successfully');
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to load app', 'error');
    } finally {
        setLoading(false);
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
