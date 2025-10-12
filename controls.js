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