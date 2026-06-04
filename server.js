const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

// Haversine Distance in Miles
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Simple Priority Queue for Dijkstra
class PriorityQueue {
  constructor() {
    this.elements = [];
  }
  enqueue(element, priority) {
    this.elements.push({ element, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }
  dequeue() {
    return this.elements.shift();
  }
  isEmpty() {
    return this.elements.length === 0;
  }
}

// Map Graph Data representing San Francisco
const graph = {
  nodes: {
    H1: { name: "SF General Hospital (Trauma Center)", lat: 37.7554, lng: -122.4048, isHospital: true },
    H2: { name: "UCSF Medical Center (Mission Bay)", lat: 37.7678, lng: -122.3889, isHospital: true },
    H3: { name: "Chinese Hospital", lat: 37.7947, lng: -122.4076, isHospital: true },
    I1: { name: "Broadway & Stockton", lat: 37.7974, lng: -122.4085 },
    I2: { name: "Embarcadero & Market", lat: 37.7937, lng: -122.3965 },
    I3: { name: "Union Square", lat: 37.7876, lng: -122.4075 },
    I4: { name: "Market & 5th", lat: 37.7841, lng: -122.4079 },
    I5: { name: "Market & 8th", lat: 37.7786, lng: -122.4148 },
    I6: { name: "Mission & 16th", lat: 37.7650, lng: -122.4196 },
    I7: { name: "Folsom & 4th", lat: 37.7820, lng: -122.4005 },
    I8: { name: "Folsom & 8th", lat: 37.7735, lng: -122.4116 },
    I9: { name: "Civic Center", lat: 37.7801, lng: -122.4201 },
    I10: { name: "Mission & 24th", lat: 37.7522, lng: -122.4183 },
    I11: { name: "Potrero & 24th", lat: 37.7523, lng: -122.4078 },
    I12: { name: "16th & Third St", lat: 37.7663, lng: -122.3896 },
    I13: { name: "Castro (18th & Castro)", lat: 37.7609, lng: -122.4350 },
    I14: { name: "Haight-Ashbury", lat: 37.7699, lng: -122.4469 },
    I15: { name: "Pacific Heights (Broadway & Webster)", lat: 37.7938, lng: -122.4330 }
  },
  edges: [
    { id: "E1", from: "I1", to: "I15", street: "Broadway", traffic: 1.0, baseTraffic: 1.0 },
    { id: "E2", from: "I1", to: "H3", street: "Stockton St North", traffic: 1.2, baseTraffic: 1.2 },
    { id: "E3", from: "H3", to: "I3", street: "Stockton St South", traffic: 2.0, baseTraffic: 2.0 },
    { id: "E4", from: "H3", to: "I2", street: "Kearny St", traffic: 1.5, baseTraffic: 1.5 },
    { id: "E5", from: "I2", to: "I4", street: "Market St East", traffic: 2.2, baseTraffic: 2.2 },
    { id: "E6", from: "I4", to: "I5", street: "Market St Mid", traffic: 2.5, baseTraffic: 2.5 },
    { id: "E7", from: "I5", to: "I9", street: "Market St West", traffic: 1.8, baseTraffic: 1.8 },
    { id: "E8", from: "I3", to: "I15", street: "Geary Blvd East", traffic: 1.5, baseTraffic: 1.5 },
    { id: "E9", from: "I4", to: "I7", street: "5th St", traffic: 1.3, baseTraffic: 1.3 },
    { id: "E10", from: "I5", to: "I8", street: "8th St", traffic: 1.4, baseTraffic: 1.4 },
    { id: "E11", from: "I7", to: "I8", street: "Folsom St East", traffic: 1.6, baseTraffic: 1.6 },
    { id: "E12", from: "I8", to: "I9", street: "Folsom St West", traffic: 1.2, baseTraffic: 1.2 },
    { id: "E13", from: "I2", to: "I7", street: "101 Freeway North", traffic: 2.8, baseTraffic: 2.8 },
    { id: "E14", from: "I7", to: "I12", street: "101 Freeway South", traffic: 3.0, baseTraffic: 3.0 },
    { id: "E15", from: "I8", to: "I6", street: "Potrero Ave North", traffic: 1.4, baseTraffic: 1.4 },
    { id: "E16", from: "I6", to: "H1", street: "Potrero Ave Mid", traffic: 1.5, baseTraffic: 1.5 },
    { id: "E17", from: "H1", to: "I11", street: "Potrero Ave South", traffic: 1.2, baseTraffic: 1.2 },
    { id: "E18", from: "I9", to: "I6", street: "Mission St North", traffic: 2.0, baseTraffic: 2.0 },
    { id: "E19", from: "I6", to: "I10", street: "Mission St South", traffic: 1.8, baseTraffic: 1.8 },
    { id: "E20", from: "I6", to: "I12", street: "16th St East", traffic: 1.3, baseTraffic: 1.3 },
    { id: "E21", from: "I12", to: "H2", street: "16th St Waterfront", traffic: 1.1, baseTraffic: 1.1 },
    { id: "E22", from: "I10", to: "I11", street: "24th St East", traffic: 1.2, baseTraffic: 1.2 },
    { id: "E23", from: "I11", to: "H1", street: "24th St SFGH Access", traffic: 1.1, baseTraffic: 1.1 },
    { id: "E24", from: "I9", to: "I13", street: "Duboce Ave", traffic: 1.4, baseTraffic: 1.4 },
    { id: "E25", from: "I9", to: "I14", street: "Fell St", traffic: 2.2, baseTraffic: 2.2 },
    { id: "E26", from: "I13", to: "I14", street: "Castro St North", traffic: 1.3, baseTraffic: 1.3 },
    { id: "E27", from: "I13", to: "I10", street: "Castro St South", traffic: 1.1, baseTraffic: 1.1 },
    { id: "E28", from: "I14", to: "I15", street: "Divisadero St", traffic: 1.5, baseTraffic: 1.5 }
  ]
};

// Adjacency List building helper
const adjacencyList = {};
for (let nodeId in graph.nodes) {
  adjacencyList[nodeId] = [];
}
graph.edges.forEach(edge => {
  adjacencyList[edge.from].push(edge.to);
  adjacencyList[edge.to].push(edge.from); // Undirected graph
});
graph.adjacencyList = adjacencyList;

// Dijkstra Algorithm
function dijkstra(startNodeId, endNodeId, useTraffic = true) {
  const distances = {};
  const previous = {};
  const queue = new PriorityQueue();

  for (let nodeId in graph.nodes) {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  }
  distances[startNodeId] = 0;
  queue.enqueue(startNodeId, 0);

  while (!queue.isEmpty()) {
    const { element: currentNodeId, priority: currentDist } = queue.dequeue();

    if (currentNodeId === endNodeId) break;
    if (currentDist > distances[currentNodeId]) continue;

    const neighbors = graph.adjacencyList[currentNodeId] || [];
    for (let neighbor of neighbors) {
      const edge = graph.edges.find(e => 
        (e.from === currentNodeId && e.to === neighbor) || 
        (e.to === currentNodeId && e.from === neighbor)
      );
      if (!edge) continue;

      const edgeDistance = haversineDistance(
        graph.nodes[currentNodeId].lat, graph.nodes[currentNodeId].lng,
        graph.nodes[neighbor].lat, graph.nodes[neighbor].lng
      );

      const multiplier = useTraffic ? edge.traffic : 1.0;
      const weight = edgeDistance * multiplier;
      const newDist = distances[currentNodeId] + weight;

      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        previous[neighbor] = currentNodeId;
        queue.enqueue(neighbor, newDist);
      }
    }
  }

  const path = [];
  let curr = endNodeId;
  while (curr !== null) {
    path.unshift(curr);
    curr = previous[curr];
  }

  return path.length > 1 && path[0] === startNodeId ? path : [];
}

// Calculate total path distance and estimated travel time
function calculatePathStats(path, useTraffic = true) {
  let distance = 0;
  let timeSeconds = 0;
  
  for (let i = 0; i < path.length - 1; i++) {
    const nodeA = graph.nodes[path[i]];
    const nodeB = graph.nodes[path[i+1]];
    const dist = haversineDistance(nodeA.lat, nodeA.lng, nodeB.lat, nodeB.lng);
    distance += dist;

    const edge = graph.edges.find(e => 
      (e.from === path[i] && e.to === path[i+1]) || 
      (e.to === path[i] && e.from === path[i+1])
    );
    const trafficMult = useTraffic && edge ? edge.traffic : 1.0;
    
    // Base speed = 45 mph for ambulances, adjusted by traffic multiplier
    const speed = Math.max(10, 45 / trafficMult);
    timeSeconds += (dist / speed) * 3600;
  }

  return {
    distance: parseFloat(distance.toFixed(2)),
    timeMinutes: Math.round(timeSeconds / 60)
  };
}

// Initialize state
let ambulances = {
  "RESCUE-101": {
    id: "RESCUE-101",
    name: "RESCUE-101",
    status: "IDLE", // IDLE, DISPATCHED, EN ROUTE, AT SCENE, RETURNING
    lat: graph.nodes.H1.lat,
    lng: graph.nodes.H1.lng,
    speed: 0,
    crew: 2,
    route: [],
    routeIndex: 0,
    routeProgress: 0,
    destination: null,
    destinationType: null, // incident, hospital
    targetId: null,
    lastUpdate: Date.now()
  },
  "RESCUE-102": {
    id: "RESCUE-102",
    name: "RESCUE-102",
    status: "IDLE",
    lat: graph.nodes.H2.lat,
    lng: graph.nodes.H2.lng,
    speed: 0,
    crew: 2,
    route: [],
    routeIndex: 0,
    routeProgress: 0,
    destination: null,
    destinationType: null,
    targetId: null,
    lastUpdate: Date.now()
  },
  "RESCUE-103": {
    id: "RESCUE-103",
    name: "RESCUE-103",
    status: "EN ROUTE",
    lat: graph.nodes.H2.lat,
    lng: graph.nodes.H2.lng,
    speed: 54,
    crew: 2,
    route: [],
    routeIndex: 0,
    routeProgress: 0,
    destination: "I3", // Union Square (INCIDENT-301)
    destinationType: "incident",
    targetId: "INCIDENT-301",
    lastUpdate: Date.now()
  },
  "RESCUE-104": {
    id: "RESCUE-104",
    name: "RESCUE-104",
    status: "DISPATCHED",
    lat: graph.nodes.H3.lat,
    lng: graph.nodes.H3.lng,
    speed: 0,
    crew: 2,
    route: [],
    routeIndex: 0,
    routeProgress: 0,
    destination: "I13", // Castro (INCIDENT-302)
    destinationType: "incident",
    targetId: "INCIDENT-302",
    lastUpdate: Date.now()
  },
  "RESCUE-105": {
    id: "RESCUE-105",
    name: "RESCUE-105",
    status: "AT SCENE",
    lat: graph.nodes.I15.lat,
    lng: graph.nodes.I15.lng,
    speed: 0,
    crew: 2,
    route: [],
    routeIndex: 0,
    routeProgress: 0,
    destination: "I15", // Pacific Heights (INCIDENT-303)
    destinationType: "incident",
    targetId: "INCIDENT-303",
    lastUpdate: Date.now()
  }
};

let incidents = [
  { id: "INCIDENT-301", type: "Cardiac Arrest", severity: "CRITICAL", locationNode: "I3", lat: graph.nodes.I3.lat, lng: graph.nodes.I3.lng, status: "ACTIVE", assignedUnit: "RESCUE-103" },
  { id: "INCIDENT-302", type: "Major MVA", severity: "CRITICAL", locationNode: "I13", lat: graph.nodes.I13.lat, lng: graph.nodes.I13.lng, status: "ACTIVE", assignedUnit: "RESCUE-104" },
  { id: "INCIDENT-303", type: "Respiratory Distress", severity: "SERIOUS", locationNode: "I15", lat: graph.nodes.I15.lat, lng: graph.nodes.I15.lng, status: "ACTIVE", assignedUnit: "RESCUE-105" }
];

let hospitals = {
  H1: { id: "H1", name: "San Francisco General Hospital", code: "SFGH", lat: 37.7554, lng: -122.4048, type: "TRAUMA", beds: 15, maxBeds: 45, erStatus: "NORMAL" },
  H2: { id: "H2", name: "UCSF Medical Center", code: "UCSF", lat: 37.7678, lng: -122.3889, type: "TRAUMA", beds: 13, maxBeds: 30, erStatus: "BUSY" },
  H3: { id: "H3", name: "Chinese Hospital", code: "CHIN", lat: 37.7947, lng: -122.4076, type: "GENERAL", beds: 7, maxBeds: 15, erStatus: "NORMAL" }
};

// Set initial routes for active simulation units
// RESCUE-103: H2 -> I3 (Union Square)
const route103 = dijkstra("H2", "I3", true);
ambulances["RESCUE-103"].route = route103;
ambulances["RESCUE-103"].routeIndex = 0;
ambulances["RESCUE-103"].routeProgress = 0.01;

// RESCUE-104: H3 -> I13 (Castro)
const route104 = dijkstra("H3", "I13", true);
ambulances["RESCUE-104"].route = route104;
ambulances["RESCUE-104"].routeIndex = 0;
ambulances["RESCUE-104"].routeProgress = 0.01;

// Notifications list to push to client
let notifications = [
  { id: 1, text: "System Online: 5 units connected to Fleet Command.", time: new Date().toLocaleTimeString(), type: "info" },
  { id: 2, text: "INCIDENT-301 reported: Cardiac Arrest at Union Square.", time: new Date().toLocaleTimeString(), type: "critical" },
  { id: 3, text: "RESCUE-103 dispatched to INCIDENT-301.", time: new Date().toLocaleTimeString(), type: "dispatch" }
];

// Helper to push notifications
function addNotification(text, type = "info") {
  const notification = {
    id: Date.now(),
    text,
    time: new Date().toLocaleTimeString(),
    type
  };
  notifications.unshift(notification);
  if (notifications.length > 50) notifications.pop();
  io.emit('notification', notification);
}

// Simulation loop (runs every 3 seconds)
setInterval(() => {
  // 1. Dynamic traffic fluctuation on streets
  graph.edges.forEach(edge => {
    // Randomly fluctuate traffic by +-10%, but keep it above baseTraffic and max of 8.0
    // Don't fluctuate active manual traffic jams (traffic >= 6.0)
    if (edge.traffic < 6.0) {
      const change = (Math.random() - 0.5) * 0.2; // -10% to +10%
      edge.traffic = Math.max(edge.baseTraffic, Math.min(5.0, edge.traffic + change));
    }
  });

  // Broadcast traffic update to all clients
  io.emit('traffic_update', graph.edges);

  // 2. Move active ambulances
  Object.keys(ambulances).forEach(unitId => {
    const unit = ambulances[unitId];

    if (["EN ROUTE", "DISPATCHED", "RETURNING"].includes(unit.status) && unit.route.length > 1) {
      const fromNodeId = unit.route[unit.routeIndex];
      const toNodeId = unit.route[unit.routeIndex + 1];

      if (!fromNodeId || !toNodeId) return;

      const fromNode = graph.nodes[fromNodeId];
      const toNode = graph.nodes[toNodeId];

      const edge = graph.edges.find(e => 
        (e.from === fromNodeId && e.to === toNodeId) || 
        (e.to === fromNodeId && e.from === toNodeId)
      );

      const trafficMult = edge ? edge.traffic : 1.0;
      // Normal emergency speed is 50 mph, base returning is 35 mph
      const baseSpeed = unit.status === "RETURNING" ? 35 : 50;
      const currentSpeed = Math.max(10, baseSpeed / trafficMult);
      unit.speed = Math.round(currentSpeed);

      // Distance of this specific edge in miles
      const edgeDist = haversineDistance(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);

      // Distance traveled in 3 seconds: Speed (mph) / 3600 * 3
      const distTraveled = (currentSpeed / 3600) * 3;

      // Progress increment
      unit.routeProgress += distTraveled / edgeDist;

      if (unit.routeProgress >= 1.0) {
        // Move to next node in the route
        unit.routeIndex++;
        unit.routeProgress = 0;

        if (unit.routeIndex >= unit.route.length - 1) {
          // Arrived at destination!
          if (unit.status === "RETURNING") {
            unit.status = "IDLE";
            unit.speed = 0;
            unit.route = [];
            unit.destination = null;
            unit.destinationType = null;
            unit.targetId = null;
            unit.lat = toNode.lat;
            unit.lng = toNode.lng;
            addNotification(`${unit.name} is now IDLE at ${toNode.name}.`, "info");
          } else if (unit.destinationType === "incident") {
            unit.status = "AT SCENE";
            unit.speed = 0;
            unit.lat = toNode.lat;
            unit.lng = toNode.lng;
            
            // Mark incident as treating
            const incident = incidents.find(inc => inc.id === unit.targetId);
            if (incident) {
              incident.status = "TREATING";
            }
            addNotification(`${unit.name} arrived at scene of ${incident ? incident.type : 'incident'}.`, "success");

            // Auto-trigger transport to nearest hospital after 15 seconds (5 ticks)
            setTimeout(() => {
              // Only transport if still AT SCENE and has an incident
              if (unit.status === "AT SCENE" && unit.destinationType === "incident") {
                // Find hospital: default SF General or choose UCSF/Chinese depending on load
                // SFGH (H1) is trauma default. Let's find path to all hospitals, find fastest
                let bestHospital = "H1";
                let bestTime = Infinity;
                
                Object.keys(hospitals).forEach(hospId => {
                  const path = dijkstra(toNodeId, hospId, true);
                  if (path.length > 0) {
                    const stats = calculatePathStats(path, true);
                    if (stats.timeMinutes < bestTime && hospitals[hospId].beds < hospitals[hospId].maxBeds) {
                      bestTime = stats.timeMinutes;
                      bestHospital = hospId;
                    }
                  }
                });

                const routeToHosp = dijkstra(toNodeId, bestHospital, true);
                unit.status = "EN ROUTE";
                unit.route = routeToHosp;
                unit.routeIndex = 0;
                unit.routeProgress = 0.01;
                unit.destination = bestHospital;
                unit.destinationType = "hospital";
                unit.speed = 50;

                addNotification(`${unit.name} transporting patient to ${hospitals[bestHospital].name}.`, "dispatch");
              }
            }, 12000);

          } else if (unit.destinationType === "hospital") {
            // Arrived at Hospital! Admitting patient
            unit.status = "AT SCENE";
            unit.speed = 0;
            unit.lat = toNode.lat;
            unit.lng = toNode.lng;

            // Increment hospital beds occupied
            const hosp = hospitals[unit.destination];
            if (hosp && hosp.beds < hosp.maxBeds) {
              hosp.beds++;
            }

            // Close the incident
            const incIdx = incidents.findIndex(inc => inc.assignedUnit === unit.id);
            if (incIdx !== -1) {
              addNotification(`Patient admitted to ${hosp ? hosp.name : 'hospital'}. Incident ${incidents[incIdx].id} resolved.`, "success");
              incidents.splice(incIdx, 1);
            }

            // Make hospital busy if full
            if (hosp && hosp.beds / hosp.maxBeds > 0.8) {
              hosp.erStatus = "CRITICAL";
            } else if (hosp && hosp.beds / hosp.maxBeds > 0.5) {
              hosp.erStatus = "BUSY";
            }

            // Stay at hospital for 9 seconds (3 ticks), then go back to IDLE
            setTimeout(() => {
              if (unit.status === "AT SCENE" && unit.destinationType === "hospital") {
                unit.status = "IDLE";
                unit.destination = null;
                unit.destinationType = null;
                unit.targetId = null;
                unit.route = [];
                addNotification(`${unit.name} is now IDLE at ${hosp ? hosp.name : 'hospital'}.`, "info");
              }
            }, 9000);
          }
        }
      } else {
        // Interpolate position along current edge
        unit.lat = fromNode.lat + (toNode.lat - fromNode.lat) * unit.routeProgress;
        unit.lng = fromNode.lng + (toNode.lng - fromNode.lng) * unit.routeProgress;
      }
    }
  });

  // Broadcast ambulance and incident data updates
  io.emit('fleet_update', {
    ambulances,
    incidents,
    hospitals
  });
}, 3000);

// Helper to find nearest intersection node in the graph for an arbitrary lat/lng
function findNearestNode(lat, lng) {
  let nearestId = null;
  let minDist = Infinity;
  for (let nodeId in graph.nodes) {
    const dist = haversineDistance(lat, lng, graph.nodes[nodeId].lat, graph.nodes[nodeId].lng);
    if (dist < minDist) {
      minDist = dist;
      nearestId = nodeId;
    }
  }
  return nearestId;
}

// Websocket connection events
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send initial data to newly connected client
  socket.emit('init_data', {
    graph,
    ambulances,
    incidents,
    hospitals,
    notifications
  });

  // Dispatch event
  socket.on('dispatch_unit', (data) => {
    const { unitId, incidentId } = data;
    const unit = ambulances[unitId];
    const incident = incidents.find(inc => inc.id === incidentId);

    if (!unit || !incident) {
      socket.emit('error_message', { message: "Invalid unit or incident ID." });
      return;
    }

    if (unit.status !== "IDLE" && unit.status !== "RETURNING") {
      socket.emit('error_message', { message: `${unitId} is busy: ${unit.status}` });
      return;
    }

    // Find nearest node to unit's current position to start route
    const startNode = findNearestNode(unit.lat, unit.lng);
    const endNode = incident.locationNode;

    const path = dijkstra(startNode, endNode, true);
    
    if (path.length === 0) {
      socket.emit('error_message', { message: "No route available to this incident." });
      return;
    }

    // Assign
    incident.assignedUnit = unitId;
    incident.status = "DISPATCHED";

    unit.status = "EN ROUTE";
    unit.destination = endNode;
    unit.destinationType = "incident";
    unit.targetId = incidentId;
    unit.route = path;
    unit.routeIndex = 0;
    unit.routeProgress = 0.01;

    addNotification(`ALERT: ${unitId} dispatched to ${incident.type} at ${graph.nodes[endNode].name}.`, "dispatch");

    io.emit('fleet_update', { ambulances, incidents, hospitals });
  });

  // Reroute event
  socket.on('reroute_unit', (data) => {
    const { unitId, hospitalId } = data;
    const unit = ambulances[unitId];
    const hospital = hospitals[hospitalId];

    if (!unit || !hospital) {
      socket.emit('error_message', { message: "Invalid unit or hospital ID." });
      return;
    }

    // Find nearest node to current coordinates
    const startNode = findNearestNode(unit.lat, unit.lng);
    const path = dijkstra(startNode, hospitalId, true);

    if (path.length === 0) {
      socket.emit('error_message', { message: "No route available to this hospital." });
      return;
    }

    unit.status = "EN ROUTE";
    unit.destination = hospitalId;
    unit.destinationType = "hospital";
    unit.route = path;
    unit.routeIndex = 0;
    unit.routeProgress = 0.01;

    addNotification(`REROUTE: ${unitId} redirected to ${hospital.name}.`, "info");
    io.emit('fleet_update', { ambulances, incidents, hospitals });
  });

  // Manual Traffic Jam Injector
  socket.on('toggle_traffic', (data) => {
    const { edgeId, isBlocked } = data;
    const edge = graph.edges.find(e => e.id === edgeId);

    if (!edge) return;

    if (isBlocked) {
      edge.traffic = 8.0; // Huge congestion multiplier
      addNotification(`TRAFFIC ALERT: Severe gridlock simulated on ${edge.street}.`, "warning");
    } else {
      edge.traffic = edge.baseTraffic; // Restore base
      addNotification(`TRAFFIC CLEAR: Flow returned to normal on ${edge.street}.`, "success");
    }

    // Trigger Dynamic Rerouting for any active ambulances whose route contains this blocked edge
    Object.keys(ambulances).forEach(unitId => {
      const unit = ambulances[unitId];
      if (["EN ROUTE", "DISPATCHED"].includes(unit.status) && unit.route.length > 0) {
        // Check if remaining route has this edge
        let containsEdge = false;
        for (let i = unit.routeIndex; i < unit.route.length - 1; i++) {
          const from = unit.route[i];
          const to = unit.route[i+1];
          if ((from === edge.from && to === edge.to) || (from === edge.to && to === edge.from)) {
            containsEdge = true;
            break;
          }
        }

        if (containsEdge) {
          // Re-calculate route from next node onwards
          const nextNode = unit.route[unit.routeIndex]; // Current segment target
          const destinationNode = unit.destination;
          
          const newPath = dijkstra(nextNode, destinationNode, true);
          if (newPath.length > 0) {
            // Compare stats of old remaining path vs new path
            const oldRemainingPath = unit.route.slice(unit.routeIndex);
            const oldStats = calculatePathStats(oldRemainingPath, true);
            const newStats = calculatePathStats(newPath, true);
            
            // Only reroute if the new route actually saves time
            if (newStats.timeMinutes < oldStats.timeMinutes) {
              const minutesSaved = Math.max(1, oldStats.timeMinutes - newStats.timeMinutes);
              
              // Stitch route: completed parts + new path
              const completedRoute = unit.route.slice(0, unit.routeIndex);
              const stitchedRoute = [...completedRoute, ...newPath];
              
              unit.route = stitchedRoute;
              unit.routeProgress = 0.01; // reset progress slightly to snap to next node safely
              
              addNotification(`DYNAMIC REROUTE: ${unit.name} rerouted around ${edge.street}. Time Saved: ~${minutesSaved} mins!`, "success");
            }
          }
        }
      }
    });

    // Send updates immediately
    io.emit('traffic_update', graph.edges);
    io.emit('fleet_update', { ambulances, incidents, hospitals });
  });

  // Create new incident (simulating calls)
  socket.on('create_incident', (data) => {
    const { type, severity, locationNode } = data;
    const node = graph.nodes[locationNode];

    if (!node) return;

    const newIncident = {
      id: `INCIDENT-${300 + incidents.length + 4}`, // unique incident id
      type,
      severity,
      locationNode,
      lat: node.lat,
      lng: node.lng,
      status: "ACTIVE",
      assignedUnit: null
    };

    incidents.push(newIncident);
    addNotification(`NEW INCIDENT: ${severity} - ${type} reported at ${node.name}.`, "critical");
    
    io.emit('fleet_update', { ambulances, incidents, hospitals });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
