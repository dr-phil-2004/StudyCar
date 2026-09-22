// Utility function for API requests
async function apiRequest(url, method, body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Request failed');
        return data;
    } catch (error) {
        throw error;
    }
}

// Search Form (index.html)
document.getElementById('searchForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const from = document.getElementById('from').value.trim();
    const to = document.getElementById('to').value.trim();

    if (!from || !to) {
        showAlert('Please enter both from and to locations', 'danger');
        return;
    }

    try {
        const buses = await apiRequest(`/api/buses?from=${from}&to=${to}`, 'GET');
        displayResults(buses);
    } catch (error) {
        showAlert('Error fetching buses: ' + error.message, 'danger');
    }
});

function displayResults(buses) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    if (buses.length === 0) {
        resultsDiv.innerHTML = '<p class="alert alert-info">No buses found.</p>';
        return;
    }
    const ul = document.createElement('ul');
    ul.className = 'list-group';
    buses.forEach(bus => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        li.innerHTML = `
            <strong>From:</strong> ${bus.fromLocation} <strong>to</strong> ${bus.toLocation}<br>
            <strong>Departure:</strong> ${new Date(bus.departureTime).toLocaleString()}<br>
            <strong>Price:</strong> $${bus.price}<br>
            <strong>Available Seats:</strong> ${bus.availableSeats}
            <button class="btn btn-sm btn-primary mt-2" onclick="startBooking(${bus.id})">Book</button>
        `;
        ul.appendChild(li);
    });
    resultsDiv.appendChild(ul);
}

function startBooking(busId) {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        showAlert('Please login to book a ticket', 'warning');
        window.location.href = '/login.html';
        return;
    }
    window.location.href = `/booking.html?busId=${busId}`;
}

// Login Form (login.html)
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !password) {
        showAlert('Please enter both name and password', 'danger');
        return;
    }

    try {
        const data = await apiRequest('/api/auth/login', 'POST', { name, password });
        localStorage.setItem('jwtToken', data.token);
        showAlert('Login successful', 'success');
        window.location.href = '/';
    } catch (error) {
        showAlert('Login failed: ' + error.message, 'danger');
    }
});

// Register Form (register.html)
document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!name || !email || !password) {
        showAlert('Please fill all fields', 'danger');
        return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        showAlert('Please enter a valid email', 'danger');
        return;
    }

    try {
        await apiRequest('/api/auth/register', 'POST', { name, email, password });
        showAlert('Registration successful. Please login.', 'success');
        window.location.href = '/login.html';
    } catch (error) {
        showAlert('Registration failed: ' + error.message, 'danger');
    }
});

// Booking Form (booking.html)
let passengerCount = 1;

document.getElementById('bookingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');
    if (!token) {
        showAlert('Please login to book a ticket', 'warning');
        window.location.href = '/login.html';
        return;
    }

    const busId = new URLSearchParams(window.location.search).get('busId');
    const passengers = [];
    for (let i = 1; i <= passengerCount; i++) {
        const name = document.getElementById(`name${i}`).value.trim();
        const age = parseInt(document.getElementById(`age${i}`).value);
        const seatNumber = document.getElementById(`seat${i}`).value.trim();
        if (!name || !age || !seatNumber) {
            showAlert(`Please fill all fields for passenger ${i}`, 'danger');
            return;
        }
        passengers.push({ name, age, seatNumber });
    }

    try {
        await apiRequest('/api/bookings', 'POST', { busId, passengers }, token);
        showAlert('Booking successful', 'success');
        window.location.href = '/profile.html';
    } catch (error) {
        showAlert('Booking failed: ' + error.message, 'danger');
    }
});

function addPassenger() {
    passengerCount++;
    const passengerFields = document.getElementById('passengerFields');
    const div = document.createElement('div');
    div.className = 'passenger mb-3';
    div.innerHTML = `
        <h5>Passenger ${passengerCount}</h5>
        <div class="mb-3">
            <label for="《关于:1]"><label for="name${passengerCount}" class="form-label">Name</label>
            <input type="text" class="form-control" id="name${passengerCount}" required>
        </div>
        <div class="mb-3">
            <label for="age${passengerCount}" class="form-label">Age</label>
            <input type="number" class="form-control" id="age${passengerCount}" required>
        </div>
        <div class="mb-3">
            <label for="seat${passengerCount}" class="form-label">Seat Number</label>
            <input type="text" class="form-control" id="seat${passengerCount}" required>
        </div>
    `;
    passengerFields.appendChild(div);
}

// Profile Page (profile.html)
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('jwtToken');
    if (!token && window.location.pathname === '/profile.html') {
        window.location.href = '/login.html';
        return;
    }

    if (window.location.pathname === '/profile.html') {
        try {
            const profile = await apiRequest('/api/users/profile', 'GET', null, token);
            document.getElementById('profileInfo').innerHTML = `
                <p><strong>Name:</strong> ${profile.name}</p>
                <p><strong>Email:</strong> ${profile.email}</p>
            `;
        } catch (error) {
            showAlert('Error loading profile: ' + error.message, 'danger');
        }

        try {
            const bookings = await apiRequest('/api/bookings/history', 'GET', null, token);
            const historyDiv = document.getElementById('bookingHistory');
            if (bookings.length === 0) {
                historyDiv.innerHTML = '<p class="alert alert-info">No bookings found.</p>';
                return;
            }
            const ul = document.createElement('ul');
            ul.className = 'list-group';
            bookings.forEach(async (booking) => {
                const li = document.createElement('li');
                li.className = 'list-group-item';
                li.innerHTML = `
                    <strong>Booking ID:</strong> ${booking.id}<br>
                    <strong>From:</strong> ${booking.bus.fromLocation} <strong>to</strong> ${booking.bus.toLocation}<br>
                    <strong>Status:</strong> ${booking.status}<br>
                    <strong>Booked on:</strong> ${new Date(booking.bookingTime).toLocaleString()}
                    <button class="btn btn-sm btn-info mt-2" onclick="viewPassengers(${booking.id})">View Passengers</button>
                `;
                ul.appendChild(li);
            });
            historyDiv.appendChild(ul);
        } catch (error) {
            showAlert('Error loading booking history: ' + error.message, 'danger');
        }
    }
});

async function viewPassengers(bookingId) {
    const token = localStorage.getItem('jwtToken');
    try {
        const passengers = await apiRequest(`/api/passengers/booking/${bookingId}`, 'GET', null, token);
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Passengers</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${passengers.map(p => `
                            <p><strong>Name:</strong> ${p.name}, <strong>Age:</strong> ${p.age}, <strong>Seat:</strong> ${p.seatNumber}</p>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        modal.addEventListener('hidden.bs.modal', () => modal.remove());
    } catch (error) {
        showAlert('Error loading passengers: ' + error.message, 'danger');
    }
}

document.getElementById('updateProfileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('jwtToken');
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email && !password) {
        showAlert('Please provide at least one field to update', 'danger');
        return;
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) {
        showAlert('Please enter a valid email', 'danger');
        return;
    }

    try {
        await apiRequest('/api/users/profile', 'PUT', { email, password }, token);
        showAlert('Profile updated successfully', 'success');
        window.location.reload();
    } catch (error) {
        showAlert('Update failed: ' + error.message, 'danger');
    }
});

// Utility function to show alerts
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.querySelector('.container').prepend(alertDiv);
    setTimeout(() => alertDiv.remove(), 5000);
}