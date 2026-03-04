import * as THREE from 'three';
import { SceneManager } from './scene/scene-manager';
import { Workshop } from './scene/workshop';
import { CameraController } from './scene/camera';
import { TerminalIO } from './terminal/terminal-io';
import { TerminalMesh } from './terminal/terminal-mesh';
import { AgentManager } from './agents/agent-manager';
import { Robot } from './agents/robot-loader';
import { Workstation } from './agents/workstation';
import { AGENT_MAP } from '../shared/agent-config';
import { CameraPreset } from '../shared/types';
import { Overlay } from './ui/overlay';
import { CityBackdrop } from './scene/city-backdrop';

// Scene
const container = document.getElementById('scene-container')!;
const sceneManager = new SceneManager(container);

// Workshop
const workshop = new Workshop();
sceneManager.scene.add(workshop.group);

// City backdrop
const city = new CityBackdrop();
sceneManager.scene.add(city.group);

// Camera
const cameraController = new CameraController(sceneManager.camera);

// Terminal
const terminalIO = new TerminalIO();
const terminalMesh = new TerminalMesh(terminalIO);
sceneManager.scene.add(terminalMesh.mesh);

// Agents
const agentManager = new AgentManager();

const AGENT_POSITIONS: Record<string, THREE.Vector3> = {
  'ui-architect': new THREE.Vector3(-10, 0, -5),
  'backend-engineer': new THREE.Vector3(-6, 0, -5),
  'test-writer': new THREE.Vector3(-2, 0, -5),
  'trello-attacker': new THREE.Vector3(10, 0, -5),
  'mobile-optimizer': new THREE.Vector3(6, 0, -5),
  'qa-gatekeeper': new THREE.Vector3(2, 0, -5),
};

const robots = new Map<string, Robot>();
const workstations = new Map<string, Workstation>();

for (const [id, config] of Object.entries(AGENT_MAP)) {
  const pos = AGENT_POSITIONS[id];

  const robot = new Robot(config, pos);
  robots.set(id, robot);
  sceneManager.scene.add(robot.group);

  // Load GLB model (falls back to placeholder on failure)
  robot.loadModel(config.modelPath);

  const workstation = new Workstation(config, pos);
  workstations.set(id, workstation);
  sceneManager.scene.add(workstation.group);

  // Load workstation GLB model (falls back to placeholder on failure)
  workstation.loadModel(config.workstationModelPath);
}

// Connect agent state changes to robots, workstations, and camera
agentManager.onStateChange((agentId, state) => {
  robots.get(agentId)?.setState(state);
  workstations.get(agentId)?.setState(state);

  if (state === 'active' && cameraController.autoFollow) {
    cameraController.goTo(agentId as CameraPreset);
  }
  if (state === 'idle' && cameraController.autoFollow) {
    cameraController.goTo('overview');
  }
});

// Animation loop
sceneManager.onAnimate((delta) => {
  cameraController.update(delta);
  terminalMesh.update();
  city.update(delta);
  for (const robot of robots.values()) {
    robot.update(delta);
  }
});

// Auto-focus terminal
terminalMesh.focus();

new Overlay(agentManager, cameraController, terminalIO);
