// Player management

function loadPlayer() {
  const loader = new THREE.GLTFLoader();
  
  loader.load('./models/hog_rider.glb', 
    (gltf) => {
      player = gltf.scene;
      player.scale.set(1, 1, 1);
      player.position.set(0, 0, 0);
      player.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          // Ensure textures use proper color encoding
          if (node.material) {
            if (node.material.map) {
              node.material.map.encoding = THREE.sRGBEncoding;
            }
            node.material.needsUpdate = true;
          }
        }
      });
      scene.add(player);

      // Setup animations
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(player);
        gltf.animations.forEach((clip) => {
          const action = mixer.clipAction(clip);
          if (clip.name.toLowerCase().includes('run')) {
            animations.run = action;
            action.play();
          } else if (clip.name.toLowerCase().includes('hammer') || clip.name.toLowerCase().includes('attack')) {
            animations.hammer = action;
            action.loop = THREE.LoopOnce;
            action.clampWhenFinished = true;
          }
        });
      }
    },
    undefined,
    (error) => {
      console.error('Error loading model, using placeholder:', error);
      createPlaceholderPlayer();
    }
  );
}

function createPlaceholderPlayer() {
  const geometry = new THREE.BoxGeometry(0.5, 1, 0.5);
  const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
  player = new THREE.Mesh(geometry, material);
  player.castShadow = true;
  scene.add(player);
}

function updatePlayer(delta) {
  if (!player || gameState.isGameOver) return;

  // Horizontal movement
  if (gameState.keys['a'] || gameState.keys['ArrowLeft'] || gameState.keys['arrowleft']) {
  gameState.playerX -= MOVE_SPEED;
  }
  if (gameState.keys['d'] || gameState.keys['ArrowRight'] || gameState.keys['arrowright']) {
    gameState.playerX += MOVE_SPEED;
  }

  // Clamp to track bounds
  const maxX = TRACK_WIDTH / 2 - 0.5;
  gameState.playerX = Math.max(-maxX, Math.min(maxX, gameState.playerX));

  // Jump physics
  if (gameState.isJumping) {
    gameState.playerVelocityY -= GRAVITY;
    gameState.playerY += gameState.playerVelocityY;

    if (gameState.playerY <= 0) {
      gameState.playerY = 0;
      gameState.playerVelocityY = 0;
      gameState.isJumping = false;
    }
  }




// Call onJumpStart() when you set vertical velocity, and call onLand() when player returns to ground (playerY <= 0 or landing event)


  // Update player position
  player.position.x = gameState.playerX;
  player.position.y = gameState.playerY;

  // Update camera
  camera.position.x = gameState.playerX;
  camera.position.y = 4 + gameState.playerY * 0.3;
  camera.lookAt(gameState.playerX, 1, -5);

  // Update animations
  if (mixer) {
    mixer.update(delta);
  }
}

