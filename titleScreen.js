// Title screen 3D showcase

let titleScene, titleCamera, titleRenderer, titlePlayer, titleMixer, titleClock;
let titleAnimationId;

function initTitleScreen() {
  // Scene
  titleScene = new THREE.Scene();
  titleScene.background = new THREE.Color(0x87CEEB);
  
  // Camera - fixed angled front perspective on the left
  titleCamera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  titleCamera.position.set(0, 2, 4);
  titleCamera.lookAt(-2.5, 1, 0);
  
  // Renderer
  const canvas = document.getElementById('titleCanvas');
  titleRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  titleRenderer.setSize(window.innerWidth, window.innerHeight);
  titleRenderer.outputEncoding = THREE.sRGBEncoding;
  titleRenderer.gammaFactor = 2.2;
  
  // Lights - bright and vibrant
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  titleScene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  titleScene.add(dirLight);

  const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
  dirLight2.position.set(-5, 5, -5);
  titleScene.add(dirLight2);

  
  // Add ground plane for reference
  const groundGeometry = new THREE.CircleGeometry(5, 32);
  const groundMaterial = new THREE.MeshStandardMaterial({ 
    color: 0x609833,
    side: THREE.DoubleSide 
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.5;
  ground.position.x = -2.5;
    
  titleScene.add(ground);
  
  // Clock for animation
  titleClock = new THREE.Clock();
  
  // Load model
  loadTitleModel();
  
  // Start animation
  animateTitleScreen();
  
  // Window resize handler
  window.addEventListener('resize', onTitleResize);

  // Detect mobile
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent);
}

// Update instructions
const instructions = document.getElementById('instructions');
if (instructions) {
  if (isMobile()) {
    instructions.innerHTML = "Touch & drag = move<br>Swipe Up = Jump<br>Tap = Hammer";
  } else {
    instructions.innerHTML = "A,D / [<] [>] = move <br>[SPACE] = Jump<br>Left Click = Hammer";
  }
}

if (isMobile()) {
  titleCamera.position.set(0, 2.5, 5); // zoom out a bit
  titleCamera.lookAt(-2, 1, 0);
}

}

function loadTitleModel() {
  const loader = new THREE.GLTFLoader();
  
  loader.load('./models/hog_rider.glb', 
    (gltf) => {
      titlePlayer = gltf.scene;
      titlePlayer.scale.set(1.5, 1.5, 1.5);
      titlePlayer.position.set(-6.0, -0.5, 0);
      titlePlayer.rotation.y = -Math.PI / 2; // Face forward/slightly towards camera
      
      titlePlayer.traverse((node) => {
        if (node.isMesh && node.material) {
          if (node.material.map) {
            node.material.map.encoding = THREE.sRGBEncoding;
          }
          node.material.needsUpdate = true;
        }
      });
      
      titleScene.add(titlePlayer);
      
      // Setup run animation
      if (gltf.animations && gltf.animations.length) {
        titleMixer = new THREE.AnimationMixer(titlePlayer);
        gltf.animations.forEach((clip) => {
          if (clip.name.toLowerCase().includes('run')) {
            const action = titleMixer.clipAction(clip);
            action.play();
          }
        });
      }
    },
    undefined,
    (error) => {
      console.error('Error loading title model:', error);
      // Create placeholder
      const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
      const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
      titlePlayer = new THREE.Mesh(geometry, material);
      titlePlayer.position.set(-2.5, 0, 0);
      titleScene.add(titlePlayer);
    }
  );
}

function animateTitleScreen() {
  titleAnimationId = requestAnimationFrame(animateTitleScreen);
  
  const delta = titleClock.getDelta();
  
  // Update animation mixer
  if (titleMixer) {
    titleMixer.update(delta);
  }
  
  // Camera stays fixed - no rotation
  
  titleRenderer.render(titleScene, titleCamera);
}

function onTitleResize() {
  if (titleCamera && titleRenderer) {
    titleCamera.aspect = window.innerWidth / window.innerHeight;
    titleCamera.updateProjectionMatrix();
    titleRenderer.setSize(window.innerWidth, window.innerHeight);
  }
}

function stopTitleScreen() {
  if (titleAnimationId) {
    cancelAnimationFrame(titleAnimationId);
  }
  window.removeEventListener('resize', onTitleResize);
}

// Initialize title screen on page load
window.addEventListener('DOMContentLoaded', initTitleScreen);