// Main game initialization and loop

function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87CEEB);
  scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

  // Camera
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4, 5);
  camera.lookAt(0, 1, -5);

  // Renderer
  const canvas = document.getElementById('renderCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.gammaFactor = 2.2;

  // Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  dirLight.castShadow = true;
  dirLight.shadow.camera.left = -20;
  dirLight.shadow.camera.right = 20;
  dirLight.shadow.camera.top = 20;
  dirLight.shadow.camera.bottom = -20;
  scene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.5);
  dirLight2.position.set(-5, 5, -5);
  scene.add(dirLight2);

  // Clock
  clock = new THREE.Clock();

  // Load player and obstacle models
  loadPlayer();
  loadObstacles();

  // Generate initial track
  for (let i = 0; i < 20; i++) {
    createTrackSegment(i * 5);
  }

  // Window resize
  window.addEventListener('resize', onWindowResize);
}

function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  if (gameState.isRunning) {
    updatePlayer(delta);
    updateWorld();
    updateObstaclesAndCoins(delta);
  }

  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
