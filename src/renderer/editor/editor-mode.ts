import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { editorBridge, EditorTool, SpawnableModel } from './editor-bridge';

const AVAILABLE_MODELS: SpawnableModel[] = [
  // Lights
  { name: 'Strip Light', path: '/models/room/ceiling-strip-light.glb', category: 'Lights' },
  { name: 'Cage Light', path: '/models/room/ceiling-cage-light.glb', category: 'Lights' },
  { name: 'Ring Downlight', path: '/models/room/ring_downlight5000text.glb', category: 'Lights' },
  // Walls
  { name: 'Wall Panel', path: '/models/room/wall-panel.glb', category: 'Walls' },
  { name: 'Floor Panel', path: '/models/room/floor-panel.glb', category: 'Walls' },
  { name: 'Ceiling Panel', path: '/models/room/ceiling-panel.glb', category: 'Walls' },
  // Props
  { name: 'UI Architect WS', path: '/models/workstations/ui-architect-ws.glb', category: 'Props' },
  { name: 'Backend Engineer WS', path: '/models/workstations/backend-engineer-ws.glb', category: 'Props' },
  { name: 'Test Writer WS', path: '/models/workstations/test-writer-ws.glb', category: 'Props' },
  { name: 'Trello Attacker WS', path: '/models/workstations/trello-attacker-ws.glb', category: 'Props' },
  { name: 'Mobile Optimizer WS', path: '/models/workstations/mobile-optimizer-ws.glb', category: 'Props' },
  { name: 'QA Gatekeeper WS', path: '/models/workstations/qa-gatekeeper-ws.glb', category: 'Props' },
];

const SNAP_INCREMENT = 0.5;

export class EditorMode {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private transformControls: TransformControls;
  private gizmoHelper: THREE.Object3D;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private loader = new GLTFLoader();

  private active = false;
  private selectedObject: THREE.Object3D | null = null;
  private editorObjects: THREE.Object3D[] = [];
  private originalMaterials = new Map<THREE.Mesh, THREE.Material>();
  private gizmoVisible = false;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.scene = scene;
    this.camera = camera;
    this.domElement = domElement;

    // TransformControls setup
    this.transformControls = new TransformControls(camera, domElement);
    this.transformControls.setSize(0.8);
    this.transformControls.enabled = false;
    this.gizmoHelper = this.transformControls.getHelper();
    this.gizmoHelper.visible = false;
    this.scene.add(this.gizmoHelper);

    this.transformControls.addEventListener('objectChange', () => {
      this.reportTransform();
    });

    // Publish available models to bridge
    editorBridge.availableModels = AVAILABLE_MODELS;

    // Listen to bridge events
    editorBridge.on('tool-changed', ({ tool }) => this.setTool(tool));
    editorBridge.on('spawn-request', ({ modelPath }) => this.spawnModel(modelPath));
    editorBridge.on('delete-request', () => this.deleteSelected());
    editorBridge.on('save-request', () => this.saveLayout());
    editorBridge.on('deselect-request', () => this.deselectObject());

    // Input listeners
    this.domElement.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    document.addEventListener('keydown', (e) => this.onKeyDown(e), true);
    document.addEventListener('keyup', (e) => this.onKeyUp(e), true);
  }

  toggle() {
    this.active = !this.active;
    editorBridge.setActive(this.active);

    if (!this.active) {
      this.deselectObject();
      this.setGizmoVisible(false);
      this.transformControls.enabled = false;
    }

    // Toggle HUD visibility
    const hud = document.getElementById('hud-overlay');
    if (hud) hud.style.display = this.active ? 'none' : 'block';

    const editorRoot = document.getElementById('editor-root');
    if (editorRoot) editorRoot.style.display = this.active ? 'block' : 'none';
  }

  isActive() {
    return this.active;
  }

  update(_delta: number) {
    // TransformControls updates itself automatically
  }

  private setGizmoVisible(v: boolean) {
    this.gizmoVisible = v;
    this.gizmoHelper.visible = v;
  }

  // --- Selection ---

  private onPointerDown(e: PointerEvent) {
    if (!this.active) return;

    // Don't raycast if clicking on UI or transform gizmo
    if (this.transformControls.dragging) return;
    const target = e.target as HTMLElement;
    if (target !== this.domElement) return;

    this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Collect all meshes in scene (excluding transform gizmo helper)
    const intersectables: THREE.Object3D[] = [];
    this.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && !this.isGizmoChild(child)) {
        intersectables.push(child);
      }
    });

    const intersects = this.raycaster.intersectObjects(intersectables, false);

    if (intersects.length > 0) {
      // Walk up from the hit mesh to find the nearest selectable ancestor
      let obj = intersects[0].object;
      let selectable: THREE.Object3D | null = null;

      // Check the hit object itself and each ancestor
      let current: THREE.Object3D | null = obj;
      while (current && current !== this.scene) {
        if (current.userData.selectable === true) {
          selectable = current;
          break;
        }
        current = current.parent;
      }

      // Fallback: if no selectable tag found, use top-level scene child (for spawned/editor objects)
      if (!selectable) {
        let fallback = obj;
        while (fallback.parent && fallback.parent !== this.scene) {
          fallback = fallback.parent;
        }
        // Only select if not explicitly marked non-selectable
        if (fallback.userData.selectable !== false) {
          selectable = fallback;
        }
      }

      if (selectable) {
        this.selectObject(selectable);
      }
    } else {
      this.deselectObject();
    }
  }

  private isGizmoChild(obj: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if (current === this.gizmoHelper) return true;
      current = current.parent;
    }
    return false;
  }

  private selectObject(obj: THREE.Object3D) {
    if (this.selectedObject === obj) {
      this.deselectObject();
      return;
    }

    this.deselectObject();
    this.selectedObject = obj;

    // Highlight: clone material and boost emissive (so shared materials aren't affected)
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh && mesh.material) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.emissive) {
          this.originalMaterials.set(mesh, mat);
          const cloned = mat.clone();
          cloned.emissive.set(0x335577);
          mesh.material = cloned;
        }
      }
    });

    // Attach transform controls
    this.transformControls.attach(obj);
    this.setGizmoVisible(true);
    this.transformControls.enabled = true;

    this.reportSelection();
  }

  private deselectObject() {
    if (!this.selectedObject) return;

    // Restore original shared materials
    this.originalMaterials.forEach((originalMat, mesh) => {
      mesh.material = originalMat;
    });
    this.originalMaterials.clear();

    this.transformControls.detach();
    this.setGizmoVisible(false);
    this.transformControls.enabled = false;
    this.selectedObject = null;

    editorBridge.setSelectedObject(null);
  }

  // --- Tools ---

  private setTool(tool: EditorTool) {
    const modeMap: Record<EditorTool, 'translate' | 'rotate' | 'scale'> = {
      'Move': 'translate',
      'Rotate': 'rotate',
      'Scale': 'scale',
    };
    this.transformControls.setMode(modeMap[tool]);
  }

  // --- Keyboard ---

  private onKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement;
    const isEditorInput = (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)
      && !!target.closest('#editor-root');

    // Toggle editor with E (works even when terminal is focused, but not in editor inputs)
    if (e.key.toLowerCase() === 'e' && !e.ctrlKey && !e.shiftKey && !isEditorInput) {
      this.toggle();
      return;
    }

    // Escape deselects (works even when terminal is focused)
    if (e.key === 'Escape' && this.active) {
      this.deselectObject();
      return;
    }

    // Skip other shortcuts when typing in any input/textarea
    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return;

    if (!this.active) return;

    switch (e.key.toLowerCase()) {
      case 'g':
        editorBridge.selectTool('Move');
        break;
      case 'r':
        editorBridge.selectTool('Rotate');
        break;
      case 's':
        if (e.ctrlKey && e.shiftKey) {
          e.preventDefault();
          this.saveLayout();
        } else if (!e.ctrlKey) {
          editorBridge.selectTool('Scale');
        }
        break;
      case 'delete':
      case 'backspace':
        this.deleteSelected();
        break;
      case 'escape':
        this.deselectObject();
        break;
      case 'control':
        this.transformControls.setTranslationSnap(SNAP_INCREMENT);
        this.transformControls.setRotationSnap(THREE.MathUtils.degToRad(15));
        this.transformControls.setScaleSnap(0.1);
        break;
    }
  }

  private onKeyUp(e: KeyboardEvent) {
    if (e.key === 'Control') {
      this.transformControls.setTranslationSnap(null);
      this.transformControls.setRotationSnap(null);
      this.transformControls.setScaleSnap(null);
    }
  }

  // --- Spawn ---

  private async spawnModel(modelPath: string) {
    try {
      const gltf = await this.loader.loadAsync(modelPath);
      const obj = gltf.scene;

      // Tag as editor-managed
      obj.userData.editorManaged = true;
      obj.userData.selectable = true;
      obj.userData.modelPath = modelPath;
      obj.name = modelPath.split('/').pop()?.replace('.glb', '') || 'object';

      // Enable shadows
      obj.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Place in front of camera
      const dir = new THREE.Vector3();
      this.camera.getWorldDirection(dir);
      const spawnPos = this.camera.position.clone().add(dir.multiplyScalar(5));
      spawnPos.y = 0;
      obj.position.copy(spawnPos);

      this.scene.add(obj);
      this.editorObjects.push(obj);
      this.selectObject(obj);

      console.log(`Spawned: ${obj.name}`);
    } catch (e) {
      console.warn(`Failed to spawn model ${modelPath}:`, e);
    }
  }

  // --- Delete ---

  private deleteSelected() {
    if (!this.selectedObject) return;

    const obj = this.selectedObject;
    this.deselectObject();

    this.scene.remove(obj);
    const idx = this.editorObjects.indexOf(obj);
    if (idx >= 0) this.editorObjects.splice(idx, 1);

    console.log(`Deleted: ${obj.name}`);
  }

  // --- Reporting ---

  private reportSelection() {
    if (!this.selectedObject) return;
    const obj = this.selectedObject;
    editorBridge.setSelectedObject({
      name: obj.name || 'unnamed',
      transform: {
        position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
        rotation: {
          x: THREE.MathUtils.radToDeg(obj.rotation.x),
          y: THREE.MathUtils.radToDeg(obj.rotation.y),
          z: THREE.MathUtils.radToDeg(obj.rotation.z),
        },
        scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
      },
    });
  }

  private reportTransform() {
    if (!this.selectedObject) return;
    const obj = this.selectedObject;
    editorBridge.setTransform({
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: {
        x: THREE.MathUtils.radToDeg(obj.rotation.x),
        y: THREE.MathUtils.radToDeg(obj.rotation.y),
        z: THREE.MathUtils.radToDeg(obj.rotation.z),
      },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
    });
  }

  // --- Layout persistence ---

  private saveLayout() {
    const layout = this.editorObjects
      .filter((obj) => obj.parent) // still in scene
      .map((obj) => ({
        modelPath: obj.userData.modelPath || '',
        position: [obj.position.x, obj.position.y, obj.position.z] as [number, number, number],
        rotation: [obj.rotation.x, obj.rotation.y, obj.rotation.z] as [number, number, number],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z] as [number, number, number],
      }));

    const json = JSON.stringify(layout, null, 2);

    // Download as file
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'room-layout.json';
    a.click();
    URL.revokeObjectURL(url);

    console.log(`Saved layout: ${layout.length} objects`);
  }

  async loadLayout() {
    try {
      const response = await fetch('/room-layout.json');
      if (!response.ok) return;
      const layout = await response.json();

      for (const entry of layout) {
        const gltf = await this.loader.loadAsync(entry.modelPath);
        const obj = gltf.scene;
        obj.userData.editorManaged = true;
        obj.userData.modelPath = entry.modelPath;
        obj.name = entry.modelPath.split('/').pop()?.replace('.glb', '') || 'object';

        obj.position.set(...(entry.position as [number, number, number]));
        obj.rotation.set(...(entry.rotation as [number, number, number]));
        obj.scale.set(...(entry.scale as [number, number, number]));

        obj.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        this.scene.add(obj);
        this.editorObjects.push(obj);
      }

      console.log(`Loaded layout: ${layout.length} objects`);
    } catch {
      // No layout file — that's fine
    }
  }
}
