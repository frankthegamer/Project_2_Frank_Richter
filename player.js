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


