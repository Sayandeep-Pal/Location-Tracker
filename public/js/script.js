const socket = io("https://location-tracker-sqhw.onrender.com", {
  transports: ["websocket", "polling"], // Allow both WebSocket and HTTP polling
}); // Connect to server

document.addEventListener("DOMContentLoaded", () => {
  // Initialize map with default view
  const map = L.map("map").setView([0, 0], 15); // Centered at India

  // Add OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  // Get User Location
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Emit location to server
        socket.emit("send-location", { latitude, longitude });

        // Set map view and add marker
        map.setView([latitude, longitude], 50);
        L.marker([latitude, longitude])
          .addTo(map)
          .bindPopup("You are here!")
          .openPopup();
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

  // Receive location updates from other users
  socket.on("update-location", (location) => {
    L.marker([location.latitude, location.longitude])
      .addTo(map)
      .bindPopup("A user is here!")
      .openPopup();
  });
});
