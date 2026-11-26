/* ============================================================
   3D VIRTUAL ROOM ENGINE - FULLY FIXED TEXTURES & ANIMATIONS
   ============================================================ */

let scene, camera, renderer, raycaster;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let isLocked = false;
let clock = new THREE.Clock();
let interactiveMeshes = []; 
let currentRoomData = null;
let animationFrameId = null;
let rotatingSculpture = null;
let floatingMarkers = []; 

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const speed = 15.0; 
const FIXED_EYE_HEIGHT = 1.7; 

window.open3DRoom = function(id) {
  const roomModal = document.getElementById("roomModal");
  if (roomModal) {
    roomModal.classList.remove("open");
    roomModal.setAttribute("aria-hidden", "true");
  }
  
  currentRoomData = window.rooms.find(r => r.id === id);
  if (!currentRoomData) return;
  
  const vModal = document.getElementById("virtualRoomModal");
  const transition = document.getElementById("vTransition");
  
  if (window.isVirtualRoomOpen) {
    transition.classList.add("active");
    document.exitPointerLock();
    
    setTimeout(() => {
      init3D();
      setTimeout(() => transition.classList.remove("active"), 100);
    }, 600);
  } else {
    vModal.classList.add("open");
    vModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    window.isVirtualRoomOpen = true;
    
    init3D();
  }
};

window.closeVirtualRoom = function() {
  document.getElementById("virtualRoomModal").classList.remove("open");
  document.getElementById("virtualRoomModal").setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  window.isVirtualRoomOpen = false;
  
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  if (renderer) {
    renderer.dispose();
    renderer.domElement.remove();
  }
  if (scene) {
    scene.traverse(object => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) object.material.forEach(m => m.dispose());
        else object.material.dispose();
      }
    });
  }
  
  moveForward = false; moveBackward = false; moveLeft = false; moveRight = false;
  isLocked = false;
  interactiveMeshes = [];
  floatingMarkers = [];
  
  if (document.pointerLockElement) document.exitPointerLock();
};

function createRedMarker() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(64, 64, 60, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e53935'; ctx.beginPath(); ctx.arc(64, 64, 44, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(64, 64, 14, 0, Math.PI * 2); ctx.fill();
  
  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(1.2, 1.2, 1);
  floatingMarkers.push(sprite); 
  return sprite;
}

// ROBUST TEXTURE LOADER: Automatically falls back to proxy if direct load fails
function loadTextureSafe(url) {
  const tex = new THREE.Texture();
  const loader = new THREE.ImageLoader();
  loader.crossOrigin = 'anonymous';

  loader.load(
    url,
    function(image) {
      tex.image = image;
      tex.needsUpdate = true;
    },
    undefined,
    function(err) {
      console.warn("Direct image load failed. Trying proxy for:", url);
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
      loader.load(proxyUrl, function(proxyImage) {
        tex.image = proxyImage;
        tex.needsUpdate = true;
      });
    }
  );
  return tex;
}

function init3D() {
  const container = document.getElementById('v-canvas-container');
  container.innerHTML = '';

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0806);
  scene.fog = new THREE.FogExp2(0x0a0806, 0.02); 

  camera = new THREE.PerspectiveCamera(65, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, FIXED_EYE_HEIGHT, 15); 
  camera.rotation.order = 'YXZ';

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const spotLight = new THREE.SpotLight(0xfffaed, 1.2);
  spotLight.position.set(0, 12, 0);
  spotLight.angle = Math.PI / 2;
  spotLight.penumbra = 0.5;
  spotLight.castShadow = true;
  scene.add(spotLight);

  const leftLight = new THREE.PointLight(0xd8ad66, 1, 25);
  leftLight.position.set(-15, 6, 0); scene.add(leftLight);
  const rightLight = new THREE.PointLight(0xd8ad66, 1, 25);
  rightLight.position.set(15, 6, 0); scene.add(rightLight);

  buildRoom3D();
  raycaster = new THREE.Raycaster();
  setup3DControls(container);
  
  clock = new THREE.Clock();
  animate3D();
}

function createRoomTitleTexture(title, roomNum) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 256); 
  
  ctx.fillStyle = '#d8ad66'; 
  ctx.font = 'bold 30px "DM Sans", sans-serif'; 
  ctx.textAlign = 'center';
  ctx.fillText(`ROOM 0${roomNum}`, 512, 80);

  ctx.fillStyle = '#ffffff'; 
  ctx.font = '600 60px "Cormorant Garamond", serif'; 
  ctx.fillText(title, 512, 160);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

function buildRoom3D() {
  interactiveMeshes = [];
  floatingMarkers = [];
  
  // Floor & Carpet
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#141414'; ctx.fillRect(0, 0, 512, 512);
  ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 4; ctx.strokeRect(0, 0, 512, 512); 
  const floorTexture = new THREE.CanvasTexture(canvas);
  floorTexture.wrapS = THREE.RepeatWrapping; floorTexture.wrapT = THREE.RepeatWrapping; floorTexture.repeat.set(10, 10);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.1, metalness: 0.8 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(6, 30), new THREE.MeshStandardMaterial({ color: 0x4a0b0b, roughness: 1 }));
  carpet.rotation.x = -Math.PI / 2; carpet.position.y = 0.01; scene.add(carpet);

  // Walls & Architecture
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x1f1812, roughness: 0.9 });
  const wainscotMat = new THREE.MeshStandardMaterial({ color: 0x17110c, roughness: 0.8 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xd8ad66, emissive: 0x3a2504, roughness: 0.3 });

  const wallGeo = new THREE.PlaneGeometry(40, 12);
  const backWall = new THREE.Mesh(wallGeo, wallMat); backWall.position.set(0, 6, -20); scene.add(backWall);
  const leftWall = new THREE.Mesh(wallGeo, wallMat); leftWall.position.set(-20, 6, 0); leftWall.rotation.y = Math.PI / 2; scene.add(leftWall);
  const rightWall = new THREE.Mesh(wallGeo, wallMat); rightWall.position.set(20, 6, 0); rightWall.rotation.y = -Math.PI / 2; scene.add(rightWall);

  const wainscotGeo = new THREE.BoxGeometry(40, 3, 0.2);
  const backW = new THREE.Mesh(wainscotGeo, wainscotMat); backW.position.set(0, 1.5, -19.9); scene.add(backW);
  const leftW = new THREE.Mesh(wainscotGeo, wainscotMat); leftW.position.set(-19.9, 1.5, 0); leftW.rotation.y = Math.PI / 2; scene.add(leftW);
  const rightW = new THREE.Mesh(wainscotGeo, wainscotMat); rightW.position.set(19.9, 1.5, 0); rightW.rotation.y = -Math.PI / 2; scene.add(rightW);

  const trimGeo = new THREE.BoxGeometry(40, 0.15, 0.15);
  const backTrim = new THREE.Mesh(trimGeo, trimMat); backTrim.position.set(0, 3, -19.8); scene.add(backTrim);
  const leftTrim = new THREE.Mesh(trimGeo, trimMat); leftTrim.position.set(-19.8, 3, 0); leftTrim.rotation.y = Math.PI / 2; scene.add(leftTrim);
  const rightTrim = new THREE.Mesh(trimGeo, trimMat); rightTrim.position.set(19.8, 3, 0); rightTrim.rotation.y = -Math.PI / 2; scene.add(rightTrim);

  const colGeo = new THREE.CylinderGeometry(0.6, 0.6, 12, 16);
  const colMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.8 });
  [-15, 15].forEach(x => { [-10, 10].forEach(z => {
      const col = new THREE.Mesh(colGeo, colMat); col.position.set(x, 6, z); col.castShadow = true; scene.add(col);
  }); });

  // Centerpiece
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 3, 32), new THREE.MeshStandardMaterial({ color: 0x2a2018 }));
  pedestal.position.set(0, 1.5, 0); pedestal.castShadow = true; scene.add(pedestal);

  rotatingSculpture = new THREE.Mesh(new THREE.TorusKnotGeometry(1.2, 0.4, 100, 16), new THREE.MeshStandardMaterial({ color: 0xd8ad66, emissive: 0x3a2504, metalness: 0.9, roughness: 0.1 }));
  rotatingSculpture.position.set(0, 5, 0); rotatingSculpture.castShadow = true; scene.add(rotatingSculpture);

  // BACK WALL TITLE TEXT (Spawn Point)
  const titleTexture = createRoomTitleTexture(currentRoomData.title, currentRoomData.id);
  const titleGeo = new THREE.PlaneGeometry(20, 5);
  const titleMat = new THREE.MeshBasicMaterial({ map: titleTexture, transparent: true });
  const titleMesh = new THREE.Mesh(titleGeo, titleMat);
  titleMesh.position.set(0, 8, -19.5); // High up on the back wall
  scene.add(titleMesh);

  // Exhibits
  const ex1 = currentRoomData.exhibits[0];
  if(ex1) {
    const frame1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6.4, 4.4), new THREE.MeshStandardMaterial({ color: 0xd8ad66 }));
    frame1.position.set(-19.8, 6, -5); scene.add(frame1);
    const paint1 = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), new THREE.MeshBasicMaterial({ map: loadTextureSafe(ex1[2]) }));
    paint1.position.set(-19.6, 6, -5); paint1.rotation.y = Math.PI / 2;
    paint1.userData = { isPainting: true, title: ex1[0], desc: ex1[1], img: ex1[2] };
    scene.add(paint1); interactiveMeshes.push(paint1);
    const m1 = createRedMarker(); m1.position.set(-19.5, 2.5, -5); scene.add(m1);
  }

  const ex2 = currentRoomData.exhibits[1];
  if(ex2) {
    const frame2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6.4, 4.4), new THREE.MeshStandardMaterial({ color: 0xd8ad66 }));
    frame2.position.set(19.8, 6, -5); scene.add(frame2);
    const paint2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), new THREE.MeshBasicMaterial({ map: loadTextureSafe(ex2[2]) }));
    paint2.position.set(19.6, 6, -5); paint2.rotation.y = -Math.PI / 2;
    paint2.userData = { isPainting: true, title: ex2[0], desc: ex2[1], img: ex2[2] };
    scene.add(paint2); interactiveMeshes.push(paint2);
    const m2 = createRedMarker(); m2.position.set(19.5, 2.5, -5); scene.add(m2);
  }

  const ex3 = currentRoomData.exhibits[2];
  if(ex3) {
    const frame3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6.4, 4.4), new THREE.MeshStandardMaterial({ color: 0xd8ad66 }));
    frame3.position.set(19.8, 6, 5); scene.add(frame3);
    const paint3 = new THREE.Mesh(new THREE.PlaneGeometry(4, 6), new THREE.MeshBasicMaterial({ map: loadTextureSafe(ex3[2]) }));
    paint3.position.set(19.6, 6, 5); paint3.rotation.y = -Math.PI / 2;
    paint3.userData = { isPainting: true, title: ex3[0], desc: ex3[1], img: ex3[2] };
    scene.add(paint3); interactiveMeshes.push(paint3);
    const m3 = createRedMarker(); m3.position.set(19.5, 2.5, 5); scene.add(m3);
  }

  // TV Screen
  if (currentRoomData.videoId) {
    const tvFrame = new THREE.Mesh(new THREE.BoxGeometry(8.4, 5.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    tvFrame.position.set(0, 4, -19.8); scene.add(tvFrame); // Moved slightly down so it doesn't overlap title
    const tvScreen = new THREE.Mesh(new THREE.PlaneGeometry(8, 4.8), new THREE.MeshBasicMaterial({ map: loadTextureSafe(`https://img.youtube.com/vi/${currentRoomData.videoId}/hqdefault.jpg`) }));
    tvScreen.position.set(0, 4, -19.6);
    tvScreen.userData = { isTV: true, videoId: currentRoomData.videoId, title: currentRoomData.videoTitle };
    scene.add(tvScreen); interactiveMeshes.push(tvScreen);
    const mTV = createRedMarker(); mTV.position.set(0, 1.5, -19.5); scene.add(mTV);
  }

  // Door
  if (currentRoomData.id < 5) {
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x1c1007, roughness: 0.8 });
    const doorTrimMat = new THREE.MeshStandardMaterial({ color: 0xd8ad66, emissive: 0x3a2504 });
    
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 4), doorMat);
    door.position.set(-19.8, 4, 10); scene.add(door);

    const doorFrameTop = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 4.4), doorTrimMat);
    doorFrameTop.position.set(-19.8, 8, 10); scene.add(doorFrameTop);
    
    const doorHitbox = new THREE.Mesh(new THREE.PlaneGeometry(4, 8), new THREE.MeshBasicMaterial({ visible: false }));
    doorHitbox.position.set(-19.6, 4, 10); doorHitbox.rotation.y = Math.PI / 2;
    doorHitbox.userData = { isDoor: true, nextRoomId: currentRoomData.id + 1 };
    scene.add(doorHitbox); interactiveMeshes.push(doorHitbox);

    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx2 = canvas.getContext('2d');
    ctx2.fillStyle = '#ffffff'; ctx2.beginPath(); ctx2.arc(64, 64, 60, 0, Math.PI * 2); ctx2.fill();
    ctx2.fillStyle = '#4caf50'; ctx2.beginPath(); ctx2.arc(64, 64, 44, 0, Math.PI * 2); ctx2.fill();
    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 50px sans-serif'; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle';
    ctx2.fillText('→', 64, 64);
    const doorTexture = new THREE.CanvasTexture(canvas);
    const doorSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: doorTexture, depthTest: false }));
    doorSprite.scale.set(1.5, 1.5, 1);
    doorSprite.position.set(-19.5, 2.5, 10);
    scene.add(doorSprite);
    floatingMarkers.push(doorSprite);
  }
}

function setup3DControls(container) {
  const canvas = renderer.domElement;

  canvas.addEventListener('click', () => {
    if (!isLocked) {
      canvas.requestPointerLock();
    } else {
      checkInteraction3D();
    }
  });

  document.addEventListener('pointerlockchange', () => {
    isLocked = document.pointerLockElement === canvas;
  });

  document.addEventListener('mousemove', (e) => {
    if (!isLocked) return;
    camera.rotation.y -= e.movementX * 0.002;
    camera.rotation.x -= e.movementY * 0.002;
    camera.rotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, camera.rotation.x));
  });

  document.addEventListener('keydown', (e) => {
    if (!isLocked) return;
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': moveForward = true; break;
      case 'KeyS': case 'ArrowDown': moveBackward = true; break;
      case 'KeyA': case 'ArrowLeft': moveLeft = true; break;
      case 'KeyD': case 'ArrowRight': moveRight = true; break;
      case 'Escape': if (isLocked) document.exitPointerLock(); break;
    }
  });

  document.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp': moveForward = false; break;
      case 'KeyS': case 'ArrowDown': moveBackward = false; break;
      case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
      case 'KeyD': case 'ArrowRight': moveRight = false; break;
    }
  });

  window.addEventListener('resize', () => {
    if (!window.isVirtualRoomOpen) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

function checkInteraction3D() {
  raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
  const intersects = raycaster.intersectObjects(interactiveMeshes);

  if (intersects.length > 0) {
    const clicked = intersects[0].object;
    
    if (clicked.userData.isPainting) {
      document.exitPointerLock();
      window.showArtFocus(clicked.userData);
    } 
    else if (clicked.userData.isTV) {
      document.exitPointerLock();
      window.playRoomVideoById(clicked.userData.videoId, clicked.userData.title);
    }
    else if (clicked.userData.isDoor) {
      document.exitPointerLock();
      window.openNextRoomPrompt(clicked.userData.nextRoomId);
    }
  }
}

function animate3D() {
  animationFrameId = requestAnimationFrame(animate3D);
  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  if (rotatingSculpture) {
    rotatingSculpture.rotation.y += 0.5 * delta;
    rotatingSculpture.rotation.x += 0.2 * delta;
  }

  floatingMarkers.forEach((marker, index) => {
    marker.position.y = 2.5 + Math.sin(time * 2 + index) * 0.15;
  });

  if (isLocked) {
    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveLeft) - Number(moveRight);
    direction.normalize();

    if (direction.z !== 0 || direction.x !== 0) {
      velocity.z -= direction.z * speed * delta;
      velocity.x -= direction.x * speed * delta;
    } else {
      velocity.z -= velocity.z * 10.0 * delta;
      velocity.x -= velocity.x * 10.0 * delta;
    }

    camera.translateX(velocity.x * delta);
    camera.translateZ(velocity.z * delta);

    camera.position.y = FIXED_EYE_HEIGHT;
    camera.position.x = Math.max(-18, Math.min(18, camera.position.x));
    camera.position.z = Math.max(-18, Math.min(18, camera.position.z));

    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(interactiveMeshes);
    const crosshair = document.getElementById('vCrosshair');
    
    if (intersects.length > 0 && intersects[0].distance < 15) {
      crosshair.classList.add('active');
    } else {
      crosshair.classList.remove('active');
    }
  }

  renderer.render(scene, camera);
}