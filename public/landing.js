// VitaRoute 3D Landing Page — Organic Feather Particles with Parallax Depth
// + Partners Page 3D Scene
(function () {
  'use strict';

  // ─── LANDING PAGE 3D SCENE ────────────────────────────────────────────────
  var canvas = document.getElementById('three-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // ─── Renderer ────────────────────────────────────────────────────────────
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // ─── Scene ───────────────────────────────────────────────────────────────
  var scene = new THREE.Scene();

  // Gradient background (peach → pink → rose)
  var bgCanvas = document.createElement('canvas');
  bgCanvas.width = 4;
  bgCanvas.height = 512;
  var bgCtx = bgCanvas.getContext('2d');
  var grad = bgCtx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#ffe0d0');
  grad.addColorStop(0.3, '#ffc8b8');
  grad.addColorStop(0.6, '#f4a09a');
  grad.addColorStop(1.0, '#e07070');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, 4, 512);
  scene.background = new THREE.CanvasTexture(bgCanvas);

  // Depth fog
  scene.fog = new THREE.FogExp2(0xf0b8a8, 0.028);

  // ─── Camera ──────────────────────────────────────────────────────────────
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 18);

  // ─── Lighting ────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffd8cc, 0.5));

  var dirLight = new THREE.DirectionalLight(0xffffff, 1.1);
  dirLight.position.set(6, 10, 12);
  scene.add(dirLight);

  var warmLight = new THREE.PointLight(0xff5544, 2.2, 35);
  warmLight.position.set(-5, 3, 8);
  scene.add(warmLight);

  var coolLight = new THREE.PointLight(0xffaa88, 1.4, 28);
  coolLight.position.set(5, -2, 5);
  scene.add(coolLight);

  var backLight = new THREE.PointLight(0xcc2244, 1.8, 30);
  backLight.position.set(0, 5, -10);
  scene.add(backLight);

  // ─── Feather geometry helper ─────────────────────────────────────────────
  function makeFeatherGeo() {
    var w = 0.14 + Math.random() * 0.1;
    var h = 1.2 + Math.random() * 2.0;
    return new THREE.PlaneGeometry(w, h, 1, 6);
  }

  // ─── Color palette (reds → pinks → crimsons) ─────────────────────────────
  var palette = [
    0xbb1122, 0xcc2233, 0xdd3344, 0xaa1828,
    0xcc1133, 0xe04050, 0x991122, 0xdd2244,
    0xc82838, 0xb02030, 0xe85060, 0xd04858
  ];

  function pickColor() {
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // ─── Create feather layers (parallax depth groups) ──────────────────────
  var layers = [];

  var layerConfigs = [
    { count: 50,  zMin: -6,  zMax:  0,  spread: 24, scaleMin: 0.6, scaleMax: 1.5, opacity: 0.9,  fogDensity: 0.028 },
    { count: 60,  zMin: -16, zMax: -6,  spread: 34, scaleMin: 0.4, scaleMax: 1.1, opacity: 0.65, fogDensity: 0.032 },
    { count: 50,  zMin: -30, zMax: -16, spread: 44, scaleMin: 0.3, scaleMax: 0.8, opacity: 0.35, fogDensity: 0.04  }
  ];

  var dummy = new THREE.Object3D();

  layerConfigs.forEach(function (cfg) {
    var geo = makeFeatherGeo();
    var mat = new THREE.MeshStandardMaterial({
      color: pickColor(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: cfg.opacity,
      roughness: 0.55,
      metalness: 0.08,
      emissive: new THREE.Color(0x220000),
      emissiveIntensity: 0.15
    });

    var mesh = new THREE.InstancedMesh(geo, mat, cfg.count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    var items = [];
    for (var i = 0; i < cfg.count; i++) {
      var x = (Math.random() - 0.5) * cfg.spread;
      var y = (Math.random() - 0.5) * cfg.spread * 0.65;
      var z = cfg.zMin + Math.random() * (cfg.zMax - cfg.zMin);
      var rx = Math.random() * Math.PI;
      var ry = Math.random() * Math.PI;
      var rz = Math.random() * Math.PI;
      var s  = cfg.scaleMin + Math.random() * (cfg.scaleMax - cfg.scaleMin);

      items.push({
        x: x, y: y, z: z,
        rx: rx, ry: ry, rz: rz,
        s: s,
        rotSpeed:  (Math.random() - 0.5) * 0.12,
        floatPhase: Math.random() * Math.PI * 2,
        floatAmp:   0.08 + Math.random() * 0.18
      });

      // Set initial matrix
      dummy.position.set(x, y, z);
      dummy.rotation.set(rx, ry, rz);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    layers.push({ mesh: mesh, items: items, cfg: cfg });
  });

  // ─── Mouse tracking ─────────────────────────────────────────────────────
  var mouseX = 0, mouseY = 0;
  var targetCamX = 0, targetCamY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ─── Resize handler ─────────────────────────────────────────────────────
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // ─── Animation loop ─────────────────────────────────────────────────────
  var animId = null;
  var startTime = performance.now();

  function animate() {
    var t = (performance.now() - startTime) * 0.001; // seconds

    // Camera parallax (smooth lerp)
    targetCamX = mouseX * 1.8;
    targetCamY = -mouseY * 1.2;
    camera.position.x += (targetCamX - camera.position.x) * 0.04;
    camera.position.y += (targetCamY - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -5);

    // Subtle light movement
    warmLight.position.x = -5 + Math.sin(t * 0.3) * 2;
    warmLight.position.y =  3 + Math.cos(t * 0.2) * 1.5;
    coolLight.position.x =  5 + Math.cos(t * 0.25) * 2;

    // Update each layer
    var parallaxFactors = [0.35, 0.18, 0.07];

    for (var li = 0; li < layers.length; li++) {
      var layer = layers[li];
      var pf = parallaxFactors[li] || 0.1;
      var mesh = layer.mesh;
      var items = layer.items;

      // Layer-level parallax offset
      mesh.position.x = mouseX * pf * 3;
      mesh.position.y = -mouseY * pf * 2;

      for (var i = 0; i < items.length; i++) {
        var it = items[i];

        dummy.position.set(
          it.x,
          it.y + Math.sin(t * 0.4 + it.floatPhase) * it.floatAmp,
          it.z
        );
        dummy.rotation.set(
          it.rx + t * it.rotSpeed * 0.6,
          it.ry + t * it.rotSpeed * 0.4,
          it.rz + t * it.rotSpeed * 0.3
        );
        dummy.scale.setScalar(it.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }

      mesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }

  animate();

  // ─── Cleanup (called when leaving landing page) ─────────────────────────
  window._stopLandingScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── PARTNERS PAGE 3D SCENE ────────────────────────────────────────────────
(function () {
  'use strict';

  var canvas = document.getElementById('partners-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // ─── Renderer ────────────────────────────────────────────────────────────
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // ─── Scene ───────────────────────────────────────────────────────────────
  var scene = new THREE.Scene();

  // Warm gradient background (red-orange tones)
  var bgCanvas = document.createElement('canvas');
  bgCanvas.width = 4;
  bgCanvas.height = 512;
  var bgCtx = bgCanvas.getContext('2d');
  var grad = bgCanvas.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#e86040');
  grad.addColorStop(0.3, '#d85038');
  grad.addColorStop(0.6, '#c84030');
  grad.addColorStop(1.0, '#a82820');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, 4, 512);
  scene.background = new THREE.CanvasTexture(bgCanvas);

  // Depth fog
  scene.fog = new THREE.FogExp2(0xc84838, 0.025);

  // ─── Camera ──────────────────────────────────────────────────────────────
  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 18);

  // ─── Lighting ────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0xffccaa, 0.5));

  var dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(6, 10, 12);
  scene.add(dirLight);

  var warmLight = new THREE.PointLight(0xff6644, 2.5, 35);
  warmLight.position.set(-5, 3, 8);
  scene.add(warmLight);

  var coolLight = new THREE.PointLight(0xffaa66, 1.6, 28);
  coolLight.position.set(5, -2, 5);
  scene.add(coolLight);

  var backLight = new THREE.PointLight(0xdd3322, 2.0, 30);
  backLight.position.set(0, 5, -10);
  scene.add(backLight);

  // ─── Feather geometry helper ─────────────────────────────────────────────
  function makeFeatherGeo() {
    var w = 0.16 + Math.random() * 0.12;
    var h = 1.4 + Math.random() * 2.2;
    return new THREE.PlaneGeometry(w, h, 1, 6);
  }

  // ─── Color palette (deep reds → oranges) ─────────────────────────────────
  var palette = [
    0xcc2211, 0xdd3322, 0xee4433, 0xbb1818,
    0xdd2211, 0xf05040, 0xaa2010, 0xee3322,
    0xd83020, 0xc02818, 0xf06050, 0xe05040
  ];

  function pickColor() {
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // ─── Create feather layers ────────────────────────────────────────────────
  var layers = [];
  var dummy = new THREE.Object3D();

  var layerConfigs = [
    { count: 45, zMin: -6, zMax: 0, spread: 26, scaleMin: 0.7, scaleMax: 1.6, opacity: 0.85 },
    { count: 55, zMin: -18, zMax: -6, spread: 36, scaleMin: 0.5, scaleMax: 1.2, opacity: 0.6 },
    { count: 45, zMin: -32, zMax: -18, spread: 46, scaleMin: 0.35, scaleMax: 0.9, opacity: 0.3 }
  ];

  layerConfigs.forEach(function (cfg) {
    var geo = makeFeatherGeo();
    var mat = new THREE.MeshStandardMaterial({
      color: pickColor(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: cfg.opacity,
      roughness: 0.5,
      metalness: 0.1,
      emissive: new THREE.Color(0x330000),
      emissiveIntensity: 0.2
    });

    var mesh = new THREE.InstancedMesh(geo, mat, cfg.count);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    var items = [];
    for (var i = 0; i < cfg.count; i++) {
      var x = (Math.random() - 0.5) * cfg.spread;
      var y = (Math.random() - 0.5) * cfg.spread * 0.6;
      var z = cfg.zMin + Math.random() * (cfg.zMax - cfg.zMin);
      var rx = Math.random() * Math.PI;
      var ry = Math.random() * Math.PI;
      var rz = Math.random() * Math.PI;
      var s = cfg.scaleMin + Math.random() * (cfg.scaleMax - cfg.scaleMin);

      items.push({
        x: x, y: y, z: z,
        rx: rx, ry: ry, rz: rz,
        s: s,
        rotSpeed: (Math.random() - 0.5) * 0.1,
        floatPhase: Math.random() * Math.PI * 2,
        floatAmp: 0.1 + Math.random() * 0.2
      });

      dummy.position.set(x, y, z);
      dummy.rotation.set(rx, ry, rz);
      dummy.scale.setScalar(s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    scene.add(mesh);
    layers.push({ mesh: mesh, items: items, cfg: cfg });
  });

  // ─── Mouse tracking ──────────────────────────────────────────────────────
  var mouseX = 0, mouseY = 0;
  var targetCamX = 0, targetCamY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ─── Resize handler ──────────────────────────────────────────────────────
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // ─── Animation loop ──────────────────────────────────────────────────────
  var animId = null;
  var startTime = performance.now();

  function animate() {
    var t = (performance.now() - startTime) * 0.001;

    targetCamX = mouseX * 1.5;
    targetCamY = -mouseY * 1.0;
    camera.position.x += (targetCamX - camera.position.x) * 0.04;
    camera.position.y += (targetCamY - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -5);

    warmLight.position.x = -5 + Math.sin(t * 0.3) * 2;
    warmLight.position.y = 3 + Math.cos(t * 0.2) * 1.5;
    coolLight.position.x = 5 + Math.cos(t * 0.25) * 2;

    var parallaxFactors = [0.3, 0.15, 0.06];

    for (var li = 0; li < layers.length; li++) {
      var layer = layers[li];
      var pf = parallaxFactors[li] || 0.1;
      var mesh = layer.mesh;
      var items = layer.items;

      mesh.position.x = mouseX * pf * 3;
      mesh.position.y = -mouseY * pf * 2;

      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        dummy.position.set(
          it.x,
          it.y + Math.sin(t * 0.35 + it.floatPhase) * it.floatAmp,
          it.z
        );
        dummy.rotation.set(
          it.rx + t * it.rotSpeed * 0.5,
          it.ry + t * it.rotSpeed * 0.35,
          it.rz + t * it.rotSpeed * 0.25
        );
        dummy.scale.setScalar(it.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }

  animate();

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  window._stopPartnersScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── FEATURES PAGE 3D SCENE ──────────────────────────────────────────────────
(function () {
  'use strict';

  var canvas = document.getElementById('features-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  // ─── Renderer ────────────────────────────────────────────────────────────
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.8;

  // ─── Scene ───────────────────────────────────────────────────────────────
  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e17);

  // Fog for depth
  scene.fog = new THREE.FogExp2(0x0a0e17, 0.035);

  // ─── Camera ──────────────────────────────────────────────────────────────
  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 2, 15);

  // ─── Lighting ────────────────────────────────────────────────────────────
  scene.add(new THREE.AmbientLight(0x1a2a4a, 0.4));

  var blueLight = new THREE.PointLight(0x00f0ff, 2.5, 30);
  blueLight.position.set(-5, 5, 8);
  scene.add(blueLight);

  var purpleLight = new THREE.PointLight(0x7b61ff, 2.0, 25);
  purpleLight.position.set(5, 3, 6);
  scene.add(purpleLight);

  var greenLight = new THREE.PointLight(0x00ff9d, 1.5, 20);
  greenLight.position.set(0, -2, 10);
  scene.add(greenLight);

  // ─── Floating particles (data nodes) ─────────────────────────────────────
  var particleCount = 80;
  var particleGeo = new THREE.BufferGeometry();
  var positions = new Float32Array(particleCount * 3);
  var sizes = new Float32Array(particleCount);

  for (var i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 30;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 20;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    sizes[i] = Math.random() * 2 + 0.5;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  var particleMat = new THREE.PointsMaterial({
    color: 0x00f0ff,
    size: 0.08,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending
  });

  var particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  // ─── Grid lines (network visualization) ──────────────────────────────────
  var gridLines = [];
  var lineMat = new THREE.LineBasicMaterial({ 
    color: 0x00f0ff, 
    transparent: true, 
    opacity: 0.15 
  });

  for (var j = 0; j < 15; j++) {
    var lineGeo = new THREE.BufferGeometry();
    var linePositions = new Float32Array(6);
    linePositions[0] = (Math.random() - 0.5) * 25;
    linePositions[1] = (Math.random() - 0.5) * 15;
    linePositions[2] = (Math.random() - 0.5) * 15 - 3;
    linePositions[3] = linePositions[0] + (Math.random() - 0.5) * 10;
    linePositions[4] = linePositions[1] + (Math.random() - 0.5) * 8;
    linePositions[5] = linePositions[2] + (Math.random() - 0.5) * 5;
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    var line = new THREE.Line(lineGeo, lineMat);
    scene.add(line);
    gridLines.push(line);
  }

  // ─── Mouse tracking ──────────────────────────────────────────────────────
  var mouseX = 0, mouseY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  // ─── Resize handler ──────────────────────────────────────────────────────
  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // ─── Animation loop ──────────────────────────────────────────────────────
  var animId = null;
  var startTime = performance.now();

  function animate() {
    var t = (performance.now() - startTime) * 0.001;

    // Camera parallax
    camera.position.x += (mouseX * 2 - camera.position.x) * 0.03;
    camera.position.y += (-mouseY * 1.5 + 2 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, -5);

    // Animate particles
    var positions = particles.geometry.attributes.position.array;
    for (var i = 0; i < particleCount; i++) {
      positions[i * 3 + 1] += Math.sin(t * 0.5 + i) * 0.003;
    }
    particles.geometry.attributes.position.needsUpdate = true;
    particles.rotation.y = t * 0.02;

    // Animate lights
    blueLight.position.x = -5 + Math.sin(t * 0.3) * 3;
    purpleLight.position.z = 6 + Math.cos(t * 0.25) * 3;
    greenLight.intensity = 1.5 + Math.sin(t * 0.5) * 0.5;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }

  animate();

  // ─── Cleanup ─────────────────────────────────────────────────────────────
  window._stopFeaturesScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── KEY FEATURES PAGE 3D SCENE ────────────────────────────────────────────────
(function () {
  'use strict';
  var canvas = document.getElementById('keyfeatures-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.7;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d18);
  scene.fog = new THREE.FogExp2(0x080d18, 0.04);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1, 14);

  // Lighting
  scene.add(new THREE.AmbientLight(0x0a1a2a, 0.35));

  var cyanLight = new THREE.PointLight(0x00f0ff, 2.8, 28);
  cyanLight.position.set(-4, 4, 8);
  scene.add(cyanLight);

  var orangeLight = new THREE.PointLight(0xff6b35, 2.0, 22);
  orangeLight.position.set(6, 2, 6);
  scene.add(orangeLight);

  var tealLight = new THREE.PointLight(0x00ff9d, 1.4, 20);
  tealLight.position.set(0, -3, 10);
  scene.add(tealLight);

  // Data stream particles
  var count = 100;
  var geo = new THREE.BufferGeometry();
  var pos = new Float32Array(count * 3);
  var vel = [];
  for (var i = 0; i < count; i++) {
    pos[i*3]   = (Math.random()-0.5) * 30;
    pos[i*3+1] = (Math.random()-0.5) * 20;
    pos[i*3+2] = (Math.random()-0.5) * 20 - 5;
    vel.push({ x: (Math.random()-0.5)*0.01, y: (Math.random()-0.5)*0.008, z: (Math.random()-0.5)*0.005 });
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var mat = new THREE.PointsMaterial({
    color: 0x00f0ff, size: 0.07, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending
  });
  var pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // Orange accent particles
  var geo2 = new THREE.BufferGeometry();
  var pos2 = new Float32Array(40 * 3);
  for (var k = 0; k < 40; k++) {
    pos2[k*3]   = (Math.random()-0.5) * 25;
    pos2[k*3+1] = (Math.random()-0.5) * 18;
    pos2[k*3+2] = (Math.random()-0.5) * 15 - 3;
  }
  geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  var mat2 = new THREE.PointsMaterial({
    color: 0xff6b35, size: 0.06, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending
  });
  var pts2 = new THREE.Points(geo2, mat2);
  scene.add(pts2);

  // Network lines
  var lineMat = new THREE.LineBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.12 });
  for (var j = 0; j < 20; j++) {
    var lgeo = new THREE.BufferGeometry();
    var lp = new Float32Array(6);
    lp[0] = (Math.random()-0.5) * 25;
    lp[1] = (Math.random()-0.5) * 15;
    lp[2] = (Math.random()-0.5) * 15 - 3;
    lp[3] = lp[0] + (Math.random()-0.5) * 12;
    lp[4] = lp[1] + (Math.random()-0.5) * 10;
    lp[5] = lp[2] + (Math.random()-0.5) * 5;
    lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    scene.add(new THREE.Line(lgeo, lineMat));
  }

  // Mouse
  var mx = 0, my = 0;
  document.addEventListener('mousemove', function (e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  var animId = null;
  var t0 = performance.now();
  function animate() {
    var t = (performance.now() - t0) * 0.001;
    camera.position.x += (mx * 2 - camera.position.x) * 0.025;
    camera.position.y += (-my * 1.5 + 1 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, -5);

    // Drift particles
    var p = pts.geometry.attributes.position.array;
    for (var i = 0; i < count; i++) {
      p[i*3]   += vel[i].x;
      p[i*3+1] += vel[i].y + Math.sin(t*0.4+i)*0.002;
      p[i*3+2] += vel[i].z;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.rotation.y = t * 0.015;
    pts2.rotation.y = -t * 0.01;

    cyanLight.position.x = -4 + Math.sin(t*0.3) * 3;
    orangeLight.position.z = 6 + Math.cos(t*0.2) * 3;
    tealLight.intensity = 1.4 + Math.sin(t*0.5) * 0.5;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  window._stopKeyFeaturesScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── ROUTE PAGE 3D SCENE (Feature 2) ─────────────────────────────────────────
(function () {
  'use strict';
  var canvas = document.getElementById('route-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.65;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080d18);
  scene.fog = new THREE.FogExp2(0x080d18, 0.038);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1, 14);

  // Lighting
  scene.add(new THREE.AmbientLight(0x0a1a2a, 0.3));

  var greenLight = new THREE.PointLight(0x00ff9d, 2.5, 25);
  greenLight.position.set(-5, 3, 8);
  scene.add(greenLight);

  var redLight = new THREE.PointLight(0xff4757, 1.8, 20);
  redLight.position.set(5, 4, 6);
  scene.add(redLight);

  var blueLight = new THREE.PointLight(0x00b4ff, 1.6, 22);
  blueLight.position.set(0, -2, 10);
  scene.add(blueLight);

  // Route-colored particles
  var count = 90;
  var geo = new THREE.BufferGeometry();
  var pos = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    pos[i*3]   = (Math.random()-0.5) * 30;
    pos[i*3+1] = (Math.random()-0.5) * 20;
    pos[i*3+2] = (Math.random()-0.5) * 18 - 4;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var mat = new THREE.PointsMaterial({
    color: 0x00ff9d, size: 0.06, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending
  });
  var pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // Red traffic particles (fewer, brighter)
  var geo2 = new THREE.BufferGeometry();
  var pos2 = new Float32Array(35 * 3);
  for (var k = 0; k < 35; k++) {
    pos2[k*3]   = (Math.random()-0.5) * 25;
    pos2[k*3+1] = (Math.random()-0.5) * 16;
    pos2[k*3+2] = (Math.random()-0.5) * 12 - 3;
  }
  geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
  var mat2 = new THREE.PointsMaterial({
    color: 0xff4757, size: 0.05, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending
  });
  var pts2 = new THREE.Points(geo2, mat2);
  scene.add(pts2);

  // Route flow lines
  var routeMat = new THREE.LineBasicMaterial({ color: 0x00ff9d, transparent: true, opacity: 0.15 });
  for (var j = 0; j < 12; j++) {
    var lgeo = new THREE.BufferGeometry();
    var lp = new Float32Array(6);
    lp[0] = (Math.random()-0.5) * 20 - 5;
    lp[1] = (Math.random()-0.5) * 14;
    lp[2] = (Math.random()-0.5) * 12 - 4;
    lp[3] = lp[0] + Math.random() * 15;
    lp[4] = lp[1] + (Math.random()-0.5) * 8;
    lp[5] = lp[2] + (Math.random()-0.5) * 4;
    lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    scene.add(new THREE.Line(lgeo, routeMat));
  }

  // Mouse
  var mx = 0, my = 0;
  document.addEventListener('mousemove', function (e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  var animId = null;
  var t0 = performance.now();
  function animate() {
    var t = (performance.now() - t0) * 0.001;
    camera.position.x += (mx * 2 - camera.position.x) * 0.025;
    camera.position.y += (-my * 1.5 + 1 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, -5);

    pts.rotation.y = t * 0.018;
    pts.rotation.x = Math.sin(t * 0.1) * 0.02;
    pts2.rotation.y = -t * 0.012;

    greenLight.position.x = -5 + Math.sin(t * 0.35) * 3;
    redLight.position.z = 6 + Math.cos(t * 0.25) * 3;
    blueLight.intensity = 1.6 + Math.sin(t * 0.5) * 0.4;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  window._stopRouteScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── DISPATCHER PAGE 3D SCENE (Feature 3) ──────────────────────────────────
(function () {
  'use strict';
  var canvas = document.getElementById('dispatcher-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.7;

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e17);
  scene.fog = new THREE.FogExp2(0x0a0e17, 0.035);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1, 14);

  // Lighting
  scene.add(new THREE.AmbientLight(0x0a1a2a, 0.4));

  var cyanLight = new THREE.PointLight(0x00f0ff, 2.5, 25);
  cyanLight.position.set(-5, 4, 8);
  scene.add(cyanLight);

  var orangeLight = new THREE.PointLight(0xff6b35, 1.8, 20);
  orangeLight.position.set(5, 2, 6);
  scene.add(orangeLight);

  var purpleLight = new THREE.PointLight(0x7b61ff, 1.6, 22);
  purpleLight.position.set(0, -3, 10);
  scene.add(purpleLight);

  // Particles
  var count = 100;
  var geo = new THREE.BufferGeometry();
  var pos = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    pos[i*3]   = (Math.random()-0.5) * 35;
    pos[i*3+1] = (Math.random()-0.5) * 25;
    pos[i*3+2] = (Math.random()-0.5) * 20 - 5;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var mat = new THREE.PointsMaterial({
    color: 0x00f0ff, size: 0.05, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
  });
  var pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // Network lines
  var lineMat = new THREE.LineBasicMaterial({ color: 0x7b61ff, transparent: true, opacity: 0.15 });
  for (var j = 0; j < 15; j++) {
    var lgeo = new THREE.BufferGeometry();
    var lp = new Float32Array(6);
    lp[0] = (Math.random()-0.5) * 25 - 5;
    lp[1] = (Math.random()-0.5) * 15;
    lp[2] = (Math.random()-0.5) * 12 - 4;
    lp[3] = lp[0] + Math.random() * 12;
    lp[4] = lp[1] + (Math.random()-0.5) * 10;
    lp[5] = lp[2] + (Math.random()-0.5) * 6;
    lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    scene.add(new THREE.Line(lgeo, lineMat));
  }

  // Mouse
  var mx = 0, my = 0;
  document.addEventListener('mousemove', function (e) {
    mx = (e.clientX / window.innerWidth - 0.5) * 2;
    my = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  var animId = null;
  var t0 = performance.now();
  function animate() {
    var t = (performance.now() - t0) * 0.001;
    camera.position.x += (mx * 2 - camera.position.x) * 0.025;
    camera.position.y += (-my * 1.5 + 1 - camera.position.y) * 0.025;
    camera.lookAt(0, 0, -5);

    pts.rotation.y = t * 0.012;
    pts.rotation.x = Math.sin(t * 0.1) * 0.015;

    cyanLight.position.x = -5 + Math.sin(t * 0.3) * 3;
    orangeLight.position.z = 6 + Math.cos(t * 0.2) * 3;
    purpleLight.intensity = 1.4 + Math.sin(t * 0.4) * 0.4;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  window._stopDispatcherScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── Navigation State ─────────────────────────────────────────────────────────
var currentPage = 'landing'; // 'landing', 'partners', 'dashboard'
var isTransitioning = false;

// ─── Landing/Partners/Features → Dashboard Transition ─────────────────────────
function enterDashboard() {
  if (isTransitioning) return;
  isTransitioning = true;

  // Stop any active 3D scenes
  if (window._stopLandingScene) window._stopLandingScene();
  if (window._stopPartnersScene) window._stopPartnersScene();
  if (window._stopFeaturesScene) window._stopFeaturesScene();
  if (window._stopKeyFeaturesScene) window._stopKeyFeaturesScene();
  if (window._stopRouteScene) window._stopRouteScene();
  if (window._stopDispatcherScene) window._stopDispatcherScene();

  var landing = document.getElementById('landing-page');
  var partners = document.getElementById('partners-page');
  var features = document.getElementById('features-page');
  var keyfeatures = document.getElementById('keyfeatures-page');
  var routepage = document.getElementById('route-page');
  var dispatcherpage = document.getElementById('dispatcher-page');
  var dashboard = document.getElementById('dashboard-view');

  // Hide all pages, show dashboard
  if (landing) landing.style.display = 'none';
  if (partners) partners.style.display = 'none';
  if (features) features.style.display = 'none';
  if (keyfeatures) keyfeatures.style.display = 'none';
  if (routepage) routepage.style.display = 'none';
  if (dispatcherpage) dispatcherpage.style.display = 'none';
  if (dashboard) dashboard.style.display = 'block';

  // Apply dashboard body class (allows scrolling)
  document.body.classList.add('dashboard-active');
  currentPage = 'dashboard';
  isTransitioning = false;

  // Scroll to top for dashboard
  window.scrollTo(0, 0);

  // Re-initialize Leaflet map (it was hidden when socket init fired)
  if (typeof reinitMap === 'function') {
    setTimeout(function() {
      reinitMap();
      setTimeout(function() {
        if (typeof map !== 'undefined' && map) map.invalidateSize();
      }, 200);
    }, 100);
  }
}
