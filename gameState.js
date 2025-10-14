// Game state and constants
const gameState = {
  lives: 3,
  score: 0,
  isRunning: false,
  isGameOver: false,
  speed: 0.10,
  playerX: 0,
  playerY: 0,
  playerVelocityY: 0,
  isJumping: false,
  isHammering: false,
  keys: {},
  trackZ: 0
};

// Game constants
const GRAVITY = 0.012;
const JUMP_FORCE = 0.35;
const MOVE_SPEED = 0.08;
const TRACK_WIDTH = 6;
const LANE_COUNT = 3;
const LANE_WIDTH = TRACK_WIDTH / LANE_COUNT;
const MAX_CONSECUTIVE_HOLES = 1;
const SAFE_START_RADIUS = 6;

// Global Three.js variables
let scene, camera, renderer, clock;

// Game objects
let player, mixer, animations = {};
let trackSegments = [];
let obstacles = [];
let coins = [];