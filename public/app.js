// VitaRoute Command Center — Client Logic
let socket;
if (typeof io !== 'undefined') {
  socket = io();
} else {
  console.log("Socket.io library not loaded. Running in local fallback mode.");
  socket = { on: function(){}, emit: function(){} };
}

// ─── Application State ────────────────────────────────────────────────────────
let graph = null;
let ambulances = {};
let incidents = [];
let hospitals = {};
let mapInitialized = false;
let pendingInitData = null;

// Fallback for Vercel static deployments
setTimeout(() => {
  if (!graph && !pendingInitData) {
    console.log("WebSocket connection failed. Falling back to Live Interactive Map Demo mode.");
    
    // Create custom SVG icons
    const ambIcon = L.divIcon({
      className: 'demo-amb-marker',
      html: '<div style="background:#3b82f6;border-radius:50%;color:#fff;display:flex;justify-content:center;align-items:center;box-shadow:0 0 10px #3b82f6, 0 0 20px #3b82f6;width:28px;height:28px;">A</div>',
      iconSize: [28, 28], iconAnchor: [14, 14]
    });
    const emgIcon = L.divIcon({
      className: 'demo-emg-marker',
      html: '<div style="background:#ef4444;border-radius:50%;border:2px solid #fff;box-shadow:0 0 15px #ef4444;width:14px;height:14px;animation:pulse 1.5s infinite;"></div>',
      iconSize: [14, 14], iconAnchor: [7, 7]
    });

    const mockData = {
      graph: { nodes: { M1: { lat: 28.6139, lng: 77.2090 } }, edges: [] },
      ambulances: {
        "RESCUE-101": { id: "RESCUE-101", lat: 28.6315, lng: 77.2167, status: "IDLE" },
        "RESCUE-102": { id: "RESCUE-102", lat: 28.5660, lng: 77.2066, status: "IDLE" },
        "RESCUE-103": { id: "RESCUE-103", lat: 28.5246, lng: 77.2066, status: "IDLE" }
      },
      incidents: [], hospitals: {}, notifications: []
    };

    ambulances = mockData.ambulances;
    incidents = mockData.incidents;
    hospitals = mockData.hospitals;

    const dashboardView = document.getElementById('dashboard-view');
    if (dashboardView && dashboardView.style.display !== 'none') {
      graph = mockData.graph;
      initMap(mockData.graph);
      renderAll();
      mapInitialized = true;
      setupInteractiveDemo(map, ambIcon, emgIcon);
    } else {
      pendingInitData = mockData;
      // We also need to setup the interactive demo when the map finally initializes
      const originalReinit = window.reinitMap;
      window.reinitMap = function() {
        if (originalReinit) originalReinit();
        setupInteractiveDemo(map, ambIcon, emgIcon);
      };
    }
  }
}, 2000);

function setupInteractiveDemo(demoMap, ambIcon, emgIcon) {
  if (!demoMap) return;
  console.log("Setting up Live Interactive Routing Demo...");
  
  // Clear the static render logic for these mock ambulances and replace with our interactive ones
  Object.keys(ambulances).forEach(id => {
    ambulances[id].marker = L.marker([ambulances[id].lat, ambulances[id].lng], {icon: ambIcon}).addTo(demoMap);
  });

  let currentEmgMarker = null;
  let currentRouteLine = null;
  let isDispatching = false;

  demoMap.on('click', function(e) {
    if (isDispatching) return;
    const dest = [e.latlng.lat, e.latlng.lng];
    if (currentEmgMarker) demoMap.removeLayer(currentEmgMarker);
    if (currentRouteLine) demoMap.removeLayer(currentRouteLine);

    currentEmgMarker = L.marker(dest, {icon: emgIcon}).addTo(demoMap);
    
    // Display an alert instead of HUD
    const alertList = document.getElementById('vr-alerts-list');
    if (alertList) {
      alertList.innerHTML = `<div class="vr-alert-item"><div class="vr-alert-icon">⚠</div><div><div class="vr-alert-text">Incident Reported!</div><div class="vr-alert-loc">Finding nearest unit...</div></div></div>` + alertList.innerHTML;
    }

    setTimeout(function() {
      let nearest = null, minDist = Infinity;
      Object.values(ambulances).forEach(a => {
        const d = demoMap.distance([a.lat, a.lng], dest);
        if (d < minDist) { minDist = d; nearest = a; }
      });

      const routeCoords = [ [nearest.lat, nearest.lng], [nearest.lat + (dest[0]-nearest.lat)*0.5, nearest.lng], dest ];
      currentRouteLine = L.polyline(routeCoords, { color: '#10b981', weight: 4, opacity: 0.8, dashArray: '10, 10' }).addTo(demoMap);
      
      const distKm = (minDist / 1000).toFixed(1);
      if (alertList) {
        alertList.innerHTML = `<div class="vr-alert-item"><div class="vr-alert-icon">🚑</div><div><div class="vr-alert-text">Dispatching ${nearest.id}</div><div class="vr-alert-loc">Distance: ${distKm} km</div></div></div>` + alertList.innerHTML;
      }

      isDispatching = true;
      let step = 0, totalSteps = 60;
      const interval = setInterval(function() {
        step++;
        const progress = step / totalSteps;
        let currentLat, currentLng;
        if (progress < 0.5) {
          const p2 = progress * 2;
          currentLat = routeCoords[0][0] + (routeCoords[1][0] - routeCoords[0][0]) * p2;
          currentLng = routeCoords[0][1] + (routeCoords[1][1] - routeCoords[0][1]) * p2;
        } else {
          const p2 = (progress - 0.5) * 2;
          currentLat = routeCoords[1][0] + (routeCoords[2][0] - routeCoords[1][0]) * p2;
          currentLng = routeCoords[1][1] + (routeCoords[2][1] - routeCoords[1][1]) * p2;
        }

        nearest.marker.setLatLng([currentLat, currentLng]);
        nearest.lat = currentLat;
        nearest.lng = currentLng;

        if (step >= totalSteps) {
          clearInterval(interval);
          isDispatching = false;
          if (currentEmgMarker) demoMap.removeLayer(currentEmgMarker);
          if (currentRouteLine) demoMap.removeLayer(currentRouteLine);
          currentEmgMarker = null;
          currentRouteLine = null;
        }
      }, 50);
    }, 600);
  });
}

// ─── Haversine Distance ───────────────────────────────────────────────────────
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// ─── Dijkstra ─────────────────────────────────────────────────────────────────
class PriorityQueue {
  constructor() { this.q = []; }
  enqueue(el, p) { this.q.push({el,p}); this.q.sort((a,b)=>a.p-b.p); }
  dequeue() { return this.q.shift(); }
  isEmpty() { return this.q.length === 0; }
}

function dijkstra(start, end, useTraffic) {
  if (!graph) return [];
  const dist = {}, prev = {}, q = new PriorityQueue();
  for (let n in graph.nodes) { dist[n] = Infinity; prev[n] = null; }
  dist[start] = 0; q.enqueue(start, 0);
  if (!graph.adjacencyList) {
    graph.adjacencyList = {};
    for (let n in graph.nodes) graph.adjacencyList[n] = [];
    graph.edges.forEach(e => { graph.adjacencyList[e.from].push(e.to); graph.adjacencyList[e.to].push(e.from); });
  }
  while (!q.isEmpty()) {
    const {el: cur} = q.dequeue();
    if (cur === end) break;
    if (dist[cur] === Infinity) continue;
    (graph.adjacencyList[cur]||[]).forEach(nb => {
      const edge = graph.edges.find(e=>(e.from===cur&&e.to===nb)||(e.to===cur&&e.from===nb));
      if (!edge) return;
      const d = haversineDistance(graph.nodes[cur].lat,graph.nodes[cur].lng,graph.nodes[nb].lat,graph.nodes[nb].lng);
      const w = d * (useTraffic ? edge.traffic : 1.0);
      if (dist[cur]+w < dist[nb]) { dist[nb]=dist[cur]+w; prev[nb]=cur; q.enqueue(nb,dist[nb]); }
    });
  }
  const path = []; let c = end;
  while (c !== null) { path.unshift(c); c = prev[c]; }
  return path.length > 1 && path[0] === start ? path : [];
}

// ─── Map Rendering ────────────────────────────────────────────────────────────
function renderMapMarkers() {
  if (!map || !graph) return;
  routePolylines.forEach(l => l.remove());
  routePolylines = [];

  // Hospital markers
  for (let id in graph.nodes) {
    const node = graph.nodes[id];
    if (node.isHospital) {
      const icon = L.divIcon({
        className: 'leaflet-div-icon',
        html: '<div class="vr-hosp-marker">H</div>',
        iconSize: [26,26], iconAnchor: [13,13]
      });
      L.marker([node.lat, node.lng], {icon}).addTo(map);
    }
  }

  // Incident markers
  incidents.forEach(inc => {
    const icon = L.divIcon({
      className: 'leaflet-div-icon',
      html: '<div class="vr-inc-marker"></div>',
      iconSize: [14,14], iconAnchor: [7,7]
    });
    L.marker([inc.lat, inc.lng], {icon}).addTo(map);
  });

  // Ambulance markers + traffic heatmap lines
  Object.keys(ambulances).forEach(id => {
    const u = ambulances[id];
    const isActive = ['EN ROUTE','DISPATCHED'].includes(u.status);
    const cls = isActive ? 'active' : '';
    const label = id.split('-')[1];
    const icon = L.divIcon({
      className: 'leaflet-div-icon',
      html: `<div class="vr-amb-marker ${cls}">${label}</div>`,
      iconSize: [28,28], iconAnchor: [14,14]
    });
    L.marker([u.lat, u.lng], {icon}).addTo(map);
  });

  // Traffic heatmap polylines
  graph.edges.forEach(edge => {
    const fromN = graph.nodes[edge.from];
    const toN = graph.nodes[edge.to];
    if (!fromN || !toN) return;
    let color = '#10b981';
    if (edge.traffic >= 3.0) color = '#ef4444';
    else if (edge.traffic >= 1.8) color = '#f59e0b';
    const line = L.polyline([[fromN.lat,fromN.lng],[toN.lat,toN.lng]], {
      color, weight: 4, opacity: 0.7, lineCap: 'round'
    }).addTo(map);
    routePolylines.push(line);
  });
}

// ─── Render All Dashboard Components ──────────────────────────────────────────
function renderAll() {
  renderMetrics();
  renderMissions();
  renderHospitalsPanel();
  renderReadinessGauge();
  renderAlerts();
  renderVehicleStatus();
  renderMapMarkers();
  updateClock();
}

// ─── Metric Cards ─────────────────────────────────────────────────────────────
function renderMetrics() {
  const totalOnline = Object.keys(ambulances).length;
  const activeCalls = incidents.filter(i => i.status !== 'RESOLVED').length;
  const critical = incidents.filter(i => i.severity === 'CRITICAL').length;
  const completed = 24 + Math.floor(Math.random() * 3); // mock
  const avgResp = (5.5 + Math.random() * 2).toFixed(1);

  const el = id => document.getElementById(id);
  if (el('m-ambulances')) el('m-ambulances').textContent = totalOnline;
  if (el('m-resptime')) el('m-resptime').textContent = avgResp + ' min';
  if (el('m-activecalls')) el('m-activecalls').textContent = activeCalls;
  if (el('m-completed')) el('m-completed').textContent = completed;
  if (el('m-critical')) el('m-critical').textContent = critical;
}

// ─── Active Missions List ─────────────────────────────────────────────────────
function renderMissions() {
  const container = document.getElementById('vr-missions-list');
  if (!container) return;
  container.innerHTML = '';

  const activeUnits = Object.entries(ambulances).filter(([id,u]) =>
    ['EN ROUTE','DISPATCHED'].includes(u.status)
  );

  const mockMissions = [
    { id: 'Mission #1024', task: 'Patient Pickup → City General Hospital', eta: 8, etaColor: 'vr-eta-green' },
    { id: 'Mission #1025', task: 'Emergency Transfer → Metro Trauma Center', eta: 12, etaColor: 'vr-eta-yellow' },
    { id: 'Mission #1026', task: 'Critical Care → Downtown Medical Center', eta: 14, etaColor: 'vr-eta-yellow' },
    { id: 'Mission #1027', task: 'Ambulance Dispatch → Highway 101 North', eta: 18, etaColor: 'vr-eta-red' },
  ];

  // Use real missions if available, otherwise mock
  const missions = activeUnits.length > 0
    ? activeUnits.map(([id,u],i) => ({
        id: `Mission #${1024+i}`,
        task: u.destination ? `${u.status} → ${u.destination}` : u.status,
        eta: 6 + Math.floor(Math.random()*14),
        etaColor: (6+Math.floor(Math.random()*14)) < 10 ? 'vr-eta-green' : (Math.random()>0.5 ? 'vr-eta-yellow' : 'vr-eta-red')
      }))
    : mockMissions;

  missions.forEach(m => {
    const item = document.createElement('div');
    item.className = 'vr-mission-item';
    item.innerHTML = `
      <div class="vr-mission-row1">
        <div class="vr-mission-icon">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a5b4fc" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.4c-.6-.6-1.4-1-2.2-1H5c-1.1 0-2 .9-2 2v8c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <span class="vr-mission-id">${m.id}</span>
      </div>
      <div class="vr-mission-task">${m.task}</div>
      <div class="vr-mission-eta ${m.etaColor}">ETA: ${m.eta} min</div>
    `;
    container.appendChild(item);
  });
}

// ─── Hospital Readiness Panel ─────────────────────────────────────────────────
function renderHospitalsPanel() {
  const container = document.getElementById('vr-hospitals-list');
  if (!container) return;
  container.innerHTML = '';

  const hospData = Object.values(hospitals).map(h => ({
    name: h.name,
    pct: Math.round((h.beds / h.maxBeds) * 100),
    status: h.erStatus.toLowerCase()
  }));

  const fallback = [
    { name: 'City General Hospital', pct: 85, status: 'normal' },
    { name: 'Metro Trauma Center', pct: 62, status: 'busy' },
    { name: 'Downtown Medical Center', pct: 40, status: 'critical' },
    { name: 'Westside Health Center', pct: 75, status: 'normal' },
  ];

  const data = hospData.length > 0 ? hospData : fallback;

  data.forEach(h => {
    let barColor = '#10b981';
    if (h.pct > 70) barColor = '#10b981';
    else if (h.pct > 45) barColor = '#f59e0b';
    else barColor = '#ef4444';

    const item = document.createElement('div');
    item.className = 'vr-hosp-item';
    item.innerHTML = `
      <div class="vr-hosp-row">
        <span class="vr-hosp-name">${h.name}</span>
        <span class="vr-hosp-pct" style="color:${barColor}">${h.pct}%</span>
      </div>
      <div class="vr-hosp-bar"><div class="vr-hosp-bar-fill" style="width:${h.pct}%;background:${barColor}"></div></div>
    `;
    container.appendChild(item);
  });
}

// ─── Readiness Gauge ──────────────────────────────────────────────────────────
function renderReadinessGauge() {
  const svg = document.getElementById('vr-readiness-gauge');
  if (!svg) return;
  const total = Object.keys(ambulances).length || 14;
  const available = Object.values(ambulances).filter(u=>u.status==='IDLE').length || 4;
  const onDuty = Object.values(ambulances).filter(u=>['EN ROUTE','DISPATCHED'].includes(u.status)).length || 7;
  const busy = Object.values(ambulances).filter(u=>u.status==='AT SCENE').length || 3;
  const pct = Math.round(((available + onDuty) / Math.max(total,1)) * 100) || 65;

  const r = 48, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const greenArc = circumference * (available / Math.max(total,1));
  const yellowArc = circumference * (onDuty / Math.max(total,1));
  const redArc = circumference * (busy / Math.max(total,1));

  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="rgba(255,255,255,0.06)" stroke-width="10" fill="none"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#10b981" stroke-dasharray="${greenArc} ${circumference}" stroke-dashoffset="0" stroke-width="10" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#f59e0b" stroke-dasharray="${yellowArc} ${circumference}" stroke-dashoffset="${-greenArc}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#ef4444" stroke-dasharray="${redArc} ${circumference}" stroke-dashoffset="${-(greenArc+yellowArc)}" stroke-width="10" stroke-linecap="round"/>
  `;

  const el = id => document.getElementById(id);
  if (el('vr-readiness-pct')) el('vr-readiness-pct').textContent = pct + '%';
  if (el('rs-available')) el('rs-available').textContent = available;
  if (el('rs-onduty')) el('rs-onduty').textContent = onDuty;
  if (el('rs-busy')) el('rs-busy').textContent = busy;
}

// ─── Live Alerts ──────────────────────────────────────────────────────────────
function renderAlerts() {
  const container = document.getElementById('vr-alerts-list');
  if (!container) return;

  const alerts = [
    { text: 'High Traffic Congestion', loc: 'Main St. & 3rd Ave', time: '2 min ago', icon: '⚠' },
    { text: 'Accident Reported', loc: 'Highway 101 North', time: '5 min ago', icon: '⚠' },
  ];

  container.innerHTML = alerts.map(a => `
    <div class="vr-alert-item">
      <div class="vr-alert-icon">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <div>
        <div class="vr-alert-text">${a.text}</div>
        <div class="vr-alert-loc">📍 ${a.loc}</div>
        <div class="vr-alert-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

// ─── Vehicle Status Donut ─────────────────────────────────────────────────────
function renderVehicleStatus() {
  const svg = document.getElementById('vr-vehicle-gauge');
  if (!svg) return;
  const total = Object.keys(ambulances).length || 14;
  const onMission = Object.values(ambulances).filter(u=>['EN ROUTE','DISPATCHED'].includes(u.status)).length || 7;
  const available = Object.values(ambulances).filter(u=>u.status==='IDLE').length || 4;
  const maint = 2, offline = 1;

  const r = 48, cx = 60, cy = 60;
  const circumference = 2 * Math.PI * r;
  const greenArc = circumference * (onMission / Math.max(total,1));
  const yellowArc = circumference * (available / Math.max(total,1));
  const redArc = circumference * (maint / Math.max(total,1));
  const grayArc = circumference * (offline / Math.max(total,1));

  svg.innerHTML = `
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="rgba(255,255,255,0.06)" stroke-width="10" fill="none"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#10b981" stroke-dasharray="${greenArc} ${circumference}" stroke-dashoffset="0" stroke-width="10" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#f59e0b" stroke-dasharray="${yellowArc} ${circumference}" stroke-dashoffset="${-greenArc}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#ef4444" stroke-dasharray="${redArc} ${circumference}" stroke-dashoffset="${-(greenArc+yellowArc)}" stroke-width="10" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" stroke="#6b7280" stroke-dasharray="${grayArc} ${circumference}" stroke-dashoffset="${-(greenArc+yellowArc+redArc)}" stroke-width="10" stroke-linecap="round"/>
  `;

  const el = id => document.getElementById(id);
  if (el('vr-vehicle-total')) el('vr-vehicle-total').textContent = total;
  if (el('vl-mission')) el('vl-mission').textContent = onMission;
  if (el('vl-available')) el('vl-available').textContent = available;
  if (el('vl-maint')) el('vl-maint').textContent = maint;
  if (el('vl-offline')) el('vl-offline').textContent = offline;
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById('vr-clock');
  const dateEl = document.getElementById('vr-date');
  if (clockEl) clockEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  if (dateEl) dateEl.textContent = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
setInterval(updateClock, 30000);

// ─── WebSocket Listeners ──────────────────────────────────────────────────────
socket.on('init_data', (data) => {
  console.log('WebSocket connected. Data received.');
  ambulances = data.ambulances;
  incidents = data.incidents;
  hospitals = data.hospitals;

  const dashboardView = document.getElementById('dashboard-view');
  const isVisible = dashboardView && dashboardView.style.display !== 'none';

  if (isVisible) {
    graph = data.graph;
    initMap(data.graph);
    renderAll();
    mapInitialized = true;
  } else {
    pendingInitData = data;
  }
});

socket.on('fleet_update', (data) => {
  ambulances = data.ambulances;
  incidents = data.incidents;
  hospitals = data.hospitals;
  if (mapInitialized) {
    renderMetrics();
    renderMissions();
    renderHospitalsPanel();
    renderReadinessGauge();
    renderVehicleStatus();
    renderMapMarkers();
  }
});

socket.on('traffic_update', (edges) => {
  if (graph && mapInitialized) {
    graph.edges = edges;
    // Update heatmap colors
    routePolylines.forEach(l => l.remove());
    routePolylines = [];
    graph.edges.forEach(edge => {
      const fromN = graph.nodes[edge.from];
      const toN = graph.nodes[edge.to];
      if (!fromN || !toN) return;
      let color = '#10b981';
      if (edge.traffic >= 3.0) color = '#ef4444';
      else if (edge.traffic >= 1.8) color = '#f59e0b';
      const line = L.polyline([[fromN.lat,fromN.lng],[toN.lat,toN.lng]], {
        color, weight: 4, opacity: 0.7, lineCap: 'round'
      }).addTo(map);
      routePolylines.push(line);
    });
  }
});

socket.on('notification', (note) => {
  // Optionally push to alerts panel
  const container = document.getElementById('vr-alerts-list');
  if (!container) return;
  const item = document.createElement('div');
  item.className = 'vr-alert-item';
  item.innerHTML = `
    <div class="vr-alert-icon">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${note.type==='critical'?'#ef4444':'#f59e0b'}" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    </div>
    <div>
      <div class="vr-alert-text">${note.text}</div>
      <div class="vr-alert-time">${note.time}</div>
    </div>
  `;
  container.insertBefore(item, container.firstChild);
  if (container.children.length > 10) container.removeChild(container.lastChild);
});

socket.on('error_message', (data) => {
  if (data.requiresLogin && typeof showLoginModal === 'function') {
    showLoginModal();
  } else {
    alert("Error: " + data.message);
  }
});
