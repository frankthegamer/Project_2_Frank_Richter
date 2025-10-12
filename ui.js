// UI management

function updateHUD() {
  document.getElementById('lives').textContent = gameState.lives;
  document.getElementById('score').textContent = gameState.score;
}

function endGame() {
  // Mark game ended so update loop will stop doing gameplay updates
  gameState.isGameOver = true;
  gameState.isRunning = false;

  // Stop player motion flags (keep minimal)
  if (typeof gameState.playerVelocityY !== 'undefined') gameState.playerVelocityY = 0;
  gameState.isJumping = false;
  gameState.isHammering = false;

  // Stop any player animations (best-effort, non-fatal)
  if (typeof player !== 'undefined' && player && player.mixer && typeof player.mixer.stopAllAction === 'function') {
    try { player.mixer.stopAllAction(); } catch (e) { /* ignore */ }
  }

  // Keep score intact so resetGame() can reuse it if needed
  const finalScoreEl = document.getElementById('finalScore');
  if (finalScoreEl) finalScoreEl.textContent = (typeof gameState.score !== 'undefined') ? gameState.score : 0;

  // Update simple HUD numbers (optional)
  try { updateHUD && updateHUD(); } catch (e) {}

  // Show game-over UI
  const gameOverEl = document.getElementById('gameOver');
  if (gameOverEl) gameOverEl.classList.remove('hidden');

  // Re-enable restart/play controls if they were disabled
  const restartBtn = document.getElementById('restartBtn');
  if (restartBtn) restartBtn.disabled = false;

  // NOTE: do NOT clear obstacles/coins/trackSegments here — resetGame() handles full cleanup.
}


function resetGame() {
  // Stop gameplay updates while we reset (prevents race conditions)
  gameState.isRunning = false;

  // Helper: safely remove and fully dispose a mesh (geometry + material)
  function disposeMesh(mesh) {
    if (!mesh) return;
    try {
      // remove from scene if attached
      if (scene && mesh.parent) scene.remove(mesh);

      // dispose geometry
      if (mesh.geometry) {
        try { mesh.geometry.dispose(); } catch (e) {}
      }

      // dispose materials (handle array or single material)
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach(m => {
        if (!m) return;
        // attempt to dispose textures first
        for (const key in m) {
          if (m[key] && m[key].isTexture) {
            try { m[key].dispose(); } catch (e) {}
          }
        }
        try { m.dispose(); } catch (e) {}
      });
    } catch (e) {
      console.warn('disposeMesh error', e);
    }
  }

  // --- Reset player visuals & stop animations ---
  if (typeof player !== 'undefined' && player) {
    // reset materials' color/emissive (best-effort)
    try {
      player.traverse(node => {
        if (node.isMesh && node.material) {
          const mats = Array.isArray(node.material) ? node.material : [node.material];
          mats.forEach(m => {
            if (m && m.color) m.color.set(0xffffff);
            if (m && m.emissive) m.emissive.set(0x000000);
            if (m) m.needsUpdate = true;
          });
        }
      });
    } catch (e) { console.warn('player traverse/reset failed', e); }

    // Stop any animation mixer
    if (player.mixer && typeof player.mixer.stopAllAction === 'function') {
      try { player.mixer.stopAllAction(); } catch (e) {}
    }

    // Reset player transform to origin (adjust to your spawn values)
    try {
      player.position.set(0, 0, 0);
      player.rotation.set(0, 0, 0);
    } catch (e) {}
  }

  // --- Clear scene arrays safely & dispose resources ---
  if (Array.isArray(obstacles)) {
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const o = obstacles[i];
      if (o && o.mesh) disposeMesh(o.mesh);
      obstacles.splice(i, 1);
    }
  } else {
    obstacles = [];
  }

  if (Array.isArray(coins)) {
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      if (c && c.mesh) disposeMesh(c.mesh);
      coins.splice(i, 1);
    }
  } else {
    coins = [];
  }

  if (Array.isArray(trackSegments)) {
    for (let i = trackSegments.length - 1; i >= 0; i--) {
      const s = trackSegments[i];
      if (s && s.mesh) disposeMesh(s.mesh);
      trackSegments.splice(i, 1);
    }
  } else {
    trackSegments = [];
  }

  // --- Reset game state values ---
  gameState.lives = 3;
  gameState.score = 0;
  gameState.isGameOver = false;
  gameState.speed = 0.15;
  gameState.playerX = 0;
  gameState.playerY = 0;
  gameState.playerVelocityY = 0;
  gameState.isJumping = false;
  gameState.isHammering = false;
  gameState.trackZ = 0;

  // Hide game over UI (if present)
  const gameOverEl = document.getElementById('gameOver');
  if (gameOverEl) gameOverEl.classList.add('hidden');

  // --- Regenerate track (only if function exists) ---
  if (typeof createTrackSegment === 'function') {
    for (let i = 0; i < 20; i++) {
      try { createTrackSegment(i * 5); } catch (e) { console.warn('createTrackSegment failed', e); }
    }
  } else {
    console.warn('createTrackSegment is not defined; track not regenerated.');
  }

  // Update HUD and re-enable running
  try { updateHUD && updateHUD(); } catch (e) {}
  gameState.isRunning = true;
}

// Event listeners for buttons
document.getElementById('playBtn').addEventListener('click', () => {
  stopTitleScreen();
  document.getElementById('titleScreen').classList.add('hidden');
  document.getElementById('gameUI').classList.remove('hidden');
  gameState.isRunning = true;
  init();
  animate();
});

document.getElementById('restartBtn').addEventListener('click', () => {
  resetGame();
});