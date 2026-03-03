import * as THREE from 'three';

export class Workshop {
  group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
    this.buildFloor();
    this.buildWalls();
    this.buildCeiling();
    this.buildWorkstations();
  }

  private buildFloor() {
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
    this.group.add(floor);

    const grid = new THREE.GridHelper(30, 30, 0x00ffff, 0x0a0a1a);
    grid.position.y = 0.01;
    (grid.material as THREE.Material).opacity = 0.15;
    (grid.material as THREE.Material).transparent = true;
    this.group.add(grid);
  }

  private buildWalls() {
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x15152a,
      roughness: 0.7,
      metalness: 0.3,
    });

    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(30, 8), wallMaterial);
    backWall.position.set(0, 4, -10);
    this.group.add(backWall);

    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial);
    leftWall.position.set(-15, 4, 0);
    leftWall.rotation.y = Math.PI / 2;
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
    this.group.add(rightWall);
  }

  private buildCeiling() {
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({
        color: 0x0f0f1e,
        roughness: 0.9,
      })
    );
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 8;
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
