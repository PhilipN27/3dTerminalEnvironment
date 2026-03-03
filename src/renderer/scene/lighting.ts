import * as THREE from 'three';

export function setupLighting(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0x1a1a3e, 0.3);
  scene.add(ambient);

  const overhead = new THREE.DirectionalLight(0xccccff, 0.5);
  overhead.position.set(0, 10, 5);
  overhead.castShadow = true;
  overhead.shadow.mapSize.width = 2048;
  overhead.shadow.mapSize.height = 2048;
  scene.add(overhead);

  const cyanLight = new THREE.PointLight(0x00ffff, 1, 20);
  cyanLight.position.set(-8, 4, 0);
  scene.add(cyanLight);

  const magentaLight = new THREE.PointLight(0xff00ff, 1, 20);
  magentaLight.position.set(8, 4, 0);
  scene.add(magentaLight);

  const orangeLight = new THREE.PointLight(0xff6600, 0.8, 15);
  orangeLight.position.set(0, 3, -5);
  scene.add(orangeLight);
}
