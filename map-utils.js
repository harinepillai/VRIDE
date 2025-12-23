// Map utilities for OpenStreetMap with Leaflet
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Initialize a Leaflet map
 * @param {string} containerId - ID of the container element
 * @param {Object} options - Map options
 * @returns {L.Map} - Leaflet map instance
 */
export function initMap(containerId, options = {}) {
    const defaultOptions = {
        center: [12.9716, 77.5946], // Bangalore, India
        zoom: 13,
        zoomControl: true,
        ...options
    };

    const map = L.map(containerId, defaultOptions);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    return map;
}

/**
 * Get user's current location
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            },
            (error) => {
                reject(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );
    });
}

/**
 * Search for an address using Nominatim API
 * @param {string} query - Search query
 * @returns {Promise<Array>} - Array of search results
 */
export async function searchAddress(query) {
    if (!query || query.trim().length < 3) {
        return [];
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`
        );

        if (!response.ok) {
            throw new Error('Search failed');
        }

        const results = await response.json();
        return results.map(result => ({
            address: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            placeId: result.place_id
        }));
    } catch (error) {
        console.error('Address search error:', error);
        return [];
    }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Address object
 */
export async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );

        if (!response.ok) {
            throw new Error('Reverse geocoding failed');
        }

        const result = await response.json();
        return {
            address: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            placeId: result.place_id
        };
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        return {
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            lat,
            lng,
            placeId: null
        };
    }
}

/**
 * Get route between two points using OSRM
 * @param {Object} origin - {lat, lng}
 * @param {Object} destination - {lat, lng}
 * @returns {Promise<Object>} - Route object with coordinates and distance
 */
export async function getRoute(origin, destination) {
    try {
        const response = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`
        );

        if (!response.ok) {
            throw new Error('Route calculation failed');
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
                coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]), // Convert to [lat, lng]
                distance: route.distance, // in meters
                duration: route.duration // in seconds
            };
        }

        throw new Error('No route found');
    } catch (error) {
        console.error('Route calculation error:', error);
        // Return straight line as fallback
        return {
            coordinates: [[origin.lat, origin.lng], [destination.lat, destination.lng]],
            distance: calculateDistance(origin, destination) * 1000,
            duration: 0
        };
    }
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {Object} point1 - {lat, lng}
 * @param {Object} point2 - {lat, lng}
 * @returns {number} - Distance in kilometers
 */
export function calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(point2.lat - point1.lat);
    const dLng = toRad(point2.lng - point1.lng);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(point1.lat)) * Math.cos(toRad(point2.lat)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Animate marker along a path
 * @param {L.Marker} marker - Leaflet marker to animate
 * @param {Array} path - Array of [lat, lng] coordinates
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} onUpdate - Callback function called on each update
 */
export function animateMarker(marker, path, duration, onUpdate) {
    if (!path || path.length < 2) return;

    const startTime = Date.now();
    const totalPoints = path.length;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Calculate current position along path
        const index = Math.floor(progress * (totalPoints - 1));
        const nextIndex = Math.min(index + 1, totalPoints - 1);

        const segmentProgress = (progress * (totalPoints - 1)) - index;

        const currentLat = path[index][0] + (path[nextIndex][0] - path[index][0]) * segmentProgress;
        const currentLng = path[index][1] + (path[nextIndex][1] - path[index][1]) * segmentProgress;

        marker.setLatLng([currentLat, currentLng]);

        if (onUpdate) {
            onUpdate(progress, { lat: currentLat, lng: currentLng });
        }

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

/**
 * Calculate ETA based on distance and average speed
 * @param {number} distance - Distance in meters
 * @param {number} speed - Average speed in km/h (default: 30)
 * @returns {string} - ETA in human-readable format
 */
export function calculateETA(distance, speed = 30) {
    const distanceKm = distance / 1000;
    const hours = distanceKm / speed;
    const minutes = Math.round(hours * 60);

    if (minutes < 1) {
        return 'Less than a minute';
    } else if (minutes === 1) {
        return '1 minute';
    } else if (minutes < 60) {
        return `${minutes} minutes`;
    } else {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs} hour${hrs > 1 ? 's' : ''}`;
    }
}

/**
 * Format distance for display
 * @param {number} distance - Distance in meters
 * @returns {string} - Formatted distance
 */
export function formatDistance(distance) {
    if (distance < 1000) {
        return `${Math.round(distance)} m`;
    } else {
        return `${(distance / 1000).toFixed(1)} km`;
    }
}

/**
 * Create a custom vehicle marker icon
 * @param {string} type - Vehicle type (car, bike, auto)
 * @returns {L.DivIcon} - Custom icon
 */
export function createVehicleIcon(type = 'car') {
    const iconHtml = `
        <div class="vehicle-marker">
            <i class="fa-solid fa-${type === 'bike' ? 'motorcycle' : type === 'auto' ? 'taxi' : 'car'}"></i>
        </div>
    `;

    return L.divIcon({
        html: iconHtml,
        className: 'custom-vehicle-icon',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
}

/**
 * Simulate finding available drivers going to the same destination
 * @param {Object} destination - {lat, lng}
 * @param {string} passengerGender - Gender of the passenger
 * @returns {Array} - List of matching drivers
 */
export function getAvailableDrivers(destination, passengerGender = '') {
    // Simulated driver data
    const drivers = [
        {
            id: 'd1',
            name: 'Vikram Singh',
            rating: 4.8,
            gender: 'male',
            femaleOnly: false,
            vehicle: 'Toyota Glanza (Silver)',
            type: 'car',
            price: 240,
            eta: '5 min',
            distance: 1.2,
            capacity: 3,
            occupancy: 1
        },
        {
            id: 'd2',
            name: 'Priya Joshi',
            rating: 4.9,
            gender: 'female',
            femaleOnly: true, // Safety Pref: Only female passengers
            vehicle: 'Bajaj RE (Yellow)',
            type: 'auto',
            price: 155,
            eta: '3 min',
            distance: 0.8,
            capacity: 2,
            occupancy: 0
        },
        {
            id: 'd3',
            name: 'Sameer Khan',
            rating: 4.8,
            gender: 'male',
            femaleOnly: false,
            vehicle: 'Honda Activa (Black)',
            type: 'bike',
            price: 120,
            eta: '2 min',
            distance: 0.5,
            capacity: 1,
            occupancy: 0
        },
        {
            id: 'd4',
            name: 'Anjali Verma',
            rating: 5.0,
            gender: 'female',
            femaleOnly: false,
            vehicle: 'Maruti Suzuki Swift (White)',
            type: 'car',
            price: 215,
            eta: '8 min',
            distance: 2.1,
            capacity: 3,
            occupancy: 2
        },
        {
            id: 'd5',
            name: 'Suresh Kumar',
            rating: 4.2,
            gender: 'male',
            femaleOnly: false,
            vehicle: 'Tata Tiago (Gold)',
            type: 'car',
            price: 190,
            eta: '4 min',
            distance: 1.5,
            capacity: 3,
            occupancy: 0
        },
        {
            id: 'd6',
            name: 'Neha Reddy',
            rating: 4.7,
            gender: 'female',
            femaleOnly: true, // Safety Pref: Only female passengers
            vehicle: 'Ather 450X (Green)',
            type: 'bike',
            price: 165,
            eta: '6 min',
            distance: 1.8,
            capacity: 1,
            occupancy: 0
        }
    ];

    // Filter based on Driver's "Female-Only" Preference
    const filteredDrivers = drivers.filter(driver => {
        // If driver accepts only females, passenger MUST be female
        if (driver.femaleOnly) {
            return passengerGender.toLowerCase() === 'female';
        }
        return true;
    });

    return filteredDrivers;
}

/**
 * Sort drivers based on High Rating, Low Price, and Passenger Preferences
 * @param {Array} drivers - List of drivers
 * @param {string} passengerGender - Gender of the passenger
 * @returns {Array} - Sorted list
 */
export function sortDrivers(drivers, passengerGender = '') {
    return [...drivers].sort((a, b) => {
        let scoreA = (a.rating * 20) - (a.price / 10);
        let scoreB = (b.rating * 20) - (b.price / 10);

        // Safety Preference: If passenger is female, give a boost to female drivers
        if (passengerGender && passengerGender.toLowerCase() === 'female') {
            if (a.gender === 'female') scoreA += 15;
            if (b.gender === 'female') scoreB += 15;
        }

        return scoreB - scoreA; // Descending order of score
    });
}

/**
 * Simulates nearby passenger requests for a driver
 * @param {Object} driverLocation - Current driver coordinates
 * @param {String} driverDestination - Driver's intended destination (optional)
 * @param {Boolean} femaleOnlyMode - Whether to show only female passengers
 * @returns {Array} List of passenger requests sorted by rating
 */
export function getNearbyPassengerRequests(driverLocation, driverDestination = null, femaleOnlyMode = false) {
    const passengers = [
        { id: 'p1', name: 'Suhani K.', rating: 4.8, pickup: 'Indiranagar', drop: 'Koramangala', price: 180, dist: 0.8, gender: 'female' },
        { id: 'p2', name: 'Rahul V.', rating: 4.9, pickup: 'Domlur', drop: 'Indiranagar', price: 120, dist: 1.2, gender: 'male' },
        { id: 'p3', name: 'Neha S.', rating: 4.5, pickup: 'HSR Layout', drop: 'Whitefield', price: 420, dist: 3.5, gender: 'female' },
        { id: 'p4', name: 'Priya M.', rating: 5.0, pickup: 'MG Road', drop: 'Indiranagar', price: 150, dist: 0.5, gender: 'female' },
        { id: 'p5', name: 'Kabir G.', rating: 4.2, pickup: 'Koramangala', drop: 'MG Road', price: 210, dist: 2.1, gender: 'male' }
    ];

    let filtered = passengers;

    // 1. Filter by Gender Preference
    if (femaleOnlyMode) {
        filtered = filtered.filter(p => p.gender === 'female');
    }

    // 2. Filter by Destination (Simplified route matching)
    if (driverDestination) {
        filtered = filtered.filter(p =>
            p.drop.toLowerCase().includes(driverDestination.toLowerCase()) ||
            driverDestination.toLowerCase().includes(p.drop.toLowerCase())
        );
    }

    // 3. Sort by Rating (High to Low)
    return filtered.sort((a, b) => b.rating - a.rating);
}
