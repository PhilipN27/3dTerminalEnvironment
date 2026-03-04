import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { AgentConfig } from '../../shared/agent-config';
import { RobotState } from './agent-manager';

export class Robot {
  group: THREE.Group;
  private state: RobotState = 'idle';
  private idleTime = 0;
  private activeTime = 0;
  private baseY: number;
  private modelLoaded = false;
  private mixer: THREE.AnimationMixer | null = null;
  private animationActions: { idle?: THREE.AnimationAction; active?: THREE.AnimationAction; complete?: THREE.AnimationAction } = {};
  private currentAction: THREE.AnimationAction | null = null;
  private accentColor: string;

  // Placeholder parts (used until GLB loads)
  private headMesh: THREE.Mesh | null = null;
  private bodyMesh: THREE.Mesh | null = null;
  private eyeMaterial: THREE.MeshStandardMaterial;

  constructor(config: AgentConfig, position: THREE.Vector3) {
    this.group = new THREE.Group();
    this.baseY = position.y;
    this.accentColor = config.color;

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.2,
    });

    // Build placeholder geometry
    this.buildPlaceholder(config);

    this.group.position.copy(position);
  }

  private buildPlaceholder(config: AgentConfig) {
    const bodyColor = new THREE.Color(config.color).multiplyScalar(0.3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.7,
      roughness: 0.3,
    });

    this.bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.5),
      bodyMaterial
    );
    this.bodyMesh.position.y = 1.6;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    this.headMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.5),
      bodyMaterial
    );
    this.headMesh.position.y = 2.6;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.08), this.eyeMaterial);
    leftEye.position.set(-0.15, 2.65, 0.26);
    this.group.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.08), this.eyeMaterial);
    rightEye.position.set(0.15, 2.65, 0.26);
    this.group.add(rightEye);

    const armMaterial = bodyMaterial.clone();
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), armMaterial);
    leftArm.position.set(-0.6, 1.6, 0);
    this.group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.8, 0.2), armMaterial);
    rightArm.position.set(0.6, 1.6, 0);
    this.group.add(rightArm);

    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), armMaterial);
    leftLeg.position.set(-0.2, 0.5, 0);
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.8, 0.25), armMaterial);
    rightLeg.position.set(0.2, 0.5, 0);
    this.group.add(rightLeg);
  }

  async loadModel(modelPath: string) {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync(modelPath);

      // Remove placeholder geometry
      while (this.group.children.length > 0) {
        this.group.remove(this.group.children[0]);
      }

      const model = gltf.scene;

      // Auto-scale: normalize the model to roughly 2.5 units tall
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetHeight = 2.5;
      const scale = targetHeight / maxDim;
      model.scale.setScalar(scale);

      // Center the model horizontally and place feet on ground
      const scaledBox = new THREE.Box3().setFromObject(model);
      const center = scaledBox.getCenter(new THREE.Vector3());
      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= scaledBox.min.y;

      // Enable shadows on all meshes
      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      this.group.add(model);
      this.modelLoaded = true;

      // Setup animation mixer — map by index: 0=idle, 1=active, 2=complete
      if (gltf.animations.length > 0) {
        this.mixer = new THREE.AnimationMixer(model);
        const stateNames: (keyof typeof this.animationActions)[] = ['idle', 'active', 'complete'];
        for (let i = 0; i < gltf.animations.length && i < 3; i++) {
          const action = this.mixer.clipAction(gltf.animations[i]);
          this.animationActions[stateNames[i]] = action;
        }
        // Start with idle
        if (this.animationActions.idle) {
          this.animationActions.idle.play();
          this.currentAction = this.animationActions.idle;
        }
      }

      console.log(`Loaded model: ${modelPath} (${gltf.animations.length} animations)`);
    } catch (e) {
      console.warn(`Failed to load model ${modelPath}, keeping placeholder:`, e);
    }
  }

  setState(state: RobotState) {
    this.state = state;

    if (!this.modelLoaded) {
      // Placeholder eye glow
      switch (state) {
        case 'idle':
          this.eyeMaterial.emissiveIntensity = 0.2;
          break;
        case 'active':
          this.eyeMaterial.emissiveIntensity = 1.5;
          this.activeTime = 0;
          break;
        case 'complete':
          this.eyeMaterial.emissiveIntensity = 2.0;
          break;
      }
    } else {
      // Crossfade to the matching animation
      const nextAction = this.animationActions[state];
      if (nextAction && nextAction !== this.currentAction) {
        if (this.currentAction) {
          this.currentAction.fadeOut(0.3);
        }
        nextAction.reset().fadeIn(0.3).play();
        this.currentAction = nextAction;
      }

      // Adjust emissive intensity on all materials
      this.group.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          for (const mat of materials) {
            if (mat instanceof THREE.MeshStandardMaterial) {
              switch (state) {
                case 'idle':
                  mat.emissiveIntensity = mat.userData.baseEmissive ?? 0.1;
                  break;
                case 'active':
                  mat.emissiveIntensity = (mat.userData.baseEmissive ?? 0.1) * 3;
                  break;
                case 'complete':
                  mat.emissiveIntensity = (mat.userData.baseEmissive ?? 0.1) * 5;
                  break;
              }
            }
          }
        }
      });

      if (state === 'active') {
        this.activeTime = 0;
      }
    }
  }

  update(delta: number) {
    this.idleTime += delta;

    // Update animation mixer for GLB models
    if (this.mixer) {
      this.mixer.update(delta);
    }

    if (!this.modelLoaded) {
      // Placeholder animations
      if (this.state === 'idle') {
        this.group.position.y = this.baseY + Math.sin(this.idleTime * 1.5) * 0.05;
        if (this.headMesh) this.headMesh.rotation.y = Math.sin(this.idleTime * 0.5) * 0.1;
      } else if (this.state === 'active') {
        this.activeTime += delta;
        this.group.position.y = this.baseY + Math.sin(this.activeTime * 3) * 0.08;
        if (this.headMesh) this.headMesh.rotation.y = Math.sin(this.activeTime * 2) * 0.3;
        if (this.bodyMesh) this.bodyMesh.rotation.z = Math.sin(this.activeTime * 4) * 0.05;
        const leftArm = this.group.children[4] as THREE.Mesh;
        const rightArm = this.group.children[5] as THREE.Mesh;
        if (leftArm) leftArm.rotation.x = Math.sin(this.activeTime * 5) * 0.4;
        if (rightArm) rightArm.rotation.x = Math.sin(this.activeTime * 5 + Math.PI) * 0.4;
      } else if (this.state === 'complete') {
        const scale = 1 + Math.sin(this.idleTime * 8) * 0.05;
        this.group.scale.setScalar(scale);
      }
    } else {
      // GLB model animations
      if (this.state === 'idle') {
        // Gentle hover
        this.group.position.y = this.baseY + Math.sin(this.idleTime * 1.5) * 0.03;
        this.group.rotation.y = Math.sin(this.idleTime * 0.3) * 0.05;
      } else if (this.state === 'active') {
        this.activeTime += delta;
        // More energetic movement
        this.group.position.y = this.baseY + Math.sin(this.activeTime * 3) * 0.06;
        this.group.rotation.y = Math.sin(this.activeTime * 2) * 0.15;
      } else if (this.state === 'complete') {
        const scale = 1 + Math.sin(this.idleTime * 8) * 0.03;
        this.group.scale.setScalar(scale);
      }
    }
  }
}
