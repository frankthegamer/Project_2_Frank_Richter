// Obstacles & coins (no extra libs, efficient, single implementation)

// --- loader/state ---
let obstacleModels = {};
let obstacleModelsLoaded = false;
const gltfLoader = new THREE.GLTFLoader();

// Call loadObstacles() in init
function loadObstacles() {
  const modelsToLoad = [
    { name: 'goblin', path: './models/goblin.glb' },
    { name: 'skeleton', path: './models/skeleton.glb' }
  ];

  let loadedCount = 0;
  modelsToLoad.forEach(m => {
    gltfLoader.load(
      m.path,
      (gltf) => {
        obstacleModels[m.name] = gltf;
        loadedCount++;
        console.log(`${m.name} loaded`);
        if (loadedCount === modelsToLoad.length) {
          obstacleModelsLoaded = true;
          console.log('All obstacle models loaded');
        }
      },
      undefined,
      (err) => {
        console.error('Failed loading', m.path, err);
        loadedCount++;
        if (loadedCount === modelsToLoad.length) obstacleModelsLoaded = true;
      }
    );
  });
}

// --- placeholder fallback ---
function spawnPlaceholderObstacle(xPos, zPos) {
  const geometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
  const material = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
  const obstacle = new THREE.Mesh(geometry, material);
  obstacle.position.set(xPos, 0.1, zPos);
  obstacle.castShadow = true;
  scene.add(obstacle);

  obstacles.push({
    mesh: obstacle,
    mixer: null,
    idleAction: null,
    smashAction: null,
    hit: false,
    beingDestroyed: false,
    smashed: false,
    velocity: new THREE.Vector3(0, 0, 0)
  });
}

// --- spawn using clone(true) ---
function spawnObstacle(zPos) {
  const lane = Math.floor(Math.random() * LANE_COUNT);
  const xPos = (lane - 1) * LANE_WIDTH;

  // fallback if not ready
  if (!obstacleModelsLoaded || Object.keys(obstacleModels).length === 0) {
    spawnPlaceholderObstacle(xPos, zPos);
    return;
  }

  const modelKey = Math.random() < 0.5 ? 'goblin' : 'skeleton';
  const base = obstacleModels[modelKey];
  if (!base) {
    spawnPlaceholderObstacle(xPos, zPos);
    return;
  }

  // Clone scene (this is fast). For most GLTFs clone(true) is fine.
  const instance = base.scene.clone(true);
  instance.position.set(xPos, 0, zPos);
  instance.scale.set(1.8, 1.8, 1.8);
  instance.rotation.y = Math.PI;
  instance.userData.beingDestroyed = false;
  instance.userData.toRemove = false;

  // Ensure unique material instances so tinting doesn't affect others.
  instance.traverse(node => {
    if (node.isMesh) {
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        node.material = node.material.clone();
        if (node.material.map) {
          node.material.map.encoding = THREE.sRGBEncoding;
          node.material.needsUpdate = true;
        }
      }
    }
  });

  scene.add(instance);

  // Create mixer for this clone and attach animations from base.animations
  const mixer = new THREE.AnimationMixer(instance);
  let idleAction = null, smashAction = null;
  if (base.animations && base.animations.length) {
    base.animations.forEach(clip => {
      const name = clip.name.toLowerCase();
      if (name.includes('idle')) {
        idleAction = mixer.clipAction(clip);
        idleAction.play();
      } else if (name.includes('smash') || name.includes('hit') || name.includes('destroy')) {
        smashAction = mixer.clipAction(clip);
      }
    });
  }

  obstacles.push({
    mesh: instance,
    mixer,
    idleAction,
    smashAction,
    hit: false,
    beingDestroyed: false,
    smashed: false,
    velocity: new THREE.Vector3(0, 0, 0)
  });
}

// --- update loop (single, safe) ---
function updateObstaclesAndCoins(delta) {
  // Update obstacle mixers and move obstacles (iterate backwards for safe removal)
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obj = obstacles[i];

    // Update animation mixer if exists
    if (obj.mixer) obj.mixer.update(delta);

    // Apply velocity and gravity for smashed obstacles
    if (obj.smashed) {
      obj.mesh.position.addScaledVector(obj.velocity, delta);
      obj.velocity.y -= 9.8 * delta;

      // Remove if below floor or offscreen
      if (obj.mesh.position.y < -5 || obj.mesh.position.z > 10) {
        scene.remove(obj.mesh);
        obstacles.splice(i, 1);
        continue;
      }

      // Skip further processing for smashed obstacles
      continue;
    }

    // Normal movement
    if(!obj.smashed) {
      obj.mesh.position.z += gameState.speed;
    }
    

    // Collision check
    if (!obj.hit && !obj.beingDestroyed && player) {
      const dx = obj.mesh.position.x - player.position.x;
      const dz = obj.mesh.position.z - player.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 1 && gameState.playerY < 0.8) {
        if (gameState.isHammering) {
          // Hammer hit
          obj.hit = true;
          obj.smashed = true;
          obj.beingDestroyed = true;
          gameState.score += 10;
          updateHUD();

          // Play smash animation if available
          if (obj.smashAction && obj.idleAction) {
            obj.idleAction.stop();
            obj.smashAction.reset();
            obj.smashAction.setLoop(THREE.LoopOnce);
            obj.smashAction.clampWhenFinished = true;
            obj.smashAction.setEffectiveTimeScale(0.5);
            obj.smashAction.play();
          }

          // Launch obstacle
          obj.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 3, // x: random left/right
            5 + Math.random() * 2,     // y: upward
            -10 - Math.random() * 5     // z: backward
          );
        } else {
          // Player takes damage
          obj.hit = true;
          gameState.lives--;
          updateHUD();

          // Flash red on player
          const originals = new Map();
          player.traverse(node => {
            if (!node.isMesh || !node.material) return;
            const mats = Array.isArray(node.material) ? node.material : [node.material];
            mats.forEach(mat => {
              if (!originals.has(mat)) {
                originals.set(mat, {
                  color: mat.color ? mat.color.clone() : null,
                  emissive: mat.emissive ? mat.emissive.clone() : null
                });
              }

              if (mat.color) mat.color.set(0xff0000);
              if (mat.emissive) mat.emissive.set(0x220000);
              mat.needsUpdate = true;
            });
          });

          setTimeout(() => {
            originals.forEach((orig, mat) => {
              if (orig.color && mat.color) mat.color.copy(orig.color);
              if (orig.emissive && mat.emissive) mat.emissive.copy(orig.emissive);
              mat.needsUpdate = true;
            });
          }, 100);

          if (gameState.lives <= 0) endGame();
        }
      }
    }

    // Remove far obstacles (normal ones)
    if (!obj.smashed && obj.mesh.position.z > 10) {
      scene.remove(obj.mesh);
      obstacles.splice(i, 1);
    }
  }

  // Coins (backwards)
  for (let i = coins.length - 1; i >= 0; i--) {
    const coin = coins[i];

    if (!coin.collected) coin.mesh.rotation.z += delta * 3;
    coin.mesh.position.z += gameState.speed;

    if (!coin.collected && player) {
      const dx = coin.mesh.position.x - player.position.x;
      const dz = coin.mesh.position.z - player.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist < 1) {
        coin.collected = true;
        scene.remove(coin.mesh);
        coins.splice(i, 1);
        gameState.score += 5;
        updateHUD();
        continue;
      }
    }

    if (coin.mesh.position.z > 10) {
      scene.remove(coin.mesh);
      coins.splice(i, 1);
    }
  }
}



// --- cleanup on restart ---
function clearObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obj = obstacles[i];
    if (obj.mixer && obj.mixer.removeEventListener) {
      // if you registered listeners, remove them (we used local onFinished removal above)
    }
    if (obj.mesh) {
      scene.remove(obj.mesh);
      // optional: dispose geometry/material if needed
    }
    obstacles.splice(i, 1);
  }
}
