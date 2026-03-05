import * as THREE from 'three';

export function setupLighting(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0x334466, 0.8);
  scene.add(ambient);

  const overhead = new THREE.DirectionalLight(0xccccff, 1.2);
  overhead.position.set(0, 10, 5);
  overhead.castShadow = true;
  overhead.shadow.mapSize.width = 2048;
  overhead.shadow.mapSize.height = 2048;
  scene.add(overhead);

  // Secondary overhead from behind to light the back wall
  const overheadBack = new THREE.DirectionalLight(0x8888cc, 0.6);
  overheadBack.position.set(0, 8, -8);
  scene.add(overheadBack);

  const cyanLight = new THREE.PointLight(0x00ffff, 2, 30);
  cyanLight.position.set(-8, 5, 0);
  scene.add(cyanLight);

  const magentaLight = new THREE.PointLight(0xff00ff, 2, 30);
  magentaLight.position.set(8, 5, 0);
  scene.add(magentaLight);

  const orangeLight = new THREE.PointLight(0xff6600, 1.5, 25);
  orangeLight.position.set(0, 3, -5);
  scene.add(orangeLight);

  // Fill lights to illuminate the corners
  const fillLeft = new THREE.PointLight(0x224466, 1.5, 25);
  fillLeft.position.set(-12, 6, -8);
  scene.add(fillLeft);

  const fillRight = new THREE.PointLight(0x224466, 1.5, 25);
  fillRight.position.set(12, 6, -8);
  scene.add(fillRight);
}
