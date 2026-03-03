import * as THREE from 'three';
import { AgentConfig } from '../../shared/agent-config';
import { RobotState } from './agent-manager';

export class Robot {
  group: THREE.Group;
  private headMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private eyeMaterial: THREE.MeshStandardMaterial;
  private state: RobotState = 'idle';
  private idleTime = 0;
  private activeTime = 0;
  private baseY: number;

  constructor(config: AgentConfig, position: THREE.Vector3) {
    this.group = new THREE.Group();
    this.baseY = position.y;

    const bodyColor = new THREE.Color(config.color).multiplyScalar(0.3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.7,
      roughness: 0.3,
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.2,
    });

    // Body
    this.bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.5),
      bodyMaterial
    );
    this.bodyMesh.position.y = 1.6;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Head
    this.headMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.5),
      bodyMaterial
    );
    this.headMesh.position.y = 2.6;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Eyes
    const leftEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.08),
      this.eyeMaterial
    );
    leftEye.position.set(-0.15, 2.65, 0.26);
    this.group.add(leftEye);

    const rightEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.08),
      this.eyeMaterial
    );
    rightEye.position.set(0.15, 2.65, 0.26);
    this.group.add(rightEye);

    // Arms
    const armMaterial = bodyMaterial.clone();
    const leftArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.2),
      armMaterial
    );
    leftArm.position.set(-0.6, 1.6, 0);
    this.group.add(leftArm);

    const rightArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.2),
      armMaterial
    );
    rightArm.position.set(0.6, 1.6, 0);
    this.group.add(rightArm);

    // Legs
    const leftLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.8, 0.25),
      armMaterial
    );
    leftLeg.position.set(-0.2, 0.5, 0);
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.8, 0.25),
      armMaterial
    );
    rightLeg.position.set(0.2, 0.5, 0);
    this.group.add(rightLeg);

    this.group.position.copy(position);
  }

  setState(state: RobotState) {
    this.state = state;

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
  }

  update(delta: number) {
    this.idleTime += delta;

    if (this.state === 'idle') {
      this.group.position.y = this.baseY + Math.sin(this.idleTime * 1.5) * 0.05;
      this.headMesh.rotation.y = Math.sin(this.idleTime * 0.5) * 0.1;
    } else if (this.state === 'active') {
      this.activeTime += delta;
      this.group.position.y = this.baseY + Math.sin(this.activeTime * 3) * 0.08;
      this.headMesh.rotation.y = Math.sin(this.activeTime * 2) * 0.3;
      this.bodyMesh.rotation.z = Math.sin(this.activeTime * 4) * 0.05;
      const leftArm = this.group.children[4] as THREE.Mesh;
      const rightArm = this.group.children[5] as THREE.Mesh;
      leftArm.rotation.x = Math.sin(this.activeTime * 5) * 0.4;
      rightArm.rotation.x = Math.sin(this.activeTime * 5 + Math.PI) * 0.4;
    } else if (this.state === 'complete') {
      const scale = 1 + Math.sin(this.idleTime * 8) * 0.05;
      this.group.scale.setScalar(scale);
    }
  }
}
