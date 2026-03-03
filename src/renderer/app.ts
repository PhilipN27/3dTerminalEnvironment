import { SceneManager } from './scene/scene-manager';
import { Workshop } from './scene/workshop';

const container = document.getElementById('scene-container')!;
const sceneManager = new SceneManager(container);

const workshop = new Workshop();
sceneManager.scene.add(workshop.group);
