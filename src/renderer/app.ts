import { SceneManager } from './scene/scene-manager';
import { Workshop } from './scene/workshop';
import { CameraController } from './scene/camera';

const container = document.getElementById('scene-container')!;
const sceneManager = new SceneManager(container);

const workshop = new Workshop();
sceneManager.scene.add(workshop.group);

const cameraController = new CameraController(sceneManager.camera);
sceneManager.onAnimate((delta) => {
  cameraController.update(delta);
});
