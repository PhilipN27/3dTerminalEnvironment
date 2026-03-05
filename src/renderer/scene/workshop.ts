import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ROOM_WIDTH = 30;
const ROOM_DEPTH = 20;
const ROOM_HEIGHT = 8;
const PANEL_SIZE = 5; // each panel ~5x5 units

export class Workshop {
  group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    // Start with placeholder geometry, then overlay GLB panels
    this.buildPlaceholderFloor();
    this.buildPlaceholderWalls();
    this.buildPlaceholderCeiling();
    this.buildTerminalDesk();

    // Load GLB panels (will hide placeholders on success)
    this.loadPanels();
  }

  // --- GLB Panel Tiling ---

  private async loadPanels() {
    const loader = new GLTFLoader();

    const [floorGltf, wallGltf, ceilingGltf] = await Promise.allSettled([
      loader.loadAsync('/models/room/floor-panel.glb'),
      loader.loadAsync('/models/room/wall-panel.glb'),
      loader.loadAsync('/models/room/ceiling-panel.glb'),
    ]);

    if (floorGltf.status === 'fulfilled') {
      this.tileFloor(floorGltf.value.scene);
      this.removePlaceholder('floor');
    } else {
      console.warn('Floor panel GLB not found, keeping placeholder');
    }

    if (wallGltf.status === 'fulfilled') {
      this.tileWalls(wallGltf.value.scene);
      this.removePlaceholder('walls');
    } else {
      console.warn('Wall panel GLB not found, keeping placeholder');
    }

    if (ceilingGltf.status === 'fulfilled') {
      this.tileCeiling(ceilingGltf.value.scene);
      this.removePlaceholder('ceiling');
    } else {
      console.warn('Ceiling panel GLB not found, keeping placeholder');
    }
  }

  private preparePanelTemplate(source: THREE.Object3D, targetSize: number): THREE.Object3D {
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.z);
    const scale = targetSize / maxDim;
    source.scale.setScalar(scale);

    // Center the panel at origin
    const scaledBox = new THREE.Box3().setFromObject(source);
    const center = scaledBox.getCenter(new THREE.Vector3());
    source.position.sub(center);

    // Enable shadows on all meshes
    source.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return source;
  }

  private clonePanel(template: THREE.Object3D): THREE.Object3D {
    return template.clone();
  }

  private tileFloor(source: THREE.Object3D) {
    const template = this.preparePanelTemplate(source, PANEL_SIZE);
    const cols = Math.ceil(ROOM_WIDTH / PANEL_SIZE);  // 6
    const rows = Math.ceil(ROOM_DEPTH / PANEL_SIZE);  // 4
    const startX = -(cols * PANEL_SIZE) / 2 + PANEL_SIZE / 2;
    const startZ = -(rows * PANEL_SIZE) / 2 + PANEL_SIZE / 2;

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const panel = this.clonePanel(template);
        panel.position.set(
          startX + col * PANEL_SIZE,
          0,
          startZ + row * PANEL_SIZE,
        );
        panel.userData.panelType = 'floor-glb';
        this.group.add(panel);
      }
    }
    console.log(`Tiled ${cols * rows} floor panels`);
  }

  private tileWalls(source: THREE.Object3D) {
    const template = this.preparePanelTemplate(source, PANEL_SIZE);
    const hCols = Math.ceil(ROOM_WIDTH / PANEL_SIZE);  // 6
    const vRows = Math.ceil(ROOM_HEIGHT / PANEL_SIZE);  // 2
    const dCols = Math.ceil(ROOM_DEPTH / PANEL_SIZE);   // 4

    // Back wall (z = -ROOM_DEPTH/2)
    for (let col = 0; col < hCols; col++) {
      for (let row = 0; row < vRows; row++) {
        const panel = this.clonePanel(template);
        const x = -ROOM_WIDTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE;
        const y = PANEL_SIZE / 2 + row * PANEL_SIZE;
        panel.position.set(x, y, -ROOM_DEPTH / 2);
        panel.userData.panelType = 'wall-glb';
        this.group.add(panel);
      }
    }

    // Left wall (x = -ROOM_WIDTH/2), rotated 90 degrees
    for (let col = 0; col < dCols; col++) {
      for (let row = 0; row < vRows; row++) {
        const panel = this.clonePanel(template);
        const z = -ROOM_DEPTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE;
        const y = PANEL_SIZE / 2 + row * PANEL_SIZE;
        panel.position.set(-ROOM_WIDTH / 2, y, z);
        panel.rotation.y = Math.PI / 2;
        panel.userData.panelType = 'wall-glb';
        this.group.add(panel);
      }
    }

    // Right wall stays transparent (window) — no panels
    console.log(`Tiled ${hCols * vRows + dCols * vRows} wall panels`);
  }

  private tileCeiling(source: THREE.Object3D) {
    const template = this.preparePanelTemplate(source, PANEL_SIZE);
    const cols = Math.ceil(ROOM_WIDTH / PANEL_SIZE);  // 6
    const rows = Math.ceil(ROOM_DEPTH / PANEL_SIZE);  // 4
    const startX = -(cols * PANEL_SIZE) / 2 + PANEL_SIZE / 2;
    const startZ = -(rows * PANEL_SIZE) / 2 + PANEL_SIZE / 2;

    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const panel = this.clonePanel(template);
        panel.position.set(
          startX + col * PANEL_SIZE,
          ROOM_HEIGHT,
          startZ + row * PANEL_SIZE,
        );
        panel.userData.panelType = 'ceiling-glb';
        this.group.add(panel);
      }
    }
    console.log(`Tiled ${cols * rows} ceiling panels`);
  }

  // --- Placeholder Geometry (shown until GLBs load) ---

  private removePlaceholder(type: 'floor' | 'walls' | 'ceiling') {
    const toRemove: THREE.Object3D[] = [];
    this.group.traverse((child) => {
      if (child.userData.placeholder === type) {
        toRemove.push(child);
      }
    });
    for (const obj of toRemove) {
      this.group.remove(obj);
    }
  }

  private buildPlaceholderFloor() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.6,
        metalness: 0.4,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.placeholder = 'floor';
    this.group.add(floor);

    const grid = new THREE.GridHelper(ROOM_WIDTH, 30, 0x00ffff, 0x0a0a1a);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.15;
    (grid.material as THREE.Material).transparent = true;
    grid.userData.placeholder = 'floor';
    this.group.add(grid);
  }

  private buildPlaceholderWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x15152a,
      roughness: 0.7,
      metalness: 0.3,
    });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_HEIGHT), wallMaterial);
    backWall.position.set(0, ROOM_HEIGHT / 2, -ROOM_DEPTH / 2);
    backWall.userData.placeholder = 'walls';
    this.group.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), wallMaterial);
    leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.userData.placeholder = 'walls';
    this.group.add(leftWall);

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a3e,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.3,
    });
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), windowMaterial);
    rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.userData.placeholder = 'walls';
    this.group.add(rightWall);
  }

  private buildPlaceholderCeiling() {
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH),
      new THREE.MeshStandardMaterial({
        color: 0x0f0f1e,
        roughness: 0.9,
      })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ROOM_HEIGHT;
    ceiling.userData.placeholder = 'ceiling';
    this.group.add(ceiling);

    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      metalness: 0.6,
    });
    for (let i = -12; i <= 12; i += 6) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, ROOM_DEPTH),
        beamMaterial
      );
      beam.position.set(i, ROOM_HEIGHT - 0.25, 0);
      beam.userData.placeholder = 'ceiling';
      this.group.add(beam);
    }
  }

  // --- Terminal Desk (always present) ---

  private buildTerminalDesk() {
    const terminalDesk = new THREE.Mesh(
      new THREE.BoxGeometry(4, 1.2, 2),
      new THREE.MeshStandardMaterial({
        color: 0x2a2a4a,
        metalness: 0.6,
        roughness: 0.4,
      })
    );
    terminalDesk.position.set(0, 1, 2);
    terminalDesk.castShadow = true;
    this.group.add(terminalDesk);
  }
}
