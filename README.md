# PULSE: Emergency Dispatch & Traffic-Aware Routing Center

PULSE is a real-time command center dashboard designed for emergency fleet dispatchers. It maps ambulances, active incidents, and hospitals in San Francisco on a dark-themed geospatial map. The core feature of PULSE is its **Traffic-Aware Routing Engine** which calculates the fastest path (less traffic) rather than just the shortest path (by distance) to transport patients to hospitals and respond to incidents, saving critical minutes.

## Core Features
1. **Real-time Telemetry (WebSocket-driven)**: Real-time synchronization of fleet status, vehicle speeds, and location telemetry every 3 seconds via Socket.io.
2. **Dynamic Routing Engine**: Uses Dijkstra's algorithm on a custom graph network of San Francisco streets. The engine recalculates paths when gridlocks are detected.
3. **Double Path Visualization**:
   - **Optimized Path (Solid Glow)**: Colored by street-by-street congestion levels (Green: Clear, Yellow: Moderate, Red: Heavy).
   - **Alternative Path (Dashed Grey)**: Shows the standard distance-only path for visual comparison.
4. **Interactive Simulation**:
   - **Congestion Simulator**: Artificially block/unblock streets in the inspector panel to trigger immediate real-time ambulance rerouting and display "Time Saved" metrics.
   - **Tactical Dispatcher**: Dispatches idle/returning ambulances to active incidents and reroutes en-route units to alternative hospitals based on ER capacity loads.
5. **Hospital Bed Capacities**: Displays ER status updates (`NORMAL`, `BUSY`, `CRITICAL`) and capacity load in real-time as patients are admitted.

---

## Technical Stack
- **Backend**: Node.js, Express, Socket.io (WebSocket server).
- **Frontend**: Vanilla HTML5, CSS3 Grid/Flexbox, JavaScript, Leaflet.js (dark tile layer by CartoDB).

---

## Installation & Run Instructions

### Prerequisites
- Node.js installed on your machine.

### Steps
1. Navigate to the project directory:
   ```bash
   cd /Users/shambhawi/Desktop/Pulse
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Run the pathfinding algorithm unit test script:
   ```bash
   npm test
   ```
4. Start the command center server:
   ```bash
   npm start
   ```
5. Open your web browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

---

## Project Structure
```
/Users/shambhawi/Desktop/Pulse
├── package.json          # Node dependencies and npm scripts
├── server.js             # Main server logic, simulation loops, graph definitions, and WebSocket server
├── test-pathfinding.js   # Unit tests validating Dijkstra pathfinding under different traffic jams
├── README.md             # Project documentation
└── public/               # Frontend asset folder
    ├── index.html        # Dashboard frame layout & HUD containers
    ├── style.css         # Styling, glassmorphic filters, and keyframe pulsing animations
    └── app.js            # Leaflet initialization, Socket.io listeners, and client Dijkstra calculators
```
