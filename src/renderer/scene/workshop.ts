import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Workshop {
  group: THREE.Group;
  private loader = new GLTFLoader();

  constructor() {
    this.group = new THREE.Group();
    this.buildFloorFallback();
    this.buildWallsFallback();
    this.buildCeilingFallback();
    this.buildWorkstations();

    // Load Meshy-generated GLB models (replace fallbacks when loaded)
    this.loadFloor();
    this.loadWalls();
    this.loadCeiling();
  }

  // --- GLB loaders ---

  private async loadFloor() {
    try {
      const gltf = await this.loader.loadAsync('/models/room/floor.glb');
      const model = gltf.scene;

      // Scale to cover the 30x20 floor area
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scaleX = 30 / size.x;
      const scaleZ = 20 / size.z;
      const scale = Math.max(scaleX, scaleZ);
      model.scale.setScalar(scale);

      // Position on the ground plane
      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= scaledBox.min.y;

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.receiveShadow = true;
        }
      });

      // Remove fallback floor and grid (first 2 children)
      this.removeFallback('floor');
      this.group.add(model);
      console.log('Loaded Meshy floor model');
    } catch (e) {
      console.warn('Failed to load floor GLB, keeping fallback:', e);
    }
  }

  private async loadWalls() {
    try {
      const gltf = await this.loader.loadAsync('/models/room/wall.glb');

      // Back wall: scale to 30 wide x 8 tall
      const backModel = gltf.scene.clone();
      const box = new THREE.Box3().setFromObject(backModel);
      const size = box.getSize(new THREE.Vector3());
      const scaleX = 30 / size.x;
      const scaleY = 8 / size.y;
      backModel.scale.set(scaleX, scaleY, scaleX);

      const scaledBox = new THREE.Box3().setFromObject(backModel);
      const center = scaledBox.getCenter(new THREE.Vector3());
      backModel.position.x -= center.x;
      backModel.position.y -= scaledBox.min.y;
      backModel.position.z = -10;

      backModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Left wall: scale to 20 wide x 8 tall
      const leftModel = gltf.scene.clone();
      const leftScaleX = 20 / size.x;
      const leftScaleY = 8 / size.y;
      leftModel.scale.set(leftScaleX, leftScaleY, leftScaleX);

      const leftBox = new THREE.Box3().setFromObject(leftModel);
      const leftCenter = leftBox.getCenter(new THREE.Vector3());
      leftModel.position.z -= leftCenter.z;
      leftModel.position.y -= leftBox.min.y;
      leftModel.position.x = -15;
      leftModel.rotation.y = Math.PI / 2;

      leftModel.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.removeFallback('walls');
      this.group.add(backModel);
      this.group.add(leftModel);

      // Keep right wall as transparent glass window
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
      rightWall.userData.tag = 'glass-wall';
      this.group.add(rightWall);

      console.log('Loaded Meshy wall models');
    } catch (e) {
      console.warn('Failed to load wall GLB, keeping fallback:', e);
    }
  }

  private async loadCeiling() {
    try {
      const gltf = await this.loader.loadAsync('/models/room/ceiling.glb');
      const model = gltf.scene;

      // Scale to cover 30x20 ceiling
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const scaleX = 30 / size.x;
      const scaleZ = 20 / size.z;
      const scale = Math.max(scaleX, scaleZ);
      model.scale.setScalar(scale);

      // Position at ceiling height
      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y = 8 - scaledBox.min.y * (1 / scale) * scale;

      // Flip upside down so detail faces downward
      model.rotation.x = Math.PI;
      model.position.y = 8;

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.receiveShadow = true;
        }
      });

      this.removeFallback('ceiling');
      this.group.add(model);
      console.log('Loaded Meshy ceiling model');
    } catch (e) {
      console.warn('Failed to load ceiling GLB, keeping fallback:', e);
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

  private buildWorkstations() {
    const deskMaterial = new THREE.MeshStandardMaterial({
      color: 0x2a2a4a,
      metalness: 0.5,
      roughness: 0.5,
    });

    const positions = [
      { x: -10, z: -6, label: 'UI Architect' },
      { x: -6, z: -6, label: 'Backend Engineer' },
      { x: -2, z: -6, label: 'Test Writer' },
      { x: 10, z: -6, label: 'Trello Attacker' },
      { x: 6, z: -6, label: 'Mobile Optimizer' },
      { x: 2, z: -6, label: 'Q&A Gatekeeper' },
    ];

    for (const pos of positions) {
      const desk = new THREE.Mesh(
        new THREE.BoxGeometry(3, 1, 1.5),
        deskMaterial
      );
      desk.position.set(pos.x, 1, pos.z);
      desk.castShadow = true;
      desk.receiveShadow = true;
      this.group.add(desk);

      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 1, 0.1),
        new THREE.MeshStandardMaterial({
          color: 0x0a0a1a,
          emissive: 0x003333,
          emissiveIntensity: 0.5,
        })
      );
      monitor.position.set(pos.x, 2.2, pos.z - 0.7);
      this.group.add(monitor);
    }

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
