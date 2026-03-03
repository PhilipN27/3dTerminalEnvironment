import * as THREE from 'three';
import { CameraPreset } from '../../shared/types';

interface CameraPosition {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

const PRESETS: Record<CameraPreset, CameraPosition> = {
  'overview': {
    position: new THREE.Vector3(0, 10, 18),
    lookAt: new THREE.Vector3(0, 2, 0),
  },
  'terminal': {
    position: new THREE.Vector3(0, 4, 6),
    lookAt: new THREE.Vector3(0, 2.5, 2),
  },
  'ui-architect': {
    position: new THREE.Vector3(-10, 4, -2),
    lookAt: new THREE.Vector3(-10, 2, -6),
  },
  'backend-engineer': {
    position: new THREE.Vector3(-6, 4, -2),
    lookAt: new THREE.Vector3(-6, 2, -6),
  },
  'test-writer': {
    position: new THREE.Vector3(-2, 4, -2),
    lookAt: new THREE.Vector3(-2, 2, -6),
  },
  'trello-attacker': {
    position: new THREE.Vector3(10, 4, -2),
    lookAt: new THREE.Vector3(10, 2, -6),
  },
  'mobile-optimizer': {
    position: new THREE.Vector3(6, 4, -2),
    lookAt: new THREE.Vector3(6, 2, -6),
  },
  'qa-gatekeeper': {
    position: new THREE.Vector3(2, 4, -2),
    lookAt: new THREE.Vector3(2, 2, -6),
  },
};

const HOTKEY_MAP: Record<string, CameraPreset> = {
  '1': 'overview',
  '2': 'terminal',
  '3': 'ui-architect',
  '4': 'backend-engineer',
  '5': 'test-writer',
  '6': 'trello-attacker',
  '7': 'mobile-optimizer',
  '8': 'qa-gatekeeper',
};

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private currentPreset: CameraPreset = 'overview';
  private targetPosition: THREE.Vector3;
  private targetLookAt: THREE.Vector3;
  private currentLookAt: THREE.Vector3;
  private isTransitioning = false;
  private transitionSpeed = 3.0;
  autoFollow = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    const preset = PRESETS['overview'];
    this.targetPosition = preset.position.clone();
    this.targetLookAt = preset.lookAt.clone();
    this.currentLookAt = preset.lookAt.clone();
    this.camera.position.copy(preset.position);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.autoFollow = !this.autoFollow;
        return;
      }
      const preset = HOTKEY_MAP[e.key];
      if (preset) {
        this.goTo(preset);
      }
    });
  }

  goTo(preset: CameraPreset) {
    this.currentPreset = preset;
    const target = PRESETS[preset];
    this.targetPosition.copy(target.position);
    this.targetLookAt.copy(target.lookAt);
    this.isTransitioning = true;
  }

  getCurrentPreset(): CameraPreset {
    return this.currentPreset;
  }

  update(delta: number) {
    if (!this.isTransitioning) return;

    const lerpFactor = 1 - Math.exp(-this.transitionSpeed * delta);

    this.camera.position.lerp(this.targetPosition, lerpFactor);
    this.currentLookAt.lerp(this.targetLookAt, lerpFactor);
    this.camera.lookAt(this.currentLookAt);

    if (this.camera.position.distanceTo(this.targetPosition) < 0.01) {
      this.camera.position.copy(this.targetPosition);
      this.currentLookAt.copy(this.targetLookAt);
      this.camera.lookAt(this.currentLookAt);
      this.isTransitioning = false;
    }
  }
}
