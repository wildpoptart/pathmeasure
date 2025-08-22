// Detect Safari on iOS/macOS
function isSafari() {
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Chromium/.test(ua);
}

function isAppleDevice() {
    const ua = navigator.userAgent;
    return /iPhone|iPad|iPod|Macintosh/.test(ua);
}

const useAppleMaps = isSafari() && isAppleDevice();

// Initialize map
const map = L.map('map').setView([40.7128, -74.0060], 10); // Default to NYC

// Add map tiles based on platform
if (useAppleMaps) {
    // Use Apple Maps style tiles (CartoDB Positron is close to Apple Maps style)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '© Apple Maps style via CartoDB',
        maxZoom: 18
    }).addTo(map);
} else {
    // Use CartoDB Voyager for better road and trail visibility
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '© CartoDB Voyager',
        maxZoom: 18
    }).addTo(map);
}

// Store points and markers
let points = [];
let markers = [];
let polylines = [];

// DOM elements
const distanceDiv = document.getElementById('distance');
const pointsListDiv = document.getElementById('points-list');
const clearBtn = document.getElementById('clearBtn');

// Initialize UI
updateDistanceDisplay();
updatePointsList();

// Event listeners
map.on('click', handleMapClick);
clearBtn.addEventListener('click', clearAllPoints);

// Handle map clicks
function handleMapClick(e) {
    const lat = e.latlng.lat;
    const lng = e.latlng.lng;
    
    // Check if clicking on first point to close loop
    if (points.length >= 3) {
        const firstPoint = points[0];
        const distance = calculateDistance({lat: lat, lng: lng}, firstPoint);
        if (distance < 0.001) { // Within ~1 meter for more precise clicking
            closeLoop();
            return;
        }
    }
    
    addPoint(lat, lng);
    updateMap();
    updateUI();
}

// Add a new point
function addPoint(lat, lng) {
    const point = {
        id: Date.now(),
        lat: lat,
        lng: lng,
        name: `Point ${points.length + 1}`
    };
    
    points.push(point);
    
    // Create marker with Apple Maps style for Safari
    const markerColor = useAppleMaps ? '#007AFF' : '#007acc';
    const marker = L.marker([lat, lng], {
        icon: L.divIcon({
            className: 'custom-marker',
            html: `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
        })
    }).addTo(map);
    
    // Add popup with coordinates only if not the first point (to avoid interfering with loop closing)
    if (points.length > 1) {
        marker.bindPopup(`
            <strong>${point.name}</strong><br>
            Lat: ${lat.toFixed(6)}<br>
            Lng: ${lng.toFixed(6)}
        `);
    }
    
    // Add click handler to first point for loop closing
    if (points.length === 1) {
        marker.on('click', function(e) {
            if (points.length >= 3) {
                closeLoop();
                e.originalEvent.stopPropagation(); // Prevent map click event
            }
        });
    }
    
    markers.push(marker);
}

// Update map display
function updateMap() {
    // Clear existing polylines
    polylines.forEach(line => map.removeLayer(line));
    polylines = [];
    
    // Draw lines between points
    if (points.length > 1) {
        const latlngs = points.map(point => [point.lat, point.lng]);
        
        const lineColor = useAppleMaps ? '#007AFF' : '#007acc';
        
        // Draw path connecting all points
        const line = L.polyline(latlngs, {
            color: lineColor,
            weight: 2,
            opacity: 0.6
        }).addTo(map);
        polylines.push(line);
        
        // If loop is closed, draw line from last to first point
        if (points.length >= 3 && points[0].isLoopClosed) {
            const loopLine = L.polyline([latlngs[latlngs.length - 1], latlngs[0]], {
                color: '#34C759',
                weight: 3,
                opacity: 0.8
            }).addTo(map);
            polylines.push(loopLine);
        }
    }
    
    // Don't auto-zoom - let user control the map view
}

// Update UI elements
function updateUI() {
    updateDistanceDisplay();
    updatePointsList();
}

// Update distance display
function updateDistanceDisplay() {
    if (points.length < 2) {
        distanceDiv.innerHTML = '<h3>Distance</h3><p><strong>0.00 km / 0.00 miles</strong></p>';
        return;
    }
    
    const totalDistance = calculateTotalDistance();
    const loopStatus = points.length >= 3 && points[0].isLoopClosed ? ' (Loop Closed)' : '';
    distanceDiv.innerHTML = `
        <h3>Total Distance${loopStatus}</h3>
        <p><strong>${totalDistance.toFixed(2)} km / ${(totalDistance * 0.621371).toFixed(2)} miles</strong></p>
    `;
}

// Update points list
function updatePointsList() {
    if (points.length === 0) {
        pointsListDiv.innerHTML = '<h3>Points</h3><p>No points placed yet</p>';
        return;
    }
    
    let html = '<h3>Points</h3>';
    points.forEach((point, index) => {
        html += `
            <div class="point-item">
                <div class="point-header">
                    <strong>${point.name}</strong>
                </div>
                <span>Lat: ${point.lat.toFixed(6)}</span><br>
                <span>Lng: ${point.lng.toFixed(6)}</span>
                <button class="remove-btn" onclick="removePoint(${index})">×</button>
            </div>
        `;
    });
    
    pointsListDiv.innerHTML = html;
}

// Calculate distance between two points using Haversine formula
function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (point2.lat - point1.lat) * Math.PI / 180;
    const dLng = (point2.lng - point1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(point1.lat * Math.PI / 180) * Math.cos(point2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Calculate total distance for all points
function calculateTotalDistance() {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += calculateDistance(points[i], points[i + 1]);
    }
    // Add distance from last to first point if loop is closed
    if (points.length >= 3 && points[0].isLoopClosed) {
        total += calculateDistance(points[points.length - 1], points[0]);
    }
    return total;
}

// Clear all points
function clearAllPoints() {
    points = [];
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    polylines.forEach(line => map.removeLayer(line));
    polylines = [];
    updateUI();
}



// Remove point function
function removePoint(index) {
    if (points.length <= 1) {
        clearAllPoints();
        return;
    }
    
    // Remove the point and its marker
    points.splice(index, 1);
    map.removeLayer(markers[index]);
    markers.splice(index, 1);
    
    // Rename remaining points
    points.forEach((point, i) => {
        point.name = `Point ${i + 1}`;
    });
    
    // If loop was closed and we removed the first point, unclose the loop
    if (index === 0 && points.length > 0) {
        points[0].isLoopClosed = false;
    }
    
    updateMap();
    updateUI();
}

// Close loop function
function closeLoop() {
    if (points.length >= 3) {
        points[0].isLoopClosed = true;
        updateMap();
        updateUI();
    }
}

// Add keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.key === 'c' || e.key === 'C') {
        clearAllPoints();
    }
});

// Create custom search control
const SearchControl = L.Control.extend({
    onAdd: function(map) {
        const container = L.DomUtil.create('div', 'leaflet-control leaflet-control-search');
        
        // Create search button
        const searchBtn = L.DomUtil.create('button', 'search-btn', container);
        searchBtn.innerHTML = '🔍';
        searchBtn.title = 'Search location';
        
        // Create search input container
        const searchContainer = L.DomUtil.create('div', 'search-container', container);
        searchContainer.style.display = 'none';
        
        // Create search input
        const searchInput = L.DomUtil.create('input', 'search-input', searchContainer);
        searchInput.type = 'text';
        searchInput.placeholder = 'Search location...';
        
        // Create search results container
        const resultsContainer = L.DomUtil.create('div', 'search-results', searchContainer);
        
        // Toggle search input on button click
        searchBtn.onclick = function(e) {
            e.stopPropagation();
            if (searchContainer.style.display === 'none') {
                searchContainer.style.display = 'block';
                searchInput.focus();
            } else {
                searchContainer.style.display = 'none';
                resultsContainer.innerHTML = '';
            }
        };
        
        // Handle search input
        let searchTimeout;
        searchInput.oninput = function() {
            clearTimeout(searchTimeout);
            const query = searchInput.value.trim();
            
            if (query.length < 3) {
                resultsContainer.innerHTML = '';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                searchLocation(query, resultsContainer);
            }, 500);
        };
        
        // Prevent clicks on search input from bubbling to map
        searchInput.onclick = function(e) {
            e.stopPropagation();
        };
        
        // Close search on outside click
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                searchContainer.style.display = 'none';
                resultsContainer.innerHTML = '';
            }
        });
        
        // Prevent clicks on search container from bubbling to map
        searchContainer.onclick = function(e) {
            e.stopPropagation();
        };
        
        return container;
    }
});

// Add search control to map
new SearchControl({ position: 'topleft' }).addTo(map);

// Search location function using Nominatim (OpenStreetMap's geocoding service)
async function searchLocation(query, resultsContainer) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        
        if (data.length === 0) {
            resultsContainer.innerHTML = '<div class="search-result">No results found</div>';
            return;
        }
        
        let html = '';
        data.forEach(place => {
            html += `
                <div class="search-result" onclick="goToLocation(${place.lat}, ${place.lon}, '${place.display_name}')">
                    <div class="search-result-name">${place.display_name}</div>
                </div>
            `;
        });
        
        resultsContainer.innerHTML = html;
    } catch (error) {
        resultsContainer.innerHTML = '<div class="search-result">Search failed</div>';
        console.error('Search error:', error);
    }
}

// Go to searched location
function goToLocation(lat, lng, name) {
    map.setView([parseFloat(lat), parseFloat(lng)], 14);
    
    // Add a point at the searched location
    addPoint(parseFloat(lat), parseFloat(lng));
    updateMap();
    updateUI();
    
    // Hide search results
    const searchContainer = document.querySelector('.search-container');
    const resultsContainer = document.querySelector('.search-results');
    if (searchContainer) {
        searchContainer.style.display = 'none';
        resultsContainer.innerHTML = '';
    }
}
