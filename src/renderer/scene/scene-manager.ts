import * as THREE from 'three';
import { EffectComposer, RenderPass, BloomEffect, ChromaticAberrationEffect, VignetteEffect, EffectPass } from 'postprocessing';
import { setupLighting } from './lighting';

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private lastTime = 0;
  private composer: EffectComposer;
  private animationCallbacks: ((delta: number) => void)[] = [];
  private frameInterval = 1000 / 60;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 7.5, 9);
    this.camera.lookAt(0, 0, -4);

    this.renderer = new THREE.WebGLRenderer({
      antialias: false, // Disabled — postprocessing handles AA
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(this.renderer.domElement);

    this.lastTime = performance.now();

    setupLighting(this.scene);

    // Post-processing pipeline
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));

    const bloom = new BloomEffect({
      intensity: 0.8,
      luminanceThreshold: 0.6,
      luminanceSmoothing: 0.3,
      mipmapBlur: true,
    });

    const chromaticAberration = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0008, 0.0008),
      radialModulation: false,
      modulationOffset: 0.15,
    });

    const vignette = new VignetteEffect({
      darkness: 0.5,
      offset: 0.3,
    });

    this.composer.addPass(new EffectPass(this.camera, bloom, chromaticAberration, vignette));

    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
      this.composer.setSize(container.clientWidth, container.clientHeight);
    });

    this.animate();
  }

  onAnimate(callback: (delta: number) => void) {
    this.animationCallbacks.push(callback);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    const now = performance.now();
    const elapsed = now - this.lastTime;
    if (elapsed < this.frameInterval) return;
    this.lastTime = now - (elapsed % this.frameInterval);
    const delta = elapsed / 1000;
    for (const cb of this.animationCallbacks) {
      cb(delta);
    }
    this.composer.render(delta);
  }
}
