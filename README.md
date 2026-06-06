# VitaRoute: Intelligent Emergency Response & Ambulance Coordination Platform

VitaRoute is an intelligent emergency response and ambulance coordination platform that optimizes dispatching, route planning, real-time GPS tracking, hospital readiness monitoring, and emergency fleet management to improve response times and patient outcomes. It features an immersive 3D landing experience, a partners showcase, a features dashboard, and a full real-time command center.

## Core Features
1. **Immersive 3D Landing Page**: Three.js-powered feather particle system with parallax depth, organic motion, and scroll-driven transitions.
2. **Partners Section**: Showcases 6 key partners (Red Cross, Hospitals, Ambulance Services, EMS Networks, Dispatch Centers, Trauma Centers) with 3D CSS-rendered icons and warm red-orange particle effects.
3. **Features Dashboard**: "Built for Critical Moments" section with 4 interactive feature cards — Real-Time Traffic Intelligence, Dynamic Route Optimization, Smart Hospital Integration, and Live Fleet Tracking — each with detailed CSS 3D scene visualizations.
4. **Real-Time Command Center**:
   - **Traffic-Aware Routing Engine**: Dijkstra's algorithm on a custom San Francisco street graph, recalculating paths when gridlocks are detected.
   - **Double Path Visualization**: Optimized path (solid glow, colored by congestion) vs. alternative path (dashed grey) for comparison.
   - **Congestion Simulator**: Block/unblock streets to trigger real-time ambulance rerouting with "Time Saved" metrics.
   - **Tactical Dispatcher**: Dispatches idle/returning ambulances to incidents and reroutes based on ER capacity.
5. **Hospital ER Capacity Monitoring**: Live status updates (`NORMAL`, `BUSY`, `CRITICAL`) and capacity load as patients are admitted.
6. **Live Fleet Tracking**: Real-time location of all ambulances with status telemetry every 3 seconds via Socket.io.

---

## Technical Stack
- **Backend**: Node.js, Express, Socket.io (WebSocket server)
- **Frontend**: Vanilla HTML5, CSS3 (3D transforms, Grid/Flexbox), JavaScript
- **3D Graphics**: Three.js (particle systems, feather meshes, network lines)
- **Maps**: Leaflet.js (dark CartoDB tiles), Dijkstra pathfinding
- **Real-time**: Socket.io for fleet telemetry and ER capacity updates

---

## Installation & Run Instructions

### Prerequisites
- Node.js installed on your machine.

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/shambhawikrishnatrya/VitaRoute.git
   cd VitaRoute
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the pathfinding unit tests:
   ```bash
   npm test
   ```
4. Start the server:
   ```bash
   npm start
   ```
5. Open your browser at: [http://localhost:3000](http://localhost:3000)

---

## Project Structure
```
VitaRoute/
├── package.json          # Dependencies and npm scripts
├── server.js             # Server logic, simulation loops, graph definitions, WebSocket
├── test-pathfinding.js   # Unit tests for Dijkstra pathfinding
├── README.md             # Project documentation
└── public/               # Frontend assets
    ├── index.html        # Landing page, partners, features, and dashboard layout
    ├── style.css         # Styling, 3D effects, glassmorphic filters, animations
    ├── landing.js        # Three.js 3D scenes (landing, partners, features)
    └── app.js            # Leaflet map, Socket.io listeners, client-side routing
```
