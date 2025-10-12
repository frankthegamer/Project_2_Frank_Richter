// World and track management

// Global spawnCoin function
window.spawnCoin = function(zPos) {
  const lane = Math.floor(Math.random() * LANE_COUNT);
  const xPos = (lane - 1) * LANE_WIDTH;

  const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.05, 16);
  const material = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
  const coin = new THREE.Mesh(geometry, material);
  coin.rotation.x = Math.PI / 2;
  coin.position.set(xPos, 0.5, zPos);
  coin.castShadow = true;
  scene.add(coin);

  coins.push({
    mesh: coin,
    collected: false
  });
};

function createTrackSegment(zPos) {
  let hasHole = Math.random() < 0.15;

  if (Math.abs(zPos - 0) <= SAFE_START_RADIUS) {
  hasHole = false;
  }

  if (countRecentHoles() >= MAX_CONSECUTIVE_HOLES){
    hasHole = false;
  }
  
  if (!hasHole) {
    const geometry = new THREE.PlaneGeometry(TRACK_WIDTH, 5);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x8B7355,
      side: THREE.DoubleSide
    });
    const track = new THREE.Mesh(geometry, material);
    track.rotation.x = -Math.PI / 2;
    track.position.set(0, -0.5, zPos);
    track.receiveShadow = true;
    scene.add(track);
    trackSegments.push({ mesh: track, z: zPos, hasHole: false });

    // Add grass borders
    const grassMat = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const leftGrass = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), grassMat);
    leftGrass.rotation.x = -Math.PI / 2;
    leftGrass.position.set(-TRACK_WIDTH / 2 - 1.5, -0.51, zPos);
    scene.add(leftGrass);
    trackSegments.push({ mesh: leftGrass, z: zPos, hasHole: false });

    const rightGrass = new THREE.Mesh(new THREE.PlaneGeometry(3, 5), grassMat);
    rightGrass.rotation.x = -Math.PI / 2;
    rightGrass.position.set(TRACK_WIDTH / 2 + 1.5, -0.51, zPos);
    scene.add(rightGrass);
    trackSegments.push({ mesh: rightGrass, z: zPos, hasHole: false });

    // Spawn obstacles — only if models loaded
    if (Math.random() < 0.3 && zPos < -10 && typeof obstacleModelsLoaded !== 'undefined' && obstacleModelsLoaded) {
      spawnObstacle(zPos);
    }

    // Spawn coins (only if spawnCoin exists)
    if (Math.random() < 0.4 && typeof spawnCoin === 'function') {
      spawnCoin(zPos);
    }

  } else { 
    trackSegments.push({ mesh: null, z: zPos, hasHole: true });
  }
}

// helper: count consecutive hole segments immediately before the new one
function countRecentHoles() {
  let count = 0;
  for (let i = trackSegments.length - 1; i >= 0; i--) {
    const seg = trackSegments[i];
    if (!seg) break;
    if (seg.hasHole) count++;
    else break;
  }
  return count;
}

function updateWorld() {
  if (gameState.isGameOver) return;


  gameState.trackZ += gameState.speed;

  // Move track segments
  trackSegments.forEach((segment, index) => {
    if (segment.mesh) {
      segment.mesh.position.z += gameState.speed;
      segment.z = segment.mesh.position.z;
    } else {
      segment.z += gameState.speed;
    }

    // Remove old segments
    if (segment.z > 10) {
      if (segment.mesh) {
        scene.remove(segment.mesh);
      }
      trackSegments.splice(index, 1);
    }
  });

  // Generate new segments
  const lastSegment = trackSegments[trackSegments.length - 1];
  if (lastSegment && lastSegment.z > -90) {
    createTrackSegment(lastSegment.z - 5);
  }

  // Check for falling off track (only if player exists)
  if (player) {
    const currentSegment = trackSegments.find(seg => 
      seg.z < player.position.z + 2 && seg.z > player.position.z - 2
    );
    
    if (currentSegment && currentSegment.hasHole && gameState.playerY <= 0) {
      gameState.lives--;
      updateHUD();
      gameState.playerY = 0;
      
      if (gameState.lives <= 0) {
        endGame();
      }
    }
  }

// Increase difficulty
gameState.speed = Math.min(0.25, 0.15 + gameState.score * 0.0001);
}