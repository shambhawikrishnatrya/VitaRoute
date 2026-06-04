// Pulse Frontend Client Logic
const socket = io();

// Application State
let graph = null;
let ambulances = {};
let incidents = [];
let hospitals = {};
let selectedUnitId = null;
let currentFilter = 'ALL';

// Leaflet Map Variables
let map = null;
let markers = {
  ambulances: {},
  incidents: {},
  hospitals: {}
};
let routeLines = {
  optimized: [], // Array of polyline segments
  alternative: null // Single polyline for distance-only path
};

// Initialize Map
function initMap(initialGraph) {
  graph = initialGraph;
  
  // Center of San Francisco (SoMa / Civic Center area)
  map = L.map('map', {
    zoomControl: false,
    attributionControl: false
  }).setView([37.7749, -122.4194], 13);
  
  // Add zoom control to bottom right
  L.control.zoom({ position: 'bottomright' }).addTo(map);

  // CartoDB Dark Matter Tiles (No labels version for high-tech look)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    subdomains: 'abcd'
  }).addTo(map);

  // Track coordinates and update HUD
  map.on('mousemove', (e) => {
    document.getElementById('hud-lat').innerText = `${e.latlng.lat.toFixed(4)}° N`;
    document.getElementById('hud-lng').innerText = `${e.latlng.lng.toFixed(4)}° W`;
  });

  map.on('zoomend', () => {
    document.getElementById('hud-zoom').innerText = map.getZoom();
  });

  // Render static hospitals
  renderHospitals();
}

// Haversine Distance Helper
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Priority Queue for Client Dijkstra
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

// Client-side Dijkstra (matches server logic)
function clientDijkstra(startNodeId, endNodeId, useTraffic = true) {
  if (!graph) return [];
  const distances = {};
  const previous = {};
  const queue = new PriorityQueue();

  for (let nodeId in graph.nodes) {
    distances[nodeId] = Infinity;
    previous[nodeId] = null;
  }
  distances[startNodeId] = 0;
  queue.enqueue(startNodeId, 0);

  // Build Adjacency List dynamically if not present
  if (!graph.adjacencyList) {
    const list = {};
    for (let nodeId in graph.nodes) {
      list[nodeId] = [];
    }
    graph.edges.forEach(edge => {
      list[edge.from].push(edge.to);
      list[edge.to].push(edge.from);
    });
    graph.adjacencyList = list;
  }

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

// Calculate path stats for comparison card
function clientCalculatePathStats(path, useTraffic = true) {
  let distance = 0;
  let timeSeconds = 0;
  
  for (let i = 0; i < path.length - 1; i++) {
    const nodeA = graph.nodes[path[i]];
    const nodeB = graph.nodes[path[i+1]];
    if (!nodeA || !nodeB) continue;
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

// Render Hospital Markers
function renderHospitals() {
  for (let id in graph.nodes) {
    const node = graph.nodes[id];
    if (node.isHospital) {
      const hIcon = L.divIcon({
        className: 'leaflet-div-icon',
        html: `<div class="hospital-marker">H</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      markers.hospitals[id] = L.marker([node.lat, node.lng], { icon: hIcon })
        .bindPopup(`<b>${node.name}</b><br/>Emergency Medical Services Ready`)
        .addTo(map);
    }
  }
}

// Update Incidents Markers
function updateIncidentMarkers(updatedIncidents) {
  // Clear old incident markers not present in update
  Object.keys(markers.incidents).forEach(id => {
    if (!updatedIncidents.some(inc => inc.id === id)) {
      markers.incidents[id].remove();
      delete markers.incidents[id];
    }
  });

  // Add/Update new incident markers
  updatedIncidents.forEach(inc => {
    const incIcon = L.divIcon({
      className: 'leaflet-div-icon',
      html: `<div class="incident-marker ${inc.severity.toLowerCase() === 'critical' ? '' : 'serious'}"></div>`,
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    if (markers.incidents[inc.id]) {
      markers.incidents[inc.id].setLatLng([inc.lat, inc.lng]);
    } else {
      markers.incidents[inc.id] = L.marker([inc.lat, inc.lng], { icon: incIcon })
        .bindPopup(`<b>${inc.id}</b><br/>Type: ${inc.type}<br/>Severity: ${inc.severity}<br/>Status: ${inc.status}`)
        .addTo(map);
    }
  });
}

// Update Ambulance Markers on Map
function updateAmbulanceMarkers(updatedAmbulances) {
  Object.keys(updatedAmbulances).forEach(id => {
    const unit = updatedAmbulances[id];
    
    // Custom Icon with Pulsing rings if Active
    const isActive = ["EN ROUTE", "DISPATCHED"].includes(unit.status);
    const isAtScene = unit.status === "AT SCENE";
    const statusClass = isActive ? 'active-unit' : (isAtScene ? 'dispatched-unit' : '');
    const ringClass = unit.destinationType === "incident" && unit.status === "DISPATCHED" ? 'dispatched-ring' : '';
    
    let iconHtml = '';
    if (isActive) {
      iconHtml += `<div class="pulse-ring ${ringClass}"></div>`;
    }
    const label = id.split('-')[1]; // e.g. "101"
    iconHtml += `<div class="ambulance-marker ${statusClass}">${label}</div>`;

    const ambIcon = L.divIcon({
      className: 'leaflet-div-icon',
      html: iconHtml,
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });

    if (markers.ambulances[id]) {
      markers.ambulances[id].setLatLng([unit.lat, unit.lng]);
      // Update icon dynamically to change pulses
      markers.ambulances[id].setIcon(ambIcon);
    } else {
      markers.ambulances[id] = L.marker([unit.lat, unit.lng], { icon: ambIcon })
        .bindPopup(`<b>${unit.name}</b><br/>Status: ${unit.status}<br/>Crew: ${unit.crew}`)
        .addTo(map);
        
      markers.ambulances[id].on('click', () => {
        selectUnit(id);
      });
    }
  });
}

// Draw polyline routes for the selected ambulance
function updateSelectedUnitRoutes() {
  // Clear existing lines
  routeLines.optimized.forEach(seg => seg.remove());
  routeLines.optimized = [];
  if (routeLines.alternative) {
    routeLines.alternative.remove();
    routeLines.alternative = null;
  }

  if (!selectedUnitId) return;

  const unit = ambulances[selectedUnitId];
  if (!unit || !["EN ROUTE", "DISPATCHED"].includes(unit.status) || unit.route.length === 0) return;

  // 1. Draw Distance-Only Alternative Route (Dashed Grey)
  // Determine start/end of remaining path
  const nextTargetNode = unit.route[unit.routeIndex];
  const finalDestNode = unit.destination;

  if (nextTargetNode && finalDestNode && nextTargetNode !== finalDestNode) {
    // Run Dijkstra without traffic from the next node to final destination
    const altPathNodes = clientDijkstra(nextTargetNode, finalDestNode, false);
    if (altPathNodes.length > 0) {
      // Connect ambulance coordinates to the first node of alternative path
      const altLatLngs = [[unit.lat, unit.lng]];
      altPathNodes.forEach(nodeId => {
        const node = graph.nodes[nodeId];
        if (node) altLatLngs.push([node.lat, node.lng]);
      });

      routeLines.alternative = L.polyline(altLatLngs, {
        color: '#4b5563',
        dashArray: '6, 6',
        weight: 3,
        opacity: 0.6,
        lineCap: 'round'
      }).addTo(map);
    }
  }

  // 2. Draw Optimized Traffic-Aware Route (Segment by segment, colored by congestion)
  // First segment: Ambulance coords to the upcoming waypoint node (route[routeIndex])
  if (nextTargetNode) {
    const nextNode = graph.nodes[nextTargetNode];
    if (nextNode) {
      // Find edge for color
      const currentSegmentFromNode = unit.routeIndex > 0 ? unit.route[unit.routeIndex - 1] : findNearestNode(unit.lat, unit.lng);
      const edge = graph.edges.find(e => 
        (e.from === currentSegmentFromNode && e.to === nextTargetNode) || 
        (e.to === currentSegmentFromNode && e.from === nextTargetNode)
      );
      
      const traffic = edge ? edge.traffic : 1.0;
      let strokeColor = '#10b981'; // normal (green)
      if (traffic >= 3.0) strokeColor = '#ef4444'; // critical (red)
      else if (traffic >= 1.5) strokeColor = '#f59e0b'; // heavy (yellow/orange)

      const segLine = L.polyline([[unit.lat, unit.lng], [nextNode.lat, nextNode.lng]], {
        color: strokeColor,
        weight: 5,
        opacity: 0.8,
        lineCap: 'round'
      }).addTo(map);
      routeLines.optimized.push(segLine);
    }
  }

  // Subsequent segments: From routeIndex to the end
  for (let i = unit.routeIndex; i < unit.route.length - 1; i++) {
    const fromId = unit.route[i];
    const toId = unit.route[i+1];
    const fromNode = graph.nodes[fromId];
    const toNode = graph.nodes[toId];

    if (!fromNode || !toNode) continue;

    const edge = graph.edges.find(e => 
      (e.from === fromId && e.to === toId) || 
      (e.to === fromId && e.from === toId)
    );
    const traffic = edge ? edge.traffic : 1.0;

    let strokeColor = '#10b981'; // Green
    if (traffic >= 3.0) strokeColor = '#ef4444'; // Red
    else if (traffic >= 1.5) strokeColor = '#f59e0b'; // Yellow/Orange

    const segLine = L.polyline([[fromNode.lat, fromNode.lng], [toNode.lat, toNode.lng]], {
      color: strokeColor,
      weight: 5,
      opacity: 0.8,
      lineCap: 'round'
    }).addTo(map);
    routeLines.optimized.push(segLine);
  }
}

// Find nearest graph node to coordinate
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

// Filter List of units
function setFilter(filterType) {
  currentFilter = filterType;
  
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  if (filterType === 'ALL') document.getElementById('filter-all').classList.add('active');
  else if (filterType === 'EN ROUTE') document.getElementById('filter-enroute').classList.add('active');
  else if (filterType === 'IDLE') document.getElementById('filter-idle').classList.add('active');
  
  renderFleetList();
}

// Render Left Sidebar Fleet List Cards
function renderFleetList() {
  const container = document.getElementById('fleet-list-container');
  container.innerHTML = '';

  let count = 0;
  Object.keys(ambulances).forEach(id => {
    const unit = ambulances[id];
    
    // Filtering logic
    if (currentFilter === 'EN ROUTE' && !["EN ROUTE", "DISPATCHED"].includes(unit.status)) return;
    if (currentFilter === 'IDLE' && unit.status !== 'IDLE') return;

    count++;

    const isSelected = id === selectedUnitId;
    const card = document.createElement('div');
    card.className = `fleet-card ${isSelected ? 'active' : ''}`;
    card.onclick = () => selectUnit(id);

    const statusBadgeText = unit.status.replace('_', ' ');
    const badgeClass = unit.status.toLowerCase();

    // Live speed indicator class
    const isMoving = unit.speed > 0;
    const speedValClass = isMoving ? 'speed-live' : '';

    // Next destination labeling
    let destLabel = 'None';
    if (unit.destination) {
      const destNode = graph.nodes[unit.destination];
      destLabel = destNode ? destNode.name.split('(')[0].trim() : unit.destination;
    }

    card.innerHTML = `
      <div class="card-header-row">
        <span class="unit-name">${unit.name}</span>
        <span class="status-badge ${badgeClass}">${statusBadgeText}</span>
      </div>
      <div class="card-details">
        <span class="detail-label">Speed</span>
        <span class="detail-value ${speedValClass}">${unit.speed} mph</span>
        <span class="detail-label">Destination</span>
        <span class="detail-value" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 110px;">${destLabel}</span>
        <span class="detail-label">Crew</span>
        <span class="detail-value">${unit.crew}</span>
      </div>
      ${isMoving ? `
      <div class="live-pulse-container">
        <span class="live-dot"></span>
        LIVE TRACKING ACTIVE
      </div>
      ` : ''}
    `;

    container.appendChild(card);
  });

  document.getElementById('fleet-unit-count').innerText = `${count} UNITS`;
}

// Select specific Ambulance to inspect
function selectUnit(unitId) {
  selectedUnitId = selectedUnitId === unitId ? null : unitId; // toggle select
  
  // Re-render list to show active state
  renderFleetList();
  
  // Update detail inspector
  updateInspectorPanel();

  // Draw lines
  updateSelectedUnitRoutes();

  // If a unit is selected, zoom/pan map to it
  if (selectedUnitId) {
    const unit = ambulances[selectedUnitId];
    if (unit) {
      map.panTo([unit.lat, unit.lng]);
    }
  }
}

// Update the Inspector (Right Sidebar) contents
function updateInspectorPanel() {
  const emptyView = document.getElementById('empty-inspector-view');
  const activeView = document.getElementById('active-inspector-view');

  if (!selectedUnitId) {
    emptyView.style.display = 'flex';
    activeView.style.display = 'none';
    return;
  }

  emptyView.style.display = 'none';
  activeView.style.display = 'flex';

  const unit = ambulances[selectedUnitId];
  
  // Update name, crew, status badge
  document.getElementById('inspect-unit-name').innerText = unit.name;
  document.getElementById('inspect-unit-crew').innerText = unit.crew;
  
  const statusBadge = document.getElementById('inspect-unit-badge');
  statusBadge.innerText = unit.status.replace('_', ' ');
  statusBadge.className = `status-badge ${unit.status.toLowerCase()}`;

  // Update Dynamic Routing stats card
  const routingCard = document.getElementById('routing-stats-card');
  if (["EN ROUTE", "DISPATCHED"].includes(unit.status) && unit.route.length > 0) {
    routingCard.style.display = 'block';
    
    // Calculate stats locally using client path stats
    const nextWaypointNode = unit.route[unit.routeIndex];
    const finalDest = unit.destination;

    if (nextWaypointNode && finalDest) {
      // 1. Calculate traffic-aware time
      // Reroute from next waypoint to final destination
      const trafficPath = clientDijkstra(nextWaypointNode, finalDest, true);
      const trafficStats = clientCalculatePathStats(trafficPath, true);

      // 2. Calculate distance-only time (ignoring traffic)
      const distPath = clientDijkstra(nextWaypointNode, finalDest, false);
      const distStats = clientCalculatePathStats(distPath, false);

      // 3. Time Saved
      // Find what the traffic-aware route *would* take if we used distance-only path in actual traffic
      // This is the true metric of savings!
      const distPathInTrafficStats = clientCalculatePathStats(distPath, true);
      const timeSaved = Math.max(0, distPathInTrafficStats.timeMinutes - trafficStats.timeMinutes);

      document.getElementById('routing-time-saved').innerText = `${timeSaved} min`;
      document.getElementById('routing-dist-only').innerText = `${distStats.timeMinutes} min`;
      document.getElementById('routing-traffic-aware').innerText = `${trafficStats.timeMinutes} min`;
      
      // Update green status
      if (timeSaved > 0) {
        document.getElementById('routing-time-saved').style.color = '#10b981';
      } else {
        document.getElementById('routing-time-saved').style.color = '#fff';
      }
    }
  } else {
    routingCard.style.display = 'none';
  }

  // Update Tactical Action panel dropdown options
  const dispatchGroup = document.getElementById('dispatch-group');
  const rerouteGroup = document.getElementById('reroute-group');
  const busyGroup = document.getElementById('busy-no-controls');

  dispatchGroup.style.display = 'none';
  rerouteGroup.style.display = 'none';
  busyGroup.style.display = 'none';

  if (unit.status === 'IDLE' || unit.status === 'RETURNING') {
    dispatchGroup.style.display = 'block';
    // Populate incident dropdown
    const select = document.getElementById('incident-select');
    select.innerHTML = '';
    
    const unassignedIncidents = incidents.filter(inc => !inc.assignedUnit || inc.assignedUnit === unit.id);
    if (unassignedIncidents.length === 0) {
      select.innerHTML = '<option value="">No Active Incidents</option>';
    } else {
      unassignedIncidents.forEach(inc => {
        const node = graph.nodes[inc.locationNode];
        const locationName = node ? node.name.split('(')[0].trim() : inc.locationNode;
        select.innerHTML += `<option value="${inc.id}">${inc.id} - ${inc.type} (${locationName})</option>`;
      });
    }
  } else if (["EN ROUTE", "DISPATCHED"].includes(unit.status)) {
    rerouteGroup.style.display = 'block';
  } else {
    busyGroup.style.display = 'block';
  }

  // Populate Street Congestion Simulator list
  renderCongestionList();
}

// Render the list of streets and their toggle switches in the Inspector
function renderCongestionList() {
  const container = document.getElementById('congestion-list-container');
  container.innerHTML = '';

  if (!graph) return;

  // Let's sort edges by street name to display nicely
  const sortedEdges = [...graph.edges].sort((a, b) => a.street.localeCompare(b.street));

  sortedEdges.forEach(edge => {
    const isJammed = edge.traffic >= 6.0;
    
    // Status text
    let trafficClass = 'green';
    let statusText = 'Low Congestion';
    if (edge.traffic >= 4.0) {
      trafficClass = 'red';
      statusText = 'Heavy Traffic';
    } else if (edge.traffic >= 1.5) {
      trafficClass = 'yellow';
      statusText = 'Moderate Traffic';
    }

    const item = document.createElement('div');
    item.className = 'jam-item';
    item.innerHTML = `
      <div class="jam-info">
        <span class="jam-street-name">${edge.street}</span>
        <span class="jam-status-lbl">
          <span class="traffic-dot ${trafficClass}"></span>
          ${statusText} (${edge.traffic.toFixed(1)}x)
        </span>
      </div>
      <label class="switch">
        <input type="checkbox" id="toggle-${edge.id}" ${isJammed ? 'checked' : ''} onchange="toggleTraffic('${edge.id}', this.checked)">
        <span class="slider"></span>
      </label>
    `;
    container.appendChild(item);
  });
}

// Action Dispatcher triggers
function triggerDispatch() {
  const select = document.getElementById('incident-select');
  const incidentId = select.value;
  
  if (!incidentId || !selectedUnitId) return;

  socket.emit('dispatch_unit', {
    unitId: selectedUnitId,
    incidentId: incidentId
  });
}

function triggerReroute() {
  const select = document.getElementById('hospital-select');
  const hospitalId = select.value;

  if (!hospitalId || !selectedUnitId) return;

  socket.emit('reroute_unit', {
    unitId: selectedUnitId,
    hospitalId: hospitalId
  });
}

function toggleTraffic(edgeId, isBlocked) {
  socket.emit('toggle_traffic', {
    edgeId: edgeId,
    isBlocked: isBlocked
  });
}

// Render Bottom Hospital Cards
function renderHospitalsPanel() {
  const container = document.getElementById('facilities-container-row');
  container.innerHTML = '';

  Object.keys(hospitals).forEach(id => {
    const hosp = hospitals[id];
    
    // Status dot color
    const dotClass = hosp.erStatus.toLowerCase(); // normal, busy, critical
    
    // Calculate percentage
    const fillPercent = Math.round((hosp.beds / hosp.maxBeds) * 100);

    const card = document.createElement('div');
    card.className = 'facility-card';
    card.innerHTML = `
      <div class="facility-card-header">
        <span class="facility-name" title="${hosp.name}">${hosp.name}</span>
        <span class="facility-status-dot ${dotClass}"></span>
      </div>
      <div class="facility-details-row">
        <div class="facility-detail-col">
          <span class="facility-detail-lbl">ER status</span>
          <span class="facility-detail-val ${dotClass}-text">${hosp.erStatus}</span>
        </div>
        <div class="facility-detail-col">
          <span class="facility-detail-lbl">Beds Available</span>
          <span class="facility-detail-val">${hosp.beds}/${hosp.maxBeds} (${fillPercent}%)</span>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// Append live log notification
function renderNotificationsFeed(feed) {
  const container = document.getElementById('notifications-list-container');
  container.innerHTML = '';

  feed.forEach(note => {
    const item = document.createElement('div');
    item.className = 'notification-item';
    
    let textClass = '';
    if (note.type === 'critical') textClass = 'critical';
    else if (note.type === 'success') textClass = 'success';
    else if (note.type === 'dispatch') textClass = 'dispatch';
    else if (note.type === 'warning') textClass = 'warning';

    item.innerHTML = `
      <span class="notification-time">${note.time.split(' ')[0]}</span>
      <span class="notification-text ${textClass}">${note.text}</span>
    `;
    container.appendChild(item);
  });
}

// WebSocket Listeners
socket.on('init_data', (data) => {
  console.log("WebSocket Connection Established. Initializing data...");
  
  ambulances = data.ambulances;
  incidents = data.incidents;
  hospitals = data.hospitals;

  // Initialize Map
  initMap(data.graph);

  // Update panels
  renderFleetList();
  renderHospitalsPanel();
  renderNotificationsFeed(data.notifications);
  updateIncidentMarkers(incidents);
  updateAmbulanceMarkers(ambulances);
  updateHeaderStats();
});

socket.on('fleet_update', (data) => {
  ambulances = data.ambulances;
  incidents = data.incidents;
  hospitals = data.hospitals;

  renderFleetList();
  renderHospitalsPanel();
  updateIncidentMarkers(incidents);
  updateAmbulanceMarkers(ambulances);
  updateSelectedUnitRoutes();
  updateInspectorPanel();
  updateHeaderStats();
});

socket.on('traffic_update', (edges) => {
  if (graph) {
    graph.edges = edges;
    updateSelectedUnitRoutes();
    renderCongestionList();
  }
});

socket.on('notification', (note) => {
  const container = document.getElementById('notifications-list-container');
  const item = document.createElement('div');
  item.className = 'notification-item';
  
  let textClass = '';
  if (note.type === 'critical') textClass = 'critical';
  else if (note.type === 'success') textClass = 'success';
  else if (note.type === 'dispatch') textClass = 'dispatch';
  else if (note.type === 'warning') textClass = 'warning';

  item.innerHTML = `
    <span class="notification-time">${note.time.split(' ')[0]}</span>
    <span class="notification-text ${textClass}">${note.text}</span>
  `;
  container.insertBefore(item, container.firstChild);
  
  // Cap list size
  if (container.children.length > 50) {
    container.removeChild(container.lastChild);
  }
});

socket.on('error_message', (data) => {
  alert(`COMMAND ERROR: ${data.message}`);
});

// Update Header Counters
function updateHeaderStats() {
  const activeCount = incidents.length;
  const criticalCount = incidents.filter(inc => inc.severity === 'CRITICAL').length;
  
  document.getElementById('active-incidents-count').innerText = activeCount;
  document.getElementById('critical-incidents-count').innerText = criticalCount;
}
