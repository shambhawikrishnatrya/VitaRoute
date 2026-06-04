// Simple test script for backend Dijkstra implementation
const fs = require('fs');
const path = require('path');

// Mock a mini version of the server's pathfinding to test
const serverCode = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');

// We can just load the functions by matching or requiring, 
// but since server.js runs a server immediately, let's extract the graph and dijkstra logic, 
// or write a self-contained unit test in this file using the same algorithm.

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

// Re-define graph matching server.js for validation
const graph = {
  nodes: {
    H1: { name: "SF General Hospital", lat: 37.7554, lng: -122.4048 },
    H2: { name: "UCSF Medical Center", lat: 37.7678, lng: -122.3889 },
    H3: { name: "Chinese Hospital", lat: 37.7947, lng: -122.4076 },
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

const adjacencyList = {};
for (let nodeId in graph.nodes) {
  adjacencyList[nodeId] = [];
}
graph.edges.forEach(edge => {
  adjacencyList[edge.from].push(edge.to);
  adjacencyList[edge.to].push(edge.from);
});
graph.adjacencyList = adjacencyList;

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
    const speed = Math.max(10, 45 / trafficMult);
    timeSeconds += (dist / speed) * 3600;
  }

  return {
    distance: parseFloat(distance.toFixed(2)),
    timeMinutes: Math.round(timeSeconds / 60)
  };
}

console.log("=== Running Dijkstra Pathfinding Unit Test ===");
console.log("Routing from UCSF Medical Center (H2) to Castro (I13)...");

// Normal Case (Base Traffic)
const pathNoTraffic = dijkstra("H2", "I13", false);
const statsNoTraffic = calculatePathStats(pathNoTraffic, false);
console.log("\nDistance-only Shortest Path (Ignoring Traffic):");
console.log("Path:", pathNoTraffic.join(" -> "));
console.log("Stats:", statsNoTraffic);

const pathWithTraffic = dijkstra("H2", "I13", true);
const statsWithTraffic = calculatePathStats(pathWithTraffic, true);
console.log("\nTraffic-aware Shortest Path (Normal Base Traffic):");
console.log("Path:", pathWithTraffic.join(" -> "));
console.log("Stats:", statsWithTraffic);

// Simulate block on 16th St East (E20)
console.log("\n--- SIMULATING SEVERE TRAFFIC JAM ON 16th St (E20) ---");
const edge16th = graph.edges.find(e => e.id === "E20");
edge16th.traffic = 8.0;

const pathAfterTraffic = dijkstra("H2", "I13", true);
const statsAfterTraffic = calculatePathStats(pathAfterTraffic, true);
console.log("New Traffic-aware Path (with E20 blocked):");
console.log("Path:", pathAfterTraffic.join(" -> "));
console.log("Stats:", statsAfterTraffic);

const oldPathStatsWithNewTraffic = calculatePathStats(pathWithTraffic, true);
console.log("Old Path stats with the new traffic traffic:", oldPathStatsWithNewTraffic);
console.log(`Dynamic Rerouting saves: ${oldPathStatsWithNewTraffic.timeMinutes - statsAfterTraffic.timeMinutes} minutes!`);

if (pathAfterTraffic.join(",") !== pathWithTraffic.join(",")) {
  console.log("\nSUCCESS: Pathfinding dynamically changed to avoid traffic!");
} else {
  console.log("\nWARNING: Path did not change. Verify if alternative paths exist.");
}
