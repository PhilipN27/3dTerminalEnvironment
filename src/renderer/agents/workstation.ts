import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AgentConfig } from '../../shared/agent-config';
import { RobotState } from './agent-manager';

export class Workstation {
  group: THREE.Group;
  private light: THREE.PointLight;
  private color: string;
  private state: RobotState = 'idle';
  private modelLoaded = false;
  private baseMaterials: { mat: THREE.MeshStandardMaterial; baseEmissive: number }[] = [];

  // Placeholder parts
  private screenMaterial: THREE.MeshStandardMaterial;
  private deskMesh: THREE.Mesh | null = null;
  private screenMesh: THREE.Mesh | null = null;

  constructor(config: AgentConfig, position: THREE.Vector3) {
    this.group = new THREE.Group();
    this.color = config.color;

    // Point light for ambient glow
    this.light = new THREE.PointLight(config.color, 0.3, 8);
    this.light.position.set(0, 3, 0);
    this.group.add(this.light);

    // Placeholder screen
    this.screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      emissive: config.color,
      emissiveIntensity: 0.1,
    });
    this.screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      this.screenMaterial
    );
    this.screenMesh.position.set(0, 2, -0.7);
    this.group.add(this.screenMesh);

    // Placeholder desk
    const deskMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.6,
      roughness: 0.4,
    });
    this.deskMesh = new THREE.Mesh(
      new THREE.BoxGeometry(2, 0.1, 1),
      deskMaterial
    );
    this.deskMesh.position.set(0, 1, -0.3);
    this.group.add(this.deskMesh);

    this.group.position.copy(position);
  }

  async loadModel(modelPath: string) {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync(modelPath);

      // Remove placeholder geometry (keep the light)
      if (this.screenMesh) {
        this.group.remove(this.screenMesh);
        this.screenMesh = null;
      }
      if (this.deskMesh) {
        this.group.remove(this.deskMesh);
        this.deskMesh = null;
      }

      const model = gltf.scene;

      // Auto-scale: normalize to roughly 3 units tall (workstations are bigger than robots)
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 3.5;
      const scale = targetSize / maxDim;
      model.scale.setScalar(scale);

      // Center horizontally and place on ground
      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= scaledBox.min.y;

      // Enable shadows and collect emissive materials for state switching
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
          const mesh = child as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of materials) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              // Store base emissive for state switching
              const baseEmissive = mat.emissiveIntensity || 0.1;
              mat.userData.baseEmissive = baseEmissive;
              this.baseMaterials.push({ mat, baseEmissive });
            }
          }
        }
      });

      this.group.add(model);
      this.modelLoaded = true;

      // Update light position to be above the model
      const modelTop = scaledBox.max.y * scale;
      this.light.position.set(0, modelTop + 1, 0);

      console.log(`Loaded workstation: ${modelPath}`);
    } catch (e) {
      console.warn(`Failed to load workstation ${modelPath}, keeping placeholder:`, e);
    }
  }

  setState(state: RobotState) {
    this.state = state;

    // Light intensity
    switch (state) {
      case 'idle':
        this.light.intensity = 0.3;
        break;
      case 'active':
        this.light.intensity = 2.0;
        break;
      case 'complete':
        this.light.intensity = 3.0;
        break;
    }

    if (!this.modelLoaded) {
      // Placeholder screen glow
      switch (state) {
        case 'idle':
          this.screenMaterial.emissiveIntensity = 0.1;
          break;
        case 'active':
          this.screenMaterial.emissiveIntensity = 1.0;
          break;
        case 'complete':
          this.screenMaterial.emissiveIntensity = 1.5;
          break;
      }
    } else {
      // GLB model material glow
      for (const { mat, baseEmissive } of this.baseMaterials) {
        switch (state) {
          case 'idle':
            mat.emissiveIntensity = baseEmissive;
            break;
          case 'active':
            mat.emissiveIntensity = baseEmissive * 3;
            break;
          case 'complete':
            mat.emissiveIntensity = baseEmissive * 5;
            break;
        }
      }
    }
  }
}
