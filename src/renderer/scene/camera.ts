import * as THREE from 'three';
import { CameraPreset } from '../../shared/types';
import { editorBridge } from '../editor/editor-bridge';

interface CameraPosition {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

const PRESETS: Record<Exclude<CameraPreset, 'freeroam'>, CameraPosition> = {
  'overview': {
    position: new THREE.Vector3(0, 7.5, 9),
    lookAt: new THREE.Vector3(0, 0, -4),
  },
  'overview-corner': {
    position: new THREE.Vector3(13, 7, 8),
    lookAt: new THREE.Vector3(-5, 0, -5),
  },
  'terminal': {
    position: new THREE.Vector3(0, 4, -4),
    lookAt: new THREE.Vector3(0, 3, -9.5),
  },
  // Left wall agents
  'ui-architect': {
    position: new THREE.Vector3(-8, 4, -6),
    lookAt: new THREE.Vector3(-13, 2, -6),
  },
  'backend-engineer': {
    position: new THREE.Vector3(-8, 4, 0),
    lookAt: new THREE.Vector3(-13, 2, 0),
  },
  'test-writer': {
    position: new THREE.Vector3(-8, 4, 6),
    lookAt: new THREE.Vector3(-13, 2, 6),
  },
  // Right wall agents
  'trello-attacker': {
    position: new THREE.Vector3(8, 4, -6),
    lookAt: new THREE.Vector3(13, 2, -6),
  },
  'mobile-optimizer': {
    position: new THREE.Vector3(8, 4, 0),
    lookAt: new THREE.Vector3(13, 2, 0),
  },
  'qa-gatekeeper': {
    position: new THREE.Vector3(8, 4, 6),
    lookAt: new THREE.Vector3(13, 2, 6),
  },
};

const HOTKEY_MAP: Record<string, CameraPreset> = {
  '1': 'overview',
  '2': 'overview-corner',
  '3': 'terminal',
  '4': 'ui-architect',
  '5': 'backend-engineer',
  '6': 'test-writer',
  '7': 'trello-attacker',
  '8': 'mobile-optimizer',
  '9': 'qa-gatekeeper',
  '0': 'freeroam',
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

  // Free roam state
  private isFreeroam = false;
  private yaw = 0;
  private pitch = -0.3;
  private moveSpeed = 8;
  private lookSpeed = 0.002;
  private keys = new Set<string>();
  private isPointerLocked = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    const preset = PRESETS['overview'];
    this.targetPosition = preset.position.clone();
    this.targetLookAt = preset.lookAt.clone();
    this.currentLookAt = preset.lookAt.clone();
    this.camera.position.copy(preset.position);

    window.addEventListener('keydown', (e) => {
      // Disable camera hotkeys when editor is active
      if (editorBridge.active) return;

      if (e.key === 'Tab') {
        e.preventDefault();
        this.autoFollow = !this.autoFollow;
        return;
      }

      if (this.isFreeroam) {
        this.keys.add(e.key.toLowerCase());
        if (e.key === 'Escape') {
          document.exitPointerLock();
          return;
        }
      }

      const preset = HOTKEY_MAP[e.key];
      if (preset) {
        if (preset === 'freeroam') {
          this.enterFreeroam();
        } else {
          this.exitFreeroam();
          this.goTo(preset);
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isFreeroam || !this.isPointerLocked || editorBridge.active) return;
      this.yaw -= e.movementX * this.lookSpeed;
      this.pitch -= e.movementY * this.lookSpeed;
      this.pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.pitch));
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = !!document.pointerLockElement;
      if (!this.isPointerLocked && this.isFreeroam) {
        // Stay in freeroam but allow re-locking on click
      }
    });

    window.addEventListener('click', () => {
      if (this.isFreeroam && !this.isPointerLocked && !editorBridge.active) {
        document.body.requestPointerLock();
      }
    });
  }

  private enterFreeroam() {
    this.isFreeroam = true;
    this.isTransitioning = false;
    this.currentPreset = 'freeroam';

    // Calculate current yaw/pitch from camera direction
    const dir = new THREE.Vector3();
    this.camera.getWorldDirection(dir);
    this.yaw = Math.atan2(-dir.x, -dir.z);
    this.pitch = Math.asin(dir.y);

    document.body.requestPointerLock();
  }

  private exitFreeroam() {
    this.isFreeroam = false;
    this.isPointerLocked = false;
    this.keys.clear();
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  goTo(preset: CameraPreset) {
    if (preset === 'freeroam') {
      this.enterFreeroam();
      return;
    }
    this.exitFreeroam();
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
    if (this.isFreeroam) {
      this.updateFreeroam(delta);
      return;
    }

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

  private updateFreeroam(delta: number) {
    // Look direction from yaw/pitch
    const forward = new THREE.Vector3(
      -Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      -Math.cos(this.yaw) * Math.cos(this.pitch),
    );
    const right = new THREE.Vector3(-Math.cos(this.yaw), 0, Math.sin(this.yaw));

    const speed = this.moveSpeed * delta;

    if (this.keys.has('w')) this.camera.position.addScaledVector(forward, speed);
    if (this.keys.has('s')) this.camera.position.addScaledVector(forward, -speed);
    if (this.keys.has('a')) this.camera.position.addScaledVector(right, -speed);
    if (this.keys.has('d')) this.camera.position.addScaledVector(right, speed);
    if (this.keys.has(' ')) this.camera.position.y += speed;
    if (this.keys.has('shift')) this.camera.position.y -= speed;

    const lookTarget = this.camera.position.clone().add(forward);
    this.camera.lookAt(lookTarget);
    this.currentLookAt.copy(lookTarget);
  }
}
