import { SceneManager } from './scene/scene-manager';
import * as THREE from 'three';

const container = document.getElementById('scene-container')!;
const sceneManager = new SceneManager(container);

// Placeholder ground plane
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(30, 30),
  new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
sceneManager.scene.add(ground);
