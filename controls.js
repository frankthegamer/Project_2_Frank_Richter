// Keyboard controls
document.addEventListener('keydown', (e) => {
  gameState.keys[e.key.toLowerCase()] = true;

  // Jump
  if ((e.key === ' ' || e.code === 'Space') && !gameState.isJumping && gameState.playerY === 0) {
    gameState.isJumping = true;
    gameState.playerVelocityY = JUMP_FORCE;
  }
});

document.addEventListener('keyup', (e) => {
  gameState.keys[e.key.toLowerCase()] = false;
});

// Mouse click for hammer
document.addEventListener('click', (e) => {
  if (gameState.isRunning && !gameState.isGameOver && !gameState.isHammering) {
    activateHammer();
  }
});

// Hammer activation function
function activateHammer() {
  gameState.isHammering = true;
  if (animations.hammer) {
    animations.hammer.reset();
    animations.hammer.play();
  }
  setTimeout(() => {
    gameState.isHammering = false;
  }, 500);
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