const socket = io(); // Connect to server

document.addEventListener("DOMContentLoaded", () => {
  // Initialize map with default view
  const map = L.map("map").setView([20.5937, 78.9629], 20); // Centered at India

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© Team ByteBuilders",
  }).addTo(map);

  // Get User Location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Emit location to server
        socket.emit("send-location", { latitude, longitude });

        // Set map view and add marker
        map.setView([latitude, longitude], 15); // Adjust zoom level as necessary
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here!")
          .openPopup();

        // Call OSRM API to calculate the route to another user's location
        socket.on("update-location", (location) => {
          const { latitude: userLat, longitude: userLon } = location;

          // Use OSRM API to get the route
          getRoute(latitude, longitude, userLat, userLon, (route) => {
            if (route) {
              L.polyline(route, { color: "blue" }).addTo(map);
            }
          });

          // Mark the other user's location
          L.marker([userLat, userLon])
            .addTo(map)
            .bindPopup("A user is here!")
            .openPopup();
        });
      },
      (error) => {
        console.log("Error getting location:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }

  // Function to call OSRM API and get the route
  function getRoute(startLat, startLon, endLat, endLon, callback) {
    // Construct the URL for OSRM API
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=polyline`;

    fetch(osrmUrl)
      .then((response) => response.json())
      .then((data) => {
        if (data.routes && data.routes.length > 0) {
          // Extract the route polyline
          const route = decodePolyline(data.routes[0].geometry);
          callback(route);
        } else {
          console.error("No route found");
          callback(null);
        }
      })
      .catch((error) => {
        console.error("Error fetching route:", error);
        callback(null);
      });
  }

  // Function to decode polyline into lat, lng points
  function decodePolyline(encoded) {
    const points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;

    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dLat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dLon = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dLon;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  }
});
