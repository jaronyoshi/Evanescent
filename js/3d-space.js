import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/* ========================================================
   INSTALLATIONS CONFIG
   Map mesh names (from Blender) to info + camera preset.
   Rename keys to match your actual mesh names later.
   ======================================================== */
const INSTALLATIONS = {
  'InstallationA': { title: 'Installation A', description: 'Description here.', cam: 'A' },
  'InstallationB': { title: 'Installation B', description: 'Description here.', cam: 'B' },
  'InstallationC': { title: 'Installation C', description: 'Description here.', cam: 'C' },
};

// ── State ──────────────────────────────────────────────
const cameraPresets = {};       // key → { position: Vector3, lookAt: Vector3 }
let yaw = 0, pitch = 0;
let isDragging = false;
let prevMouse = { x: 0, y: 0 };

let targetPosition = null;
let targetLookAt = null;
let isTransitioning = false;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let sceneMeshes = [];

// ── Renderer ───────────────────────────────────────────
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.NoToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ── Scene ──────────────────────────────────────────────
const scene = new THREE.Scene();
window._scene = scene;
scene.background = new THREE.Color(0x0a0a0a);
// Fog removed — was darkening distant objects

// ── Lights ─────────────────────────────────────────────
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.5));
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// ── Camera ─────────────────────────────────────────────
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);

// ── Load GLB ───────────────────────────────────────────
const loader = new GLTFLoader();
const loaderBar = document.getElementById('loader-bar');
const loaderEl = document.getElementById('loader');

loader.load(
  'assets/model/test-alleyway.glb',
  (gltf) => {
    scene.add(gltf.scene);
    window._gltf = gltf.scene;

    // Force world matrix update so nested transforms are resolved
    gltf.scene.updateMatrixWorld(true);

    // ── DEBUG: log every object in the GLB scene ─────────
    let debugCount = 0;
    gltf.scene.traverse((child) => {
      debugCount++;
      const info = { name: child.name, type: child.type, parent: child.parent?.name || '(none)' };
      if (child.isMesh) {
        child.geometry.computeBoundingBox();
        info.boundingBox = {
          min: child.geometry.boundingBox.min.toArray(),
          max: child.geometry.boundingBox.max.toArray(),
        };
        const wp = new THREE.Vector3(), ws = new THREE.Vector3();
        child.getWorldPosition(wp);
        child.getWorldScale(ws);
        const wq = new THREE.Quaternion();
        child.getWorldQuaternion(wq);
        const wr = new THREE.Euler().setFromQuaternion(wq);
        info.worldPosition = wp.toArray().map(v => +v.toFixed(4));
        info.worldRotation = [wr.x, wr.y, wr.z].map(v => +(v * 180 / Math.PI).toFixed(2));
        info.worldScale = ws.toArray().map(v => +v.toFixed(4));
      }
      console.log('[GLB]', child.name || '(unnamed)', info);
    });
    console.log('[GLB] Total objects traversed:', debugCount);
    // ── END DEBUG ───────────────────────────────────────

    // Main traversal — cameras, meshes, and screens
    gltf.scene.traverse((child) => {
      // Collect meshes for raycasting
      if (child.isMesh) {
        sceneMeshes.push(child);
      }

      // Find camera presets (Blender cameras export as PerspectiveCamera)
      const camMatch = child.name.match(/^Cam([A-C])$/);
      if (camMatch && (child.isCamera || child.type === 'Object3D')) {
        const swapBC = { A: 'A', B: 'C', C: 'B' };
        const key = swapBC[camMatch[1]];
        const position = child.position.clone();

        // Derive look-at from the Empty's quaternion
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(child.quaternion);
        const lookAt = position.clone().add(forward.multiplyScalar(5));

        cameraPresets[key] = { position, lookAt };
      }

    });

    // Start at CamA
    if (cameraPresets['A']) {
      camera.position.copy(cameraPresets['A'].position);
      syncYawPitch(cameraPresets['A'].lookAt);
    }

    // Hide loader
    loaderEl.classList.add('hidden');
    setTimeout(() => { loaderEl.style.display = 'none'; }, 600);
    updateActiveButton('A');
  },
  (progress) => {
    if (progress.total > 0) {
      const pct = (progress.loaded / progress.total) * 100;
      loaderBar.style.width = pct + '%';
    }
  },
  (err) => {
    console.error('Failed to load GLB:', err);
    document.getElementById('loader-text').textContent = 'Failed to load model';
  }
);

// ── Helpers ────────────────────────────────────────────
function syncYawPitch(lookAtTarget) {
  const dir = new THREE.Vector3().subVectors(lookAtTarget, camera.position).normalize();
  yaw = Math.atan2(-dir.x, -dir.z);
  pitch = Math.asin(THREE.MathUtils.clamp(dir.y, -1, 1));
}

function getLookDirection() {
  return new THREE.Vector3(
    -Math.sin(yaw) * Math.cos(pitch),
    Math.sin(pitch),
    -Math.cos(yaw) * Math.cos(pitch)
  );
}

function flyTo(key) {
  const preset = cameraPresets[key];
  if (!preset) return;
  targetPosition = preset.position.clone();
  targetLookAt = preset.lookAt.clone();
  isTransitioning = true;
  updateActiveButton(key);
}

function updateActiveButton(key) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.cam === key);
  });
}

// ── Nav buttons ────────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => flyTo(btn.dataset.cam));
});

// ── Info panel ─────────────────────────────────────────
const infoPanel = document.getElementById('info-panel');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-desc');

function showInfo(installation) {
  infoTitle.textContent = installation.title;
  infoDesc.textContent = installation.description;
  infoPanel.classList.add('open');
}

document.getElementById('info-close').addEventListener('click', () => {
  infoPanel.classList.remove('open');
});

// ── Mouse-look ─────────────────────────────────────────
const canvas = renderer.domElement;
const SENSITIVITY = 0.003;
const PITCH_LIMIT = THREE.MathUtils.degToRad(60);

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  prevMouse.x = e.clientX;
  prevMouse.y = e.clientY;
});

window.addEventListener('mouseup', () => { isDragging = false; });

window.addEventListener('mousemove', (e) => {
  // Crosshair hover check
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  if (!isDragging) return;

  const dx = e.clientX - prevMouse.x;
  const dy = e.clientY - prevMouse.y;
  prevMouse.x = e.clientX;
  prevMouse.y = e.clientY;

  if (isTransitioning) return;

  yaw -= dx * SENSITIVITY;
  pitch -= dy * SENSITIVITY;
  pitch = THREE.MathUtils.clamp(pitch, -PITCH_LIMIT, PITCH_LIMIT);
});

// ── Click-to-navigate (raycaster) ──────────────────────
canvas.addEventListener('click', (e) => {
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(sceneMeshes, false);

  if (hits.length > 0) {
    let obj = hits[0].object;
    // Walk up parent chain looking for an Installation match
    while (obj) {
      for (const meshName in INSTALLATIONS) {
        if (obj.name.startsWith(meshName) || obj.name === meshName) {
          const inst = INSTALLATIONS[meshName];
          flyTo(inst.cam);
          showInfo(inst);
          return;
        }
      }
      obj = obj.parent;
    }
  }
});

// ── Crosshair hover state ──────────────────────────────
const crosshair = document.getElementById('crosshair');
let hoveredInstallation = false;

function updateCrosshair() {
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(sceneMeshes, false);
  let found = false;

  if (hits.length > 0) {
    let obj = hits[0].object;
    while (obj) {
      for (const meshName in INSTALLATIONS) {
        if (obj.name.startsWith(meshName) || obj.name === meshName) {
          found = true;
          break;
        }
      }
      if (found) break;
      obj = obj.parent;
    }
  }

  if (found !== hoveredInstallation) {
    hoveredInstallation = found;
    crosshair.classList.toggle('active', found);
    canvas.style.cursor = found ? 'pointer' : '';
  }
}

// ── Window resize ──────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ── Animation loop ─────────────────────────────────────
const LERP_FACTOR = 0.05;
const ARRIVE_THRESHOLD = 0.05;

function animate() {
  requestAnimationFrame(animate);

  if (isTransitioning && targetPosition) {
    camera.position.lerp(targetPosition, LERP_FACTOR);

    if (camera.position.distanceTo(targetPosition) < ARRIVE_THRESHOLD) {
      camera.position.copy(targetPosition);
      syncYawPitch(targetLookAt);
      isTransitioning = false;
      targetPosition = null;
      targetLookAt = null;
    } else {
      // During transition, smoothly look toward target
      const currentLookAt = camera.position.clone().add(getLookDirection());
      currentLookAt.lerp(targetLookAt, LERP_FACTOR);
      camera.lookAt(currentLookAt);
      // Keep yaw/pitch in sync with the interpolated look
      syncYawPitch(currentLookAt);
    }
  } else {
    // Free mouse-look
    const dir = getLookDirection();
    camera.lookAt(camera.position.clone().add(dir));
  }

  updateCrosshair();
  renderer.render(scene, camera);
}

animate();
