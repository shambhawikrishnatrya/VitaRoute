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
  var grad = bgCtx.createLinearGradient(0, 0, 0, 512);
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

// ─── SOLUTIONS PAGE 3D SCENE (8th Page) ────────────────────────────────────
(function () {
  'use strict';
  var canvas = document.getElementById('solutions-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

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

  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 18);

  // Lighting
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

  // Feather geometry helper
  function makeFeatherGeo() {
    var w = 0.14 + Math.random() * 0.1;
    var h = 1.2 + Math.random() * 2.0;
    return new THREE.PlaneGeometry(w, h, 1, 6);
  }

  // Color palette (reds → pinks → crimsons)
  var palette = [
    0xbb1122, 0xcc2233, 0xdd3344, 0xaa1828,
    0xcc1133, 0xe04050, 0x991122, 0xdd2244,
    0xc82838, 0xb02030, 0xe85060, 0xd04858
  ];

  function pickColor() {
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // Create feather layers (parallax depth groups)
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

  // Mouse tracking
  var mouseX = 0, mouseY = 0;
  var targetCamX = 0, targetCamY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  var animId = null;
  var clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    var delta = clock.getDelta();
    var time  = clock.getElapsedTime();

    // Camera parallax
    targetCamX = mouseX * 2.5;
    targetCamY = mouseY * 1.5;
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (-targetCamY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, -10);

    // Dynamic lights
    warmLight.position.x = Math.sin(time * 0.4) * 6;
    coolLight.position.y = Math.cos(time * 0.3) * 4 - 2;

    // Animate instances
    layers.forEach(function (layer) {
      var items = layer.items;
      var mesh = layer.mesh;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        
        it.rx += it.rotSpeed * delta;
        it.ry += it.rotSpeed * delta * 0.7;
        
        var dy = Math.sin(time * 1.2 + it.floatPhase) * it.floatAmp;

        dummy.position.set(it.x, it.y + dy, it.z);
        dummy.rotation.set(it.rx, it.ry, it.rz);
        dummy.scale.setScalar(it.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });

    renderer.render(scene, camera);
  }

  clock.start();
  animate();

  window._stopSolutionsScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── BENEFITS PAGE 3D SCENE (9th Page) ───────────────────────────────────────
(function () {
  'use strict';
  var canvas = document.getElementById('benefits-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  var scene = new THREE.Scene();

  // Gradient background (orange → red)
  var bgCanvas = document.createElement('canvas');
  bgCanvas.width = 4;
  bgCanvas.height = 512;
  var bgCtx = bgCanvas.getContext('2d');
  var grad = bgCtx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#ffc080');
  grad.addColorStop(0.4, '#ff6030');
  grad.addColorStop(0.8, '#cc1010');
  grad.addColorStop(1.0, '#800000');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, 4, 512);
  scene.background = new THREE.CanvasTexture(bgCanvas);

  // Depth fog
  scene.fog = new THREE.FogExp2(0xff6030, 0.025);

  var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
  camera.position.set(0, 0, 18);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffcccc, 0.6));

  var dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(6, 10, 12);
  scene.add(dirLight);

  var warmLight = new THREE.PointLight(0xffaa00, 2.5, 35);
  warmLight.position.set(-5, 3, 8);
  scene.add(warmLight);

  var coolLight = new THREE.PointLight(0xff5555, 1.5, 28);
  coolLight.position.set(5, -2, 5);
  scene.add(coolLight);

  // Feather geometry helper
  function makeFeatherGeo() {
    var w = 0.15 + Math.random() * 0.1;
    var h = 1.5 + Math.random() * 2.5;
    return new THREE.PlaneGeometry(w, h, 1, 6);
  }

  // Color palette (oranges, bright reds)
  var palette = [
    0xff3300, 0xff5500, 0xee2200, 0xffaa00,
    0xff4422, 0xcc1100, 0xff7700, 0xdd3311
  ];

  function pickColor() {
    return palette[Math.floor(Math.random() * palette.length)];
  }

  // Create feather layers (parallax depth groups)
  var layers = [];

  var layerConfigs = [
    { count: 40,  zMin: -5,  zMax:  2,  spread: 25, scaleMin: 0.7, scaleMax: 1.6, opacity: 0.95, fogDensity: 0.025 },
    { count: 50,  zMin: -15, zMax: -5,  spread: 35, scaleMin: 0.5, scaleMax: 1.2, opacity: 0.75, fogDensity: 0.03  },
    { count: 40,  zMin: -30, zMax: -15, spread: 45, scaleMin: 0.3, scaleMax: 0.9, opacity: 0.45, fogDensity: 0.04  }
  ];

  var dummy = new THREE.Object3D();

  layerConfigs.forEach(function (cfg) {
    var geo = makeFeatherGeo();
    var mat = new THREE.MeshStandardMaterial({
      color: pickColor(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: cfg.opacity,
      roughness: 0.4,
      metalness: 0.1,
      emissive: new THREE.Color(0x331100),
      emissiveIntensity: 0.2
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
        rotSpeed:  (Math.random() - 0.5) * 0.15,
        floatPhase: Math.random() * Math.PI * 2,
        floatAmp:   0.1 + Math.random() * 0.2
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

  // Mouse tracking
  var mouseX = 0, mouseY = 0;
  var targetCamX = 0, targetCamY = 0;

  document.addEventListener('mousemove', function (e) {
    mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  var animId = null;
  var clock = new THREE.Clock();

  function animate() {
    animId = requestAnimationFrame(animate);
    var delta = clock.getDelta();
    var time  = clock.getElapsedTime();

    // Camera parallax
    targetCamX = mouseX * 2.0;
    targetCamY = mouseY * 1.2;
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (-targetCamY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, -10);

    // Dynamic lights
    warmLight.position.x = Math.sin(time * 0.5) * 6;
    coolLight.position.y = Math.cos(time * 0.4) * 4 - 2;

    // Animate instances
    layers.forEach(function (layer) {
      var items = layer.items;
      var mesh = layer.mesh;
      for (var i = 0; i < items.length; i++) {
        var it = items[i];
        
        it.rx += it.rotSpeed * delta;
        it.ry += it.rotSpeed * delta * 0.8;
        
        var dy = Math.sin(time * 1.5 + it.floatPhase) * it.floatAmp;

        dummy.position.set(it.x, it.y + dy, it.z);
        dummy.rotation.set(it.rx, it.ry, it.rz);
        dummy.scale.setScalar(it.s);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });

    renderer.render(scene, camera);
  }

  clock.start();
  animate();

  window._stopBenefitsScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── TESTIMONIALS PAGE 3D SCENE (10th Page) ──────────────────────────────────
(function () {
  'use strict';
  var canvas = document.getElementById('testimonials-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x020202);
  scene.fog = new THREE.FogExp2(0x020202, 0.04);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 15);

  // Particles / Stars
  var count = 300;
  var geo = new THREE.BufferGeometry();
  var pos = new Float32Array(count * 3);
  for (var i = 0; i < count; i++) {
    pos[i*3]   = (Math.random()-0.5) * 40;
    pos[i*3+1] = (Math.random()-0.5) * 30;
    pos[i*3+2] = (Math.random()-0.5) * 20 - 5;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  var mat = new THREE.PointsMaterial({
    color: 0x88ccff, size: 0.08, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
  });
  var pts = new THREE.Points(geo, mat);
  scene.add(pts);

  // Mouse tracking
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
    camera.position.x += (mx * 2 - camera.position.x) * 0.05;
    camera.position.y += (-my * 1.5 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, -5);

    pts.rotation.y = t * 0.02;
    pts.rotation.x = Math.sin(t * 0.1) * 0.01;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  window._stopTestimonialsScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── PRICING PAGE 3D SCENE (11th Page) ───────────────────────────────────────
(function () {
  'use strict';
  var canvas = document.getElementById('pricing-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.fog = new THREE.FogExp2(0x050505, 0.02);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 20);

  // Big wireframe geometry
  var geo = new THREE.IcosahedronGeometry(12, 1);
  var mat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, wireframe: true, transparent: true, opacity: 0.15 });
  var mesh = new THREE.Mesh(geo, mat);
  scene.add(mesh);

  var geo2 = new THREE.IcosahedronGeometry(15, 2);
  var mat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.05 });
  var mesh2 = new THREE.Mesh(geo2, mat2);
  scene.add(mesh2);

  // Mouse tracking
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
    camera.position.x += (mx * 3 - camera.position.x) * 0.05;
    camera.position.y += (-my * 2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    mesh.rotation.y = t * 0.05;
    mesh.rotation.x = t * 0.03;
    
    mesh2.rotation.y = -t * 0.03;
    mesh2.rotation.z = t * 0.02;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  window._stopPricingScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── CTA & FOOTER PAGE 3D SCENE (12th Page) ──────────────────────────────────
(function () {
  'use strict';
  var canvas = document.getElementById('cta-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene = new THREE.Scene();
  
  // Background gradient (peach/pink/red)
  var bgCanvas = document.createElement('canvas');
  bgCanvas.width = 4;
  bgCanvas.height = 512;
  var bgCtx = bgCanvas.getContext('2d');
  var grad = bgCtx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0.0, '#ffe0d0');
  grad.addColorStop(0.4, '#ff8080');
  grad.addColorStop(0.8, '#dd2222');
  grad.addColorStop(1.0, '#440000');
  bgCtx.fillStyle = grad;
  bgCtx.fillRect(0, 0, 4, 512);
  scene.background = new THREE.CanvasTexture(bgCanvas);
  
  scene.fog = new THREE.FogExp2(0xcc2222, 0.02);

  var camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 20);

  var ambientLight = new THREE.AmbientLight(0xffcccc, 0.8);
  scene.add(ambientLight);

  var dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  // Sleek geometric wave grid instead of TorusKnot
  var geo = new THREE.PlaneGeometry(60, 40, 40, 40);
  geo.rotateX(-Math.PI / 2);
  
  var mat = new THREE.MeshStandardMaterial({
    color: 0xff3333,
    roughness: 0.2,
    metalness: 0.5,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
    emissive: 0xaa0000,
    emissiveIntensity: 0.8
  });
  
  var waveGrid = new THREE.Mesh(geo, mat);
  waveGrid.position.set(0, -6, -5);
  scene.add(waveGrid);

  // Original vertex positions for wave animation
  var pos = geo.attributes.position;
  var vCount = pos.count;
  var origY = new Float32Array(vCount);
  for(var i=0; i<vCount; i++) {
    origY[i] = pos.getY(i);
  }

  // Floating ambient particles
  var pGeo = new THREE.BufferGeometry();
  var pCount = 300;
  var pPos = new Float32Array(pCount * 3);
  for(var i=0; i<pCount; i++) {
    pPos[i*3] = (Math.random() - 0.5) * 80;
    pPos[i*3+1] = (Math.random() - 0.5) * 40;
    pPos[i*3+2] = (Math.random() - 0.5) * 40;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  var pMat = new THREE.PointsMaterial({color: 0xffaaaa, size: 0.15, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending});
  var particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  // Mouse tracking
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
    camera.position.x += (mx * 2 - camera.position.x) * 0.05;
    camera.position.y += (-my * 1 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    // Animate wave grid
    for(var i=0; i<vCount; i++) {
      var vx = pos.getX(i);
      var vz = pos.getZ(i);
      // Create a smooth rolling wave effect
      var ny = Math.sin(vx * 0.2 + t) * Math.cos(vz * 0.2 + t * 0.8) * 1.5;
      pos.setY(i, origY[i] + ny);
    }
    pos.needsUpdate = true;

    particles.rotation.y = t * 0.03;

    var pAttr = particles.geometry.attributes.position;
    for(var i=0; i<pCount; i++) {
      pAttr.array[i*3+1] += 0.015; // slow rise
      if(pAttr.array[i*3+1] > 20) pAttr.array[i*3+1] = -20;
    }
    pAttr.needsUpdate = true;

    renderer.render(scene, camera);
    animId = requestAnimationFrame(animate);
  }
  animate();

  window._stopCtaScene = function () {
    if (animId) { cancelAnimationFrame(animId); animId = null; }
    window.removeEventListener('resize', onResize);
    renderer.dispose();
  };
})();

// ─── Navigation State ─────────────────────────────────────────────────────────
var currentPage = 'landing'; // 'landing', 'partners', 'dashboard'
var isTransitioning = false;

// ─── AUTHENTICATION LOGIC ─────────────────────────────────────────────────────
function closeLoginModal() {
  document.getElementById('login-modal-overlay').style.display = 'none';
  document.getElementById('login-error').style.display = 'none';
}

function showLoginModal() {
  document.getElementById('login-modal-overlay').style.display = 'flex';
}

async function submitLogin() {
  const emailEl = document.getElementById('login-email');
  const passwordEl = document.getElementById('login-password');
  const errorEl = document.getElementById('login-error');

  const email = emailEl ? emailEl.value.trim() : '';
  const password = passwordEl ? passwordEl.value.trim() : '';

  if (!email || !password) {
    if (errorEl) {
      errorEl.innerText = "Please enter email and password.";
      errorEl.style.display = 'block';
    }
    return;
  }

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    
    if (data.success) {
      localStorage.setItem('token', data.token);
      closeLoginModal();
      isTransitioning = true;
      proceedToDashboard(); 
    } else {
      if (errorEl) {
        errorEl.innerText = data.error || "Invalid credentials";
        errorEl.style.display = 'block';
      }
    }
  } catch (err) {
    if (errorEl) {
      errorEl.innerText = "Connection error. Try again.";
      errorEl.style.display = 'block';
    }
  }
}

function logout() {
  localStorage.removeItem('token');
  window.location.reload();
}

// ─── Landing/Partners/Features → Dashboard Transition ─────────────────────────
function enterDashboard() {
  if (isTransitioning) return;
  
  // Enforce JWT Auth
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginModal();
    return;
  }
  
  isTransitioning = true;
  proceedToDashboard();
}

function proceedToDashboard() {
  // Stop any active 3D scenes
  if (window._stopLandingScene) window._stopLandingScene();
  if (window._stopPartnersScene) window._stopPartnersScene();
  if (window._stopFeaturesScene) window._stopFeaturesScene();
  if (window._stopKeyFeaturesScene) window._stopKeyFeaturesScene();
  if (window._stopRouteScene) window._stopRouteScene();
  if (window._stopDispatcherScene) window._stopDispatcherScene();
  if (window._stopSolutionsScene) window._stopSolutionsScene();
  if (window._stopBenefitsScene) window._stopBenefitsScene();
  if (window._stopTestimonialsScene) window._stopTestimonialsScene();
  if (window._stopPricingScene) window._stopPricingScene();
  if (window._stopCtaScene) window._stopCtaScene();

  var landing = document.getElementById('landing-page');
  var partners = document.getElementById('partners-page');
  var features = document.getElementById('features-page');
  var keyfeatures = document.getElementById('keyfeatures-page');
  var routepage = document.getElementById('route-page');
  var dispatcherpage = document.getElementById('dispatcher-page');
  var solutionspage = document.getElementById('solutions-page');
  var benefitspage = document.getElementById('benefits-page');
  var testimonialspage = document.getElementById('testimonials-page');
  var pricingpage = document.getElementById('pricing-page');
  var ctapage = document.getElementById('cta-page');
  var dashboard = document.getElementById('dashboard-view');

  // Hide all pages, show dashboard
  var globalNav = document.getElementById('global-landing-nav');
  if (globalNav) globalNav.style.display = 'none';
  
  if (landing) landing.style.display = 'none';
  if (partners) partners.style.display = 'none';
  if (features) features.style.display = 'none';
  if (keyfeatures) keyfeatures.style.display = 'none';
  if (routepage) routepage.style.display = 'none';
  if (dispatcherpage) dispatcherpage.style.display = 'none';
  if (solutionspage) solutionspage.style.display = 'none';
  if (benefitspage) benefitspage.style.display = 'none';
  if (testimonialspage) testimonialspage.style.display = 'none';
  if (pricingpage) pricingpage.style.display = 'none';
  if (ctapage) ctapage.style.display = 'none';
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
        if (typeof window.resizeMap === 'function') window.resizeMap();
      }, 200);
    }, 100);
  }
}

// Check if returning from video demo or navigating from dashboard
document.addEventListener("DOMContentLoaded", function() {
  if (sessionStorage.getItem('returnToDashboard') === 'true') {
    sessionStorage.removeItem('returnToDashboard');
    // Call enterDashboard but delay slightly to ensure DOM is ready
    setTimeout(enterDashboard, 50);
  }
  
  var section = sessionStorage.getItem('scrollToSection');
  if (section) {
    sessionStorage.removeItem('scrollToSection');
    setTimeout(function() {
      var el = document.getElementById(section);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }
});

// ─── 3D SCROLL MOTION OBSERVER ────────────────────────────────────────────────
(function() {
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        entry.target.classList.remove('in-view');
      }
    });
  }, { threshold: 0.15 });

  var pages = [
    'landing-page', 'partners-page', 'demo-page', 'features-page', 'keyfeatures-page', 
    'route-page', 'dispatcher-page', 'solutions-page', 'benefits-page', 
    'testimonials-page', 'pricing-page', 'cta-page'
  ];
  
  pages.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) {
      el.classList.add('scroll-3d-section');
      observer.observe(el);
    }
  });
})();

// ─── LIVE INTERACTIVE MAP DEMO ───────────────────────────────────────────────
(function() {
  var mapEl = document.getElementById('demo-live-map');
  if (!mapEl || typeof L === 'undefined') return;

  var demoMap = L.map('demo-live-map', {
    zoomControl: false,
    scrollWheelZoom: false,
    attributionControl: false
  }).setView([28.6139, 77.2090], 12);

  L.control.zoom({ position: 'topright' }).addTo(demoMap);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 20, subdomains: 'abcd'
  }).addTo(demoMap);

  var ambIcon = L.divIcon({
    className: 'demo-amb-marker',
    html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>',
    iconSize: [32, 32], iconAnchor: [16, 16]
  });

  var emgIcon = L.divIcon({
    className: 'demo-emg-marker', html: '', iconSize: [16, 16], iconAnchor: [8, 8]
  });

  var ambulances = [
    { id: 1, pos: [28.6315, 77.2167], marker: L.marker([28.6315, 77.2167], {icon: ambIcon}).addTo(demoMap) },
    { id: 2, pos: [28.5660, 77.2066], marker: L.marker([28.5660, 77.2066], {icon: ambIcon}).addTo(demoMap) },
    { id: 3, pos: [28.5246, 77.2066], marker: L.marker([28.5246, 77.2066], {icon: ambIcon}).addTo(demoMap) }
  ];

  var currentEmgMarker = null;
  var currentRouteLine = null;
  var isDispatching = false;
  var statusEl = document.getElementById('demo-hud-status');
  var etaEl = document.getElementById('demo-hud-eta');
  var distEl = document.getElementById('demo-hud-dist');

  demoMap.on('click', function(e) {
    if (isDispatching) return;
    var dest = [e.latlng.lat, e.latlng.lng];
    if (currentEmgMarker) demoMap.removeLayer(currentEmgMarker);
    if (currentRouteLine) demoMap.removeLayer(currentRouteLine);

    currentEmgMarker = L.marker(dest, {icon: emgIcon}).addTo(demoMap);
    statusEl.innerText = "Finding nearest ambulance...";
    statusEl.style.color = "#f59e0b";

    setTimeout(function() {
      var nearest = null, minDist = Infinity;
      ambulances.forEach(function(a) {
        var d = demoMap.distance(a.pos, dest);
        if (d < minDist) { minDist = d; nearest = a; }
      });

      statusEl.innerText = "Dispatching Unit " + nearest.id + "...";
      statusEl.style.color = "#3b82f6";

      var routeCoords = [ nearest.pos, [nearest.pos[0] + (dest[0]-nearest.pos[0])*0.5, nearest.pos[1]], dest ];
      currentRouteLine = L.polyline(routeCoords, { color: '#10b981', weight: 4, opacity: 0.8, dashArray: '10, 10' }).addTo(demoMap);
      demoMap.fitBounds(currentRouteLine.getBounds(), {padding: [50, 50]});

      distEl.innerText = (minDist / 1000).toFixed(1) + " km";
      etaEl.innerText = Math.max(1, Math.round(minDist / 500)) + " mins";
      isDispatching = true;

      var step = 0, totalSteps = 60;
      var interval = setInterval(function() {
        step++;
        var progress = step / totalSteps;
        var currentLat, currentLng;
        if (progress < 0.5) {
          var p2 = progress * 2;
          currentLat = routeCoords[0][0] + (routeCoords[1][0] - routeCoords[0][0]) * p2;
          currentLng = routeCoords[0][1] + (routeCoords[1][1] - routeCoords[0][1]) * p2;
        } else {
          var p2 = (progress - 0.5) * 2;
          currentLat = routeCoords[1][0] + (routeCoords[2][0] - routeCoords[1][0]) * p2;
          currentLng = routeCoords[1][1] + (routeCoords[2][1] - routeCoords[1][1]) * p2;
        }

        nearest.marker.setLatLng([currentLat, currentLng]);
        nearest.pos = [currentLat, currentLng];

        if (step >= totalSteps) {
          clearInterval(interval);
          isDispatching = false;
          statusEl.innerText = "Arrived at destination.";
          statusEl.style.color = "#10b981";
          demoMap.removeLayer(currentEmgMarker);
          demoMap.removeLayer(currentRouteLine);
          currentEmgMarker = null;
          currentRouteLine = null;
          distEl.innerText = "--";
          etaEl.innerText = "--";
        }
      }, 50);
    }, 600);
  });
})();




