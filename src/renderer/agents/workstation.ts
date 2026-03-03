import * as THREE from 'three';
import { RobotState } from './agent-manager';

export class Workstation {
  group: THREE.Group;
  private light: THREE.PointLight;
  private screenMaterial: THREE.MeshStandardMaterial;
  private state: RobotState = 'idle';

  constructor(position: THREE.Vector3, color: string) {
    this.group = new THREE.Group();

    this.light = new THREE.PointLight(color, 0.3, 5);
    this.light.position.set(0, 3, 0);
    this.group.add(this.light);

    this.screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      emissive: color,
      emissiveIntensity: 0.1,
    });
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      this.screenMaterial
    );
    screenMesh.position.set(0, 2, -0.7);
    this.group.add(screenMesh);

    this.group.position.copy(position);
  }

  setState(state: RobotState) {
    this.state = state;
    switch (state) {
      case 'idle':
        this.light.intensity = 0.3;
        this.screenMaterial.emissiveIntensity = 0.1;
        break;
      case 'active':
        this.light.intensity = 2.0;
        this.screenMaterial.emissiveIntensity = 1.0;
        break;
      case 'complete':
        this.light.intensity = 3.0;
        this.screenMaterial.emissiveIntensity = 1.5;
        break;
    }
  }
}
