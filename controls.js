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


// MOBILE CONTROLS

// ----------------------
// Mobile Controls Module
// ----------------------
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

if (isMobile) {
  const maxX = TRACK_WIDTH / 2 - 0.5; // keep same clamp used in updatePlayer

  // touch state
  let activeTouchId = null;
  let touchStartX = 0;
  let touchStartY = 0;
  let touchLastX = 0;
  let moved = false; // whether the finger has moved enough to be considered a drag

  // tuning
  const TAP_MOVE_THRESHOLD = 12;     // px — if movement < this, it's a tap
  const SWIPE_VERTICAL_MIN = 50;     // px upward movement to count as a swipe jump
  const DRAG_DEADZONE = 4;           // px before we consider movement as dragging

  window.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    activeTouchId = t.identifier;
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchLastX = t.clientX;
    moved = false;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (activeTouchId === null) return;

    // locate the active touch in the changedTouches list
    let t = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        t = e.changedTouches[i];
        break;
      }
    }
    if (!t) return;

    const dxSinceLast = t.clientX - touchLastX;
    const totalDx = t.clientX - touchStartX;
    const totalDy = Math.abs(t.clientY - touchStartY);

    // mark moved if user dragged beyond deadzone
    if (!moved && Math.abs(totalDx) > DRAG_DEADZONE) moved = true;

    touchLastX = t.clientX;

    // Continuous slide steering: map finger X to playerX
    // Use the finger's absolute x-position on screen for precise control
    const pct = t.clientX / window.innerWidth; // 0..1
    // map to -maxX..maxX
    gameState.playerX = (pct * 2 - 1) * maxX;
    // clamp
    gameState.playerX = Math.max(-maxX, Math.min(maxX, gameState.playerX));

    // prevent page scrolling while dragging horizontally
    // only prevent when it looks like a horizontal drag
    if (Math.abs(totalDx) > Math.abs(t.clientY - touchStartY)) {
      e.preventDefault(); // requires passive: false; we set passive: false below
    }
  }, { passive: false });

  window.addEventListener('touchend', (e) => {
    if (activeTouchId === null) return;

    // find the ended touch corresponding to our active id
    let t = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouchId) {
        t = e.changedTouches[i];
        break;
      }
    }
    if (!t) return;

    const totalDx = t.clientX - touchStartX;
    const totalDy = touchStartY - t.clientY; // positive if swipe up
    const absDx = Math.abs(totalDx);
    const absDy = Math.abs(totalDy);

    // 1) Swipe up -> jump
    if (totalDy > SWIPE_VERTICAL_MIN && absDy > absDx) {
      if (!gameState.isJumping && gameState.playerY === 0) {
        gameState.isJumping = true;
        gameState.playerVelocityY = JUMP_FORCE;
      }

    // 2) Otherwise, if it's a small movement (tap), treat as tap -> hammer
    } else if (!moved && absDx < TAP_MOVE_THRESHOLD && absDy < TAP_MOVE_THRESHOLD) {
      if (gameState.isRunning && !gameState.isGameOver && !gameState.isHammering) {
        activateHammer();
      }

    // 3) Otherwise if it was a deliberate horizontal flick (optional nudge)
    } else if (absDx > TAP_MOVE_THRESHOLD && absDx > absDy) {
      // optional: quick horizontal flick nudges player a bit
      // uncomment the block below if you want flick-to-nudge behavior:
      /*
      const nudge = maxX / 2; // half-track nudge; change to lane width if using lanes
      if (totalDx > 0) {
        gameState.playerX = Math.min(maxX, gameState.playerX + nudge);
      } else {
        gameState.playerX = Math.max(-maxX, gameState.playerX - nudge);
      }
      */
    }

    // reset
    activeTouchId = null;
    moved = false;
  }, { passive: true });

  window.addEventListener('touchcancel', () => {
    activeTouchId = null;
    moved = false;
  }, { passive: true });

  // Optional: if you want a visual on-screen joystick / left-right buttons for accessibility,
  // you can add simple DOM buttons and hook them to set gameState.playerX or nudge left/right.
}

