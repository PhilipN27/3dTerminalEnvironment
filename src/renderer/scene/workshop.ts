import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const ROOM_WIDTH = 30;
const ROOM_DEPTH = 20;
const ROOM_HEIGHT = 8;
const PANEL_SIZE = 5;

export class Workshop {
  group: THREE.Group;
  private loader = new GLTFLoader();

  constructor() {
    this.group = new THREE.Group();
    this.group.userData.selectable = false;
    this.buildFloorFallback();
    this.buildWallsFallback();
    this.buildCeilingFallback();

    this.loadFloorPanels();
    this.loadWallPanels();
    this.loadCeilingPanels();
    this.loadCeilingLights();
  }

  // --- GLB panel loaders ---

  private preparePanelTemplate(source: THREE.Object3D, targetSize: number): THREE.Object3D {
    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.z);
    const scale = targetSize / maxDim;
    source.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(source);
    const center = scaledBox.getCenter(new THREE.Vector3());
    source.position.sub(center);

    source.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    return source;
  }

  private async loadFloorPanels() {
    try {
      const gltf = await this.loader.loadAsync('/models/room/floor-panel.glb');
      const template = this.preparePanelTemplate(gltf.scene, PANEL_SIZE);

      const cols = Math.ceil(ROOM_WIDTH / PANEL_SIZE);
      const rows = Math.ceil(ROOM_DEPTH / PANEL_SIZE);
      const startX = -(cols * PANEL_SIZE) / 2 + PANEL_SIZE / 2;
      const startZ = -(rows * PANEL_SIZE) / 2 + PANEL_SIZE / 2;

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const panel = template.clone();
          panel.position.set(
            startX + col * PANEL_SIZE,
            0,
            startZ + row * PANEL_SIZE,
          );
          panel.userData.selectable = true;
          panel.name = `floor-panel-${col}-${row}`;
          this.group.add(panel);
        }
      }

      this.removeFallback('floor');
      console.log(`Tiled ${cols * rows} floor panels`);
    } catch (e) {
      console.warn('Failed to load floor-panel GLB, keeping fallback:', e);
    }
  }

  // Build a mirrored full tile from a half-tile GLB
  // Returns a group containing left half + mirrored right half, sized to targetWidth x targetHeight
  private buildMirroredWallTile(source: THREE.Object3D, targetWidth: number, targetHeight: number): THREE.Group {
    const halfWidth = targetWidth / 2;

    const box = new THREE.Box3().setFromObject(source);
    const size = box.getSize(new THREE.Vector3());

    // Scale half-tile to fit half the target width and full height
    const scaleX = halfWidth / size.x;
    const scaleY = targetHeight / size.y;
    const scaleZ = halfWidth / Math.max(size.x, size.z);

    // Left half
    const leftHalf = source.clone();
    leftHalf.scale.set(scaleX, scaleY, scaleZ);
    const leftBox = new THREE.Box3().setFromObject(leftHalf);
    const leftCenter = leftBox.getCenter(new THREE.Vector3());
    leftHalf.position.set(-halfWidth / 2 - leftCenter.x, -leftCenter.y, -leftCenter.z);

    // Right half (mirrored on X)
    const rightHalf = source.clone();
    rightHalf.scale.set(-scaleX, scaleY, scaleZ); // negative X = mirror
    const rightBox = new THREE.Box3().setFromObject(rightHalf);
    const rightCenter = rightBox.getCenter(new THREE.Vector3());
    rightHalf.position.set(halfWidth / 2 - rightCenter.x, -rightCenter.y, -rightCenter.z);

    const tile = new THREE.Group();
    tile.add(leftHalf);
    tile.add(rightHalf);

    tile.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    tile.userData.selectable = true;
    return tile;
  }

  private async loadWallPanels() {
    try {
      const gltf = await this.loader.loadAsync('/models/room/wall-panel.glb');

      const hCols = Math.ceil(ROOM_WIDTH / PANEL_SIZE);  // 6
      const vRows = 2;
      const wallRowHeight = ROOM_HEIGHT / vRows;          // 4
      const dCols = Math.ceil(ROOM_DEPTH / PANEL_SIZE);   // 4

      const tileTemplate = this.buildMirroredWallTile(gltf.scene, PANEL_SIZE, wallRowHeight);

      const placeWall = (
        cols: number,
        getPosition: (col: number, row: number) => THREE.Vector3,
        rotationY: number,
        wallName: string,
      ) => {
        for (let col = 0; col < cols; col++) {
          for (let row = 0; row < vRows; row++) {
            const tile = tileTemplate.clone();
            tile.position.copy(getPosition(col, row));
            tile.rotation.y = rotationY;
            tile.userData.selectable = true;
            tile.name = `${wallName}-panel-${col}-${row}`;
            this.group.add(tile);
          }
        }
      };

      // Back wall (z = -ROOM_DEPTH/2)
      placeWall(hCols, (col, row) => new THREE.Vector3(
        -ROOM_WIDTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE,
        wallRowHeight / 2 + row * wallRowHeight,
        -ROOM_DEPTH / 2,
      ), 0, 'back-wall');

      // Left wall (x = -ROOM_WIDTH/2)
      placeWall(dCols, (col, row) => new THREE.Vector3(
        -ROOM_WIDTH / 2,
        wallRowHeight / 2 + row * wallRowHeight,
        -ROOM_DEPTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE,
      ), Math.PI / 2, 'left-wall');

      // Right wall (x = ROOM_WIDTH/2)
      placeWall(dCols, (col, row) => new THREE.Vector3(
        ROOM_WIDTH / 2,
        wallRowHeight / 2 + row * wallRowHeight,
        -ROOM_DEPTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE,
      ), -Math.PI / 2, 'right-wall');

      // Front wall (z = ROOM_DEPTH/2)
      placeWall(hCols, (col, row) => new THREE.Vector3(
        -ROOM_WIDTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE,
        wallRowHeight / 2 + row * wallRowHeight,
        ROOM_DEPTH / 2,
      ), Math.PI, 'front-wall');

      this.removeFallback('walls');
      const total = (hCols * 2 + dCols * 2) * vRows;
      console.log(`Tiled ${total} mirrored wall panels`);
    } catch (e) {
      console.warn('Failed to load wall-panel GLB, keeping fallback:', e);
    }
  }

  private async loadCeilingPanels() {
    try {
      const gltf = await this.loader.loadAsync('/models/room/ceiling-panel.glb');
      const template = this.preparePanelTemplate(gltf.scene, PANEL_SIZE);

      const cols = Math.ceil(ROOM_WIDTH / PANEL_SIZE);
      const rows = Math.ceil(ROOM_DEPTH / PANEL_SIZE);
      const startX = -(cols * PANEL_SIZE) / 2 + PANEL_SIZE / 2;
      const startZ = -(rows * PANEL_SIZE) / 2 + PANEL_SIZE / 2;

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const panel = template.clone();
          panel.position.set(
            startX + col * PANEL_SIZE,
            ROOM_HEIGHT,
            startZ + row * PANEL_SIZE,
          );
          panel.rotation.x = Math.PI;
          panel.userData.selectable = true;
          panel.name = `ceiling-panel-${col}-${row}`;
          this.group.add(panel);
        }
      }

      this.removeFallback('ceiling');
      console.log(`Tiled ${cols * rows} ceiling panels`);
    } catch (e) {
      console.warn('Failed to load ceiling-panel GLB, keeping fallback:', e);
    }
  }

  private async loadCeilingLights() {
    // Load both fixture types
    const [stripResult, cageResult] = await Promise.allSettled([
      this.loader.loadAsync('/models/room/ceiling-strip-light.glb'),
      this.loader.loadAsync('/models/room/ceiling-cage-light.glb'),
    ]);

    // --- Strip lights: 2 rows running along the room length ---
    if (stripResult.status === 'fulfilled') {
      const template = stripResult.value.scene;
      const box = new THREE.Box3().setFromObject(template);
      const size = box.getSize(new THREE.Vector3());
      const targetLength = 4;
      const scale = targetLength / Math.max(size.x, size.z);
      template.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(template);
      const center = scaledBox.getCenter(new THREE.Vector3());
      template.position.sub(center);
      template.rotation.x = Math.PI; // face downward flush against ceiling

      // Two rows of strip lights at x = -7 and x = 7
      const stripPositionsZ = [-7.5, -2.5, 2.5, 7.5];
      const stripRows = [-7, 7];

      for (const x of stripRows) {
        for (const z of stripPositionsZ) {
          const light = template.clone();
          light.position.set(x, ROOM_HEIGHT, z);
          light.userData.selectable = true;
          light.name = `strip-light-${x}-${z}`;
          this.group.add(light);
        }
      }

      // Only 2 point lights for the strip rows (one per row, centered)
      for (const x of stripRows) {
        const pointLight = new THREE.PointLight(0xccddff, 3, 25);
        pointLight.position.set(x, ROOM_HEIGHT - 1, 0);
        this.group.add(pointLight);
      }
      console.log(`Placed ${stripRows.length * stripPositionsZ.length} strip lights, 2 point lights`);
    } else {
      console.warn('Failed to load strip light GLB:', stripResult.reason);
    }

    // --- Cage lights: above each workstation and center ---
    if (cageResult.status === 'fulfilled') {
      const template = cageResult.value.scene;
      const box = new THREE.Box3().setFromObject(template);
      const size = box.getSize(new THREE.Vector3());
      const targetSize = 1.5;
      const scale = targetSize / Math.max(size.x, size.y, size.z);
      template.scale.setScalar(scale);

      const scaledBox = new THREE.Box3().setFromObject(template);
      const center = scaledBox.getCenter(new THREE.Vector3());
      template.position.sub(center);
      template.rotation.x = Math.PI; // face downward flush against ceiling

      // Place above each agent workstation + center terminal
      const cagePositions = [
        { x: -13, z: -6 },  // ui-architect
        { x: -13, z: 0 },   // backend-engineer
        { x: -13, z: 6 },   // test-writer
        { x: 13, z: -6 },   // trello-attacker
        { x: 13, z: 0 },    // mobile-optimizer
        { x: 13, z: 6 },    // qa-gatekeeper
        { x: 0, z: -8 },    // terminal area
        { x: 0, z: 0 },     // room center
      ];

      for (const pos of cagePositions) {
        const cage = template.clone();
        cage.position.set(pos.x, ROOM_HEIGHT, pos.z);
        cage.userData.selectable = true;
        cage.name = `cage-light-${pos.x}-${pos.z}`;
        this.group.add(cage);
      }

      // Only 4 point lights for cage areas (left wall, right wall, terminal, center)
      const cageLightPositions = [
        { x: -13, z: 0 },   // left wall center
        { x: 13, z: 0 },    // right wall center
        { x: 0, z: -8 },    // terminal
        { x: 0, z: 0 },     // room center
      ];
      for (const pos of cageLightPositions) {
        const pointLight = new THREE.PointLight(0xffcc88, 3, 18);
        pointLight.position.set(pos.x, ROOM_HEIGHT - 1.5, pos.z);
        this.group.add(pointLight);
      }
      console.log(`Placed ${cagePositions.length} cage lights, 4 point lights`);
    } else {
      console.warn('Failed to load cage light GLB:', cageResult.reason);
    }
  }

  // --- Fallback removal ---

  private removeFallback(tag: string) {
    const toRemove: THREE.Object3D[] = [];
    this.group.traverse((child) => {
      if (child.userData.tag === tag) {
        toRemove.push(child);
      }
    });
    for (const obj of toRemove) {
      obj.parent?.remove(obj);
    }
  }

  // --- Fallback procedural geometry (shown while GLBs load) ---

  private buildFloorFallback() {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.6,
        metalness: 0.4,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.userData.tag = 'floor';
    this.group.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x00ffff, 0x0a0a1a);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.15;
    (grid.material as THREE.Material).transparent = true;
    grid.userData.tag = 'floor';
    this.group.add(grid);
  }

  private buildWallsFallback() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x15152a,
      roughness: 0.7,
      metalness: 0.3,
    });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), wallMaterial);
    backWall.position.set(0, 4, -10);
    backWall.userData.tag = 'walls';
    this.group.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial);
    leftWall.position.set(-15, 4, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.userData.tag = 'walls';
    this.group.add(leftWall);

    const windowMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a3e,
      roughness: 0.1,
      metalness: 0.9,
      transparent: true,
      opacity: 0.3,
    });
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), windowMaterial);
    rightWall.position.set(15, 4, 0);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.userData.tag = 'walls';
    this.group.add(rightWall);
  }

  private buildCeilingFallback() {
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({
        color: 0x0f0f1e,
        roughness: 0.9,
      })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
    ceiling.userData.tag = 'ceiling';
    this.group.add(ceiling);

    const beamMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      metalness: 0.6,
    });
    for (let i = -12; i <= 12; i += 6) {
      const beam = new THREE.Mesh(
        new THREE.BoxGeometry(0.3, 0.5, 20),
        beamMaterial
      );
      beam.position.set(i, 7.75, 0);
      beam.userData.tag = 'ceiling';
      this.group.add(beam);
    }
  }

}
