import * as THREE from 'three';

export class CityBackdrop {
  group: THREE.Group;
  private particles: THREE.Points;
  private time = 0;

  constructor() {
    this.group = new THREE.Group();
    this.buildSkybox();
    this.buildBuildings();
    this.particles = this.buildParticles();
  }

  private buildSkybox() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#050510');
    gradient.addColorStop(0.5, '#0a0a2e');
    gradient.addColorStop(1, '#1a0a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 200; i++) {
      const alpha = Math.random() * 0.8;
      ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
      ctx.fillRect(Math.random() * 512, Math.random() * 300, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const skyGeo = new THREE.SphereGeometry(200, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.group.add(sky);
  }

  private buildBuildings() {
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1e,
      metalness: 0.8,
      roughness: 0.3,
    });

    for (let i = 0; i < 40; i++) {
      const width = 1 + Math.random() * 3;
      const height = 5 + Math.random() * 25;
      const depth = 1 + Math.random() * 3;

      const building = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        buildingMaterial
      );

      building.position.set(
        20 + Math.random() * 60,
        height / 2,
        -30 + Math.random() * 60
      );
      this.group.add(building);

      const windowColors = [0x00ffff, 0xff00ff, 0xff6600, 0x00ff66];
      const windowColor = windowColors[Math.floor(Math.random() * windowColors.length)];
      const windowRows = Math.floor(height / 2);
      for (let w = 0; w < windowRows; w++) {
        if (Math.random() > 0.4) continue;
        const windowStrip = new THREE.Mesh(
          new THREE.PlaneGeometry(width * 0.8, 0.15),
          new THREE.MeshStandardMaterial({
            color: windowColor,
            emissive: windowColor,
            emissiveIntensity: 0.5 + Math.random() * 0.5,
          })
        );
        windowStrip.position.set(
          building.position.x - depth / 2 - 0.01,
          w * 2 + 1,
          building.position.z
        );
        windowStrip.rotation.y = -Math.PI / 2;
        this.group.add(windowStrip);
      }
    }
  }

  private buildParticles(): THREE.Points {
    const count = 1000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100 + 40;
      positions[i * 3 + 1] = Math.random() * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.05,
      transparent: true,
      opacity: 0.4,
    });

    const particles = new THREE.Points(geometry, material);
    this.group.add(particles);
    return particles;
  }

  update(delta: number) {
    this.time += delta;

    const positions = this.particles.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= delta * 5;
      if (positions[i + 1] < 0) {
        positions[i + 1] = 40;
      }
    }
    this.particles.geometry.attributes.position.needsUpdate = true;
  }
}
