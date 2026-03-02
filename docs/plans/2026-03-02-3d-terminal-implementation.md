# 3D Terminal Environment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a cyberpunk 3D workshop environment in Electron that houses an embedded PowerShell/Bash terminal and visualizes Claude Code AI agents as animated robots.

**Architecture:** Monolithic Electron app with Three.js for 3D rendering, xterm.js for terminal emulation, node-pty for shell process management, and a local Express HTTP server for Claude Code hook events. The renderer process manages the 3D scene, terminal texture, agent state machine, and HUD overlay. The main process manages shell processes and hook events, bridging to the renderer via Electron IPC.

**Tech Stack:** Electron 30+, Three.js r160+, xterm.js, node-pty, Express.js, TypeScript, Vite

**Design Doc:** `docs/plans/2026-03-02-3d-terminal-environment-design.md`

---

## Phase 1: Project Scaffolding & Electron Shell

### Task 1: Initialize Project & Dependencies

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `electron-builder.yml`
- Create: `.gitignore`

**Step 1: Initialize npm project**

Run: `npm init -y`

**Step 2: Install core dependencies**

Run:
```bash
npm install electron electron-builder three xterm xterm-addon-fit xterm-addon-webgl node-pty express
npm install -D typescript vite @types/node @types/express vite-plugin-electron vite-plugin-electron-renderer
```

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": ".",
    "paths": {
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create vite.config.ts**

```ts
import { defineConfig } from 'vite';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig({
  plugins: [
    electron([
      {
        entry: 'src/main/index.ts',
        vite: {
          build: {
            outDir: 'dist/main',
          },
        },
      },
    ]),
    renderer(),
  ],
  build: {
    outDir: 'dist/renderer',
  },
});
```

**Step 5: Create .gitignore**

```
node_modules/
dist/
*.log
.env
```

**Step 6: Add scripts to package.json**

Add to package.json scripts:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "main": "dist/main/index.js"
}
```

**Step 7: Commit**

```bash
git add package.json tsconfig.json vite.config.ts .gitignore electron-builder.yml
git commit -m "feat: initialize project with Electron + Three.js + Vite scaffold"
```

---

### Task 2: Electron Main Process - Window & IPC

**Files:**
- Create: `src/main/index.ts`
- Create: `src/main/ipc-handlers.ts`
- Create: `src/shared/types.ts`
- Create: `src/preload/preload.ts`

**Step 1: Create shared types**

```ts
// src/shared/types.ts
export type ShellType = 'powershell' | 'bash';

export interface ShellData {
  output: string;
}

export interface ShellInput {
  input: string;
}

export interface AgentEvent {
  agent: string;
  event: 'start' | 'complete';
}

export interface AgentState {
  agentId: string;
  state: 'idle' | 'active' | 'complete';
}

export type CameraPreset = 'overview' | 'terminal' | 'ui-architect' | 'backend-engineer' | 'test-writer' | 'trello-attacker' | 'mobile-optimizer' | 'qa-gatekeeper';

// IPC channel names
export const IPC = {
  SHELL_OUTPUT: 'shell:output',
  SHELL_INPUT: 'shell:input',
  SHELL_RESIZE: 'shell:resize',
  SHELL_SWITCH: 'shell:switch',
  AGENT_EVENT: 'agent:event',
} as const;
```

**Step 2: Create main process entry**

```ts
// src/main/index.ts
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { setupIpcHandlers } from './ipc-handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    backgroundColor: '#0a0a1a',
    title: '3D Terminal Environment',
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  setupIpcHandlers(mainWindow);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});
```

**Step 3: Create IPC handlers stub**

```ts
// src/main/ipc-handlers.ts
import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../shared/types';

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.on(IPC.SHELL_INPUT, (_event, data: { input: string }) => {
    console.log('Shell input received:', data.input);
  });

  ipcMain.on(IPC.SHELL_SWITCH, (_event, data: { shell: string }) => {
    console.log('Shell switch requested:', data.shell);
  });

  ipcMain.on(IPC.SHELL_RESIZE, (_event, data: { cols: number; rows: number }) => {
    console.log('Shell resize:', data.cols, data.rows);
  });
}
```

**Step 4: Create preload script**

```ts
// src/preload/preload.ts
import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  sendShellInput: (input: string) => ipcRenderer.send(IPC.SHELL_INPUT, { input }),
  onShellOutput: (callback: (data: string) => void) =>
    ipcRenderer.on(IPC.SHELL_OUTPUT, (_event, data) => callback(data)),
  switchShell: (shell: string) => ipcRenderer.send(IPC.SHELL_SWITCH, { shell }),
  resizeShell: (cols: number, rows: number) =>
    ipcRenderer.send(IPC.SHELL_RESIZE, { cols, rows }),
  onAgentEvent: (callback: (event: { agent: string; event: string }) => void) =>
    ipcRenderer.on(IPC.AGENT_EVENT, (_event, data) => callback(data)),
});
```

**Step 5: Run dev server to verify Electron window opens**

Run: `npm run dev`
Expected: A blank dark window opens with title "3D Terminal Environment"

**Step 6: Commit**

```bash
git add src/main/ src/shared/ src/preload/
git commit -m "feat: add Electron main process with window creation and IPC stubs"
```

---

### Task 3: Shell Manager (node-pty)

**Files:**
- Create: `src/main/shell-manager.ts`
- Modify: `src/main/index.ts`
- Modify: `src/main/ipc-handlers.ts`

**Step 1: Create shell manager**

```ts
// src/main/shell-manager.ts
import * as pty from 'node-pty';
import { ShellType } from '../shared/types';

export class ShellManager {
  private activeShell: pty.IPty | null = null;
  private shellType: ShellType = 'powershell';
  private onDataCallback: ((data: string) => void) | null = null;

  constructor() {}

  onData(callback: (data: string) => void) {
    this.onDataCallback = callback;
  }

  start(type: ShellType = 'powershell') {
    this.dispose();
    this.shellType = type;

    const shell = type === 'powershell' ? 'powershell.exe' : 'bash.exe';

    this.activeShell = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.env.HOME || process.env.USERPROFILE || '.',
      env: process.env as Record<string, string>,
    });

    this.activeShell.onData((data) => {
      this.onDataCallback?.(data);
    });
  }

  write(data: string) {
    this.activeShell?.write(data);
  }

  resize(cols: number, rows: number) {
    this.activeShell?.resize(cols, rows);
  }

  getType(): ShellType {
    return this.shellType;
  }

  dispose() {
    this.activeShell?.kill();
    this.activeShell = null;
  }
}
```

**Step 2: Wire shell manager into IPC handlers**

Update `src/main/ipc-handlers.ts`:

```ts
import { BrowserWindow, ipcMain } from 'electron';
import { IPC, ShellType } from '../shared/types';
import { ShellManager } from './shell-manager';

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  const shellManager = new ShellManager();

  shellManager.onData((data) => {
    mainWindow.webContents.send(IPC.SHELL_OUTPUT, data);
  });

  shellManager.start('powershell');

  ipcMain.on(IPC.SHELL_INPUT, (_event, data: { input: string }) => {
    shellManager.write(data.input);
  });

  ipcMain.on(IPC.SHELL_SWITCH, (_event, data: { shell: ShellType }) => {
    shellManager.start(data.shell);
  });

  ipcMain.on(IPC.SHELL_RESIZE, (_event, data: { cols: number; rows: number }) => {
    shellManager.resize(data.cols, data.rows);
  });

  mainWindow.on('closed', () => {
    shellManager.dispose();
  });

  return shellManager;
}
```

**Step 3: Test shell spawns by running dev and checking console**

Run: `npm run dev`
Expected: Electron window opens. Main process console shows no errors. PowerShell process spawns.

**Step 4: Commit**

```bash
git add src/main/shell-manager.ts src/main/ipc-handlers.ts
git commit -m "feat: add shell manager with node-pty for PowerShell and Bash support"
```

---

### Task 4: Hook Event Server

**Files:**
- Create: `src/main/hook-server.ts`
- Modify: `src/main/index.ts`
- Create: `src/shared/agent-config.ts`

**Step 1: Create agent config**

```ts
// src/shared/agent-config.ts
export interface AgentConfig {
  robotId: string;
  displayName: string;
  color: string;
}

export const AGENT_MAP: Record<string, AgentConfig> = {
  'ui-architect': {
    robotId: 'robot-ui-architect',
    displayName: 'UI Architect',
    color: '#00ffff',
  },
  'backend-engineer': {
    robotId: 'robot-backend-engineer',
    displayName: 'Backend Engineer',
    color: '#ff6600',
  },
  'test-writer': {
    robotId: 'robot-test-writer',
    displayName: 'Test Writer',
    color: '#00ff66',
  },
  'trello-attacker': {
    robotId: 'robot-trello-attacker',
    displayName: 'Trello Attacker',
    color: '#ff00ff',
  },
  'mobile-optimizer': {
    robotId: 'robot-mobile-optimizer',
    displayName: 'Mobile Optimizer',
    color: '#ffff00',
  },
  'qa-gatekeeper': {
    robotId: 'robot-qa-gatekeeper',
    displayName: 'Q&A Gatekeeper',
    color: '#ff3366',
  },
};

export const AGENT_KEYWORDS: Record<string, string[]> = {
  'ui-architect': ['ui-architect', 'ui architect', 'frontend-design', 'UI Architect'],
  'backend-engineer': ['backend-engineer', 'backend engineer', 'Backend Engineer'],
  'test-writer': ['test-writer', 'test writer', 'Test Writer', 'test-driven'],
  'trello-attacker': ['trello-attacker', 'trello attacker', 'Trello Attacker', 'trello'],
  'mobile-optimizer': ['mobile-optimizer', 'mobile optimizer', 'Mobile Optimizer'],
  'qa-gatekeeper': ['qa-gatekeeper', 'qa gatekeeper', 'Q&A Gatekeeper', 'gatekeeper'],
};
```

**Step 2: Create hook server**

```ts
// src/main/hook-server.ts
import express from 'express';
import { BrowserWindow } from 'electron';
import { IPC } from '../shared/types';
import { AGENT_MAP, AGENT_KEYWORDS } from '../shared/agent-config';
import type { Server } from 'http';

const HOOK_PORT = 3847;

export class HookServer {
  private server: Server | null = null;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  start() {
    const app = express();
    app.use(express.json());
    app.use(express.text());

    app.post('/agent-event', (req, res) => {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { agent, event } = body;

      if (agent && AGENT_MAP[agent]) {
        this.mainWindow.webContents.send(IPC.AGENT_EVENT, { agent, event });
      }

      res.status(200).json({ ok: true });
    });

    app.post('/hook-raw', (req, res) => {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const agent = this.identifyAgent(body);

      if (agent) {
        this.mainWindow.webContents.send(IPC.AGENT_EVENT, {
          agent,
          event: req.query.event || 'start',
        });
      }

      res.status(200).json({ ok: true });
    });

    this.server = app.listen(HOOK_PORT, '127.0.0.1', () => {
      console.log(`Hook server listening on http://127.0.0.1:${HOOK_PORT}`);
    });
  }

  private identifyAgent(toolInput: string): string | null {
    const lower = toolInput.toLowerCase();
    for (const [agentId, keywords] of Object.entries(AGENT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword.toLowerCase())) {
          return agentId;
        }
      }
    }
    return null;
  }

  stop() {
    this.server?.close();
    this.server = null;
  }
}
```

**Step 3: Wire hook server into main process**

Add to `src/main/index.ts` inside `createWindow()`:

```ts
import { HookServer } from './hook-server';

// After setupIpcHandlers:
const hookServer = new HookServer(mainWindow);
hookServer.start();

mainWindow.on('closed', () => {
  hookServer.stop();
});
```

**Step 4: Test hook server with curl**

Run: `npm run dev`
Then in a separate terminal:
```bash
curl -X POST http://127.0.0.1:3847/agent-event -H "Content-Type: application/json" -d "{\"agent\":\"ui-architect\",\"event\":\"start\"}"
```
Expected: `{"ok":true}` response.

**Step 5: Commit**

```bash
git add src/main/hook-server.ts src/shared/agent-config.ts src/main/index.ts
git commit -m "feat: add hook event server for Claude Code agent integration"
```

---

## Phase 2: Renderer - 3D Scene Foundation

### Task 5: Basic Three.js Scene

**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/app.ts`
- Create: `src/renderer/scene/scene-manager.ts`
- Create: `src/renderer/scene/lighting.ts`

**Step 1: Create renderer HTML entry**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>3D Terminal Environment</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0a1a; }
    #app { width: 100%; height: 100%; position: relative; }
    #scene-container { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="app">
    <div id="scene-container"></div>
  </div>
  <script type="module" src="./app.ts"></script>
</body>
</html>
```

**Step 2: Create scene manager**

```ts
// src/renderer/scene/scene-manager.ts
import * as THREE from 'three';
import { setupLighting } from './lighting';

export class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  private clock: THREE.Clock;
  private animationCallbacks: ((delta: number) => void)[] = [];

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a1a);
    this.scene.fog = new THREE.FogExp2(0x0a0a1a, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 8, 15);
    this.camera.lookAt(0, 2, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    setupLighting(this.scene);

    window.addEventListener('resize', () => {
      this.camera.aspect = container.clientWidth / container.clientHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    });

    this.animate();
  }

  onAnimate(callback: (delta: number) => void) {
    this.animationCallbacks.push(callback);
  }

  private animate() {
    requestAnimationFrame(() => this.animate());
    const delta = this.clock.getDelta();
    for (const cb of this.animationCallbacks) {
      cb(delta);
    }
    this.renderer.render(this.scene, this.camera);
  }
}
```

**Step 3: Create lighting setup**

```ts
// src/renderer/scene/lighting.ts
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
```

**Step 4: Create app entry point**

```ts
// src/renderer/app.ts
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
```

**Step 5: Run dev and verify 3D scene renders**

Run: `npm run dev`
Expected: Electron window shows a dark scene with a dimly lit ground plane and colored accent lights.

**Step 6: Commit**

```bash
git add src/renderer/
git commit -m "feat: add basic Three.js scene with cyberpunk lighting"
```

---

### Task 6: Workshop Environment (Placeholder Geometry)

**Files:**
- Create: `src/renderer/scene/workshop.ts`
- Modify: `src/renderer/app.ts`

**Step 1: Create workshop with placeholder geometry**

We use simple box/plane geometry now. Real Meshy models replace these later.

```ts
// src/renderer/scene/workshop.ts
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
```

**Step 2: Add workshop to app.ts**

Replace the placeholder ground plane in `src/renderer/app.ts`:

```ts
// src/renderer/app.ts
import { SceneManager } from './scene/scene-manager';
import { Workshop } from './scene/workshop';

const container = document.getElementById('scene-container')!;
const sceneManager = new SceneManager(container);

const workshop = new Workshop();
sceneManager.scene.add(workshop.group);
```

**Step 3: Run dev and verify workshop renders**

Run: `npm run dev`
Expected: Workshop with floor grid, walls, ceiling beams, 6 workstation desks with monitors, and a central terminal desk.

**Step 4: Commit**

```bash
git add src/renderer/scene/workshop.ts src/renderer/app.ts
git commit -m "feat: add workshop environment with placeholder geometry and workstations"
```

---

### Task 7: Camera System

**Files:**
- Create: `src/renderer/scene/camera.ts`
- Modify: `src/renderer/app.ts`

**Step 1: Create camera controller**

```ts
// src/renderer/scene/camera.ts
import * as THREE from 'three';
import { CameraPreset } from '../../shared/types';

interface CameraPosition {
  position: THREE.Vector3;
  lookAt: THREE.Vector3;
}

const PRESETS: Record<CameraPreset, CameraPosition> = {
  'overview': {
    position: new THREE.Vector3(0, 10, 18),
    lookAt: new THREE.Vector3(0, 2, 0),
  },
  'terminal': {
    position: new THREE.Vector3(0, 4, 6),
    lookAt: new THREE.Vector3(0, 2.5, 2),
  },
  'ui-architect': {
    position: new THREE.Vector3(-10, 4, -2),
    lookAt: new THREE.Vector3(-10, 2, -6),
  },
  'backend-engineer': {
    position: new THREE.Vector3(-6, 4, -2),
    lookAt: new THREE.Vector3(-6, 2, -6),
  },
  'test-writer': {
    position: new THREE.Vector3(-2, 4, -2),
    lookAt: new THREE.Vector3(-2, 2, -6),
  },
  'trello-attacker': {
    position: new THREE.Vector3(10, 4, -2),
    lookAt: new THREE.Vector3(10, 2, -6),
  },
  'mobile-optimizer': {
    position: new THREE.Vector3(6, 4, -2),
    lookAt: new THREE.Vector3(6, 2, -6),
  },
  'qa-gatekeeper': {
    position: new THREE.Vector3(2, 4, -2),
    lookAt: new THREE.Vector3(2, 2, -6),
  },
};

const HOTKEY_MAP: Record<string, CameraPreset> = {
  '1': 'overview',
  '2': 'terminal',
  '3': 'ui-architect',
  '4': 'backend-engineer',
  '5': 'test-writer',
  '6': 'trello-attacker',
  '7': 'mobile-optimizer',
  '8': 'qa-gatekeeper',
};

export class CameraController {
  private camera: THREE.PerspectiveCamera;
  private currentPreset: CameraPreset = 'overview';
  private targetPosition: THREE.Vector3;
  private targetLookAt: THREE.Vector3;
  private currentLookAt: THREE.Vector3;
  private isTransitioning = false;
  private transitionSpeed = 3.0;
  autoFollow = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    const preset = PRESETS['overview'];
    this.targetPosition = preset.position.clone();
    this.targetLookAt = preset.lookAt.clone();
    this.currentLookAt = preset.lookAt.clone();
    this.camera.position.copy(preset.position);

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        this.autoFollow = !this.autoFollow;
        return;
      }
      const preset = HOTKEY_MAP[e.key];
      if (preset) {
        this.goTo(preset);
      }
    });
  }

  goTo(preset: CameraPreset) {
    this.currentPreset = preset;
    const target = PRESETS[preset];
    this.targetPosition.copy(target.position);
    this.targetLookAt.copy(target.lookAt);
    this.isTransitioning = true;
  }

  getCurrentPreset(): CameraPreset {
    return this.currentPreset;
  }

  update(delta: number) {
    if (!this.isTransitioning) return;

    const lerpFactor = 1 - Math.exp(-this.transitionSpeed * delta);

    this.camera.position.lerp(this.targetPosition, lerpFactor);
    this.currentLookAt.lerp(this.targetLookAt, lerpFactor);
    this.camera.lookAt(this.currentLookAt);

    if (this.camera.position.distanceTo(this.targetPosition) < 0.01) {
      this.camera.position.copy(this.targetPosition);
      this.currentLookAt.copy(this.targetLookAt);
      this.camera.lookAt(this.currentLookAt);
      this.isTransitioning = false;
    }
  }
}
```

**Step 2: Wire camera into app.ts**

```ts
import { CameraController } from './scene/camera';

const cameraController = new CameraController(sceneManager.camera);
sceneManager.onAnimate((delta) => {
  cameraController.update(delta);
});
```

**Step 3: Test camera hotkeys**

Run: `npm run dev`
Press keys 1-8. Expected: Camera smoothly glides between presets.

**Step 4: Commit**

```bash
git add src/renderer/scene/camera.ts src/renderer/app.ts
git commit -m "feat: add camera controller with 8 presets and smooth transitions"
```

---

## Phase 3: Terminal Integration

### Task 8: In-World Terminal (xterm.js on Three.js Mesh)

**Files:**
- Create: `src/renderer/terminal/terminal-mesh.ts`
- Create: `src/renderer/terminal/terminal-io.ts`
- Modify: `src/renderer/app.ts`

**Step 1: Create terminal I/O bridge**

```ts
// src/renderer/terminal/terminal-io.ts

declare global {
  interface Window {
    electronAPI: {
      sendShellInput: (input: string) => void;
      onShellOutput: (callback: (data: string) => void) => void;
      switchShell: (shell: string) => void;
      resizeShell: (cols: number, rows: number) => void;
      onAgentEvent: (callback: (event: { agent: string; event: string }) => void) => void;
    };
  }
}

export class TerminalIO {
  onOutput(callback: (data: string) => void) {
    window.electronAPI.onShellOutput(callback);
  }

  sendInput(data: string) {
    window.electronAPI.sendShellInput(data);
  }

  resize(cols: number, rows: number) {
    window.electronAPI.resizeShell(cols, rows);
  }

  switchShell(shell: string) {
    window.electronAPI.switchShell(shell);
  }
}
```

**Step 2: Create terminal mesh**

```ts
// src/renderer/terminal/terminal-mesh.ts
import * as THREE from 'three';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { TerminalIO } from './terminal-io';

export class TerminalMesh {
  mesh: THREE.Mesh;
  private terminal: Terminal;
  private fitAddon: FitAddon;
  private io: TerminalIO;
  private canvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;
  private hiddenContainer: HTMLDivElement;
  private needsUpdate = false;

  constructor(io: TerminalIO) {
    this.io = io;

    // Hidden container for xterm.js (it needs a DOM element)
    this.hiddenContainer = document.createElement('div');
    this.hiddenContainer.style.position = 'absolute';
    this.hiddenContainer.style.left = '-9999px';
    this.hiddenContainer.style.width = '960px';
    this.hiddenContainer.style.height = '540px';
    document.body.appendChild(this.hiddenContainer);

    // Initialize xterm.js
    this.terminal = new Terminal({
      cols: 120,
      rows: 30,
      theme: {
        background: '#0a0a1a',
        foreground: '#00ffcc',
        cursor: '#00ffcc',
        cyan: '#00ffff',
        green: '#00ff66',
        magenta: '#ff00ff',
        yellow: '#ffff00',
        red: '#ff3366',
        blue: '#3366ff',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(this.hiddenContainer);
    this.fitAddon.fit();

    // Canvas for texture
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 512;

    // Three.js texture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Monitor mesh
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 2.5),
      new THREE.MeshStandardMaterial({
        map: this.texture,
        emissive: 0x003322,
        emissiveIntensity: 0.3,
      })
    );
    this.mesh.position.set(0, 3, 1);

    // Wire up I/O
    this.terminal.onData((data) => {
      this.io.sendInput(data);
    });

    this.io.onOutput((data) => {
      this.terminal.write(data);
      this.needsUpdate = true;
    });

    this.terminal.onRender(() => {
      this.needsUpdate = true;
    });
  }

  focus() {
    this.terminal.focus();
  }

  update() {
    if (!this.needsUpdate) return;
    this.needsUpdate = false;

    const xtermCanvas = this.hiddenContainer.querySelector('canvas');
    if (xtermCanvas) {
      const ctx = this.canvas.getContext('2d')!;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(xtermCanvas, 0, 0, this.canvas.width, this.canvas.height);
      this.texture.needsUpdate = true;
    }
  }
}
```

**Step 3: Wire terminal into app.ts**

```ts
import { TerminalIO } from './terminal/terminal-io';
import { TerminalMesh } from './terminal/terminal-mesh';

const terminalIO = new TerminalIO();
const terminalMesh = new TerminalMesh(terminalIO);
sceneManager.scene.add(terminalMesh.mesh);

sceneManager.onAnimate(() => {
  terminalMesh.update();
});

terminalMesh.focus();
```

**Step 4: Test terminal renders in 3D scene**

Run: `npm run dev`
Expected: PowerShell terminal visible as a glowing screen in the 3D workshop. You can type commands and see output.

**Step 5: Commit**

```bash
git add src/renderer/terminal/ src/renderer/app.ts
git commit -m "feat: add in-world terminal with xterm.js rendered as Three.js texture"
```

---

## Phase 4: Agent System

### Task 9: Agent State Manager

**Files:**
- Create: `src/renderer/agents/agent-manager.ts`
- Modify: `src/renderer/app.ts`

**Step 1: Create agent state manager**

```ts
// src/renderer/agents/agent-manager.ts
import { AGENT_MAP, AgentConfig } from '../../shared/agent-config';

export type RobotState = 'idle' | 'active' | 'complete';

export interface AgentStatus {
  id: string;
  config: AgentConfig;
  state: RobotState;
}

type AgentEventCallback = (agentId: string, state: RobotState) => void;

export class AgentManager {
  private agents: Map<string, AgentStatus> = new Map();
  private listeners: AgentEventCallback[] = [];

  constructor() {
    for (const [id, config] of Object.entries(AGENT_MAP)) {
      this.agents.set(id, { id, config, state: 'idle' });
    }

    window.electronAPI.onAgentEvent((event) => {
      this.handleEvent(event.agent, event.event as 'start' | 'complete');
    });
  }

  private handleEvent(agentId: string, event: 'start' | 'complete') {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    if (event === 'start') {
      agent.state = 'active';
      this.notify(agentId, 'active');
    } else if (event === 'complete') {
      agent.state = 'complete';
      this.notify(agentId, 'complete');

      setTimeout(() => {
        agent.state = 'idle';
        this.notify(agentId, 'idle');
      }, 2000);
    }
  }

  onStateChange(callback: AgentEventCallback) {
    this.listeners.push(callback);
  }

  private notify(agentId: string, state: RobotState) {
    for (const listener of this.listeners) {
      listener(agentId, state);
    }
  }

  getAgent(id: string): AgentStatus | undefined {
    return this.agents.get(id);
  }

  getAllAgents(): AgentStatus[] {
    return Array.from(this.agents.values());
  }
}
```

**Step 2: Wire into app.ts**

```ts
import { AgentManager } from './agents/agent-manager';

const agentManager = new AgentManager();

agentManager.onStateChange((agentId, state) => {
  if (state === 'active' && cameraController.autoFollow) {
    cameraController.goTo(agentId as any);
  }
  if (state === 'idle' && cameraController.autoFollow) {
    cameraController.goTo('overview');
  }
});
```

**Step 3: Test agent events via curl**

Run: `npm run dev`, then curl to test.
Expected: Agent state changes trigger correctly.

**Step 4: Commit**

```bash
git add src/renderer/agents/agent-manager.ts src/renderer/app.ts
git commit -m "feat: add agent state manager with event handling from hook server"
```

---

### Task 10: Robot Placeholder Models & Animation Stubs

**Files:**
- Create: `src/renderer/agents/robot-loader.ts`
- Create: `src/renderer/agents/workstation.ts`
- Modify: `src/renderer/app.ts`

**Step 1: Create robot with placeholder geometry**

```ts
// src/renderer/agents/robot-loader.ts
import * as THREE from 'three';
import { AgentConfig } from '../../shared/agent-config';
import { RobotState } from './agent-manager';

export class Robot {
  group: THREE.Group;
  private headMesh: THREE.Mesh;
  private bodyMesh: THREE.Mesh;
  private eyeMaterial: THREE.MeshStandardMaterial;
  private state: RobotState = 'idle';
  private idleTime = 0;
  private activeTime = 0;
  private baseY: number;

  constructor(config: AgentConfig, position: THREE.Vector3) {
    this.group = new THREE.Group();
    this.baseY = position.y;

    const bodyColor = new THREE.Color(config.color).multiplyScalar(0.3);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: bodyColor,
      metalness: 0.7,
      roughness: 0.3,
    });

    this.eyeMaterial = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: 0.2,
    });

    // Body
    this.bodyMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.5),
      bodyMaterial
    );
    this.bodyMesh.position.y = 1.6;
    this.bodyMesh.castShadow = true;
    this.group.add(this.bodyMesh);

    // Head
    this.headMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.5),
      bodyMaterial
    );
    this.headMesh.position.y = 2.6;
    this.headMesh.castShadow = true;
    this.group.add(this.headMesh);

    // Eyes
    const leftEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.08),
      this.eyeMaterial
    );
    leftEye.position.set(-0.15, 2.65, 0.26);
    this.group.add(leftEye);

    const rightEye = new THREE.Mesh(
      new THREE.SphereGeometry(0.08),
      this.eyeMaterial
    );
    rightEye.position.set(0.15, 2.65, 0.26);
    this.group.add(rightEye);

    // Arms
    const armMaterial = bodyMaterial.clone();
    const leftArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.2),
      armMaterial
    );
    leftArm.position.set(-0.6, 1.6, 0);
    this.group.add(leftArm);

    const rightArm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.8, 0.2),
      armMaterial
    );
    rightArm.position.set(0.6, 1.6, 0);
    this.group.add(rightArm);

    // Legs
    const leftLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.8, 0.25),
      armMaterial
    );
    leftLeg.position.set(-0.2, 0.5, 0);
    this.group.add(leftLeg);

    const rightLeg = new THREE.Mesh(
      new THREE.BoxGeometry(0.25, 0.8, 0.25),
      armMaterial
    );
    rightLeg.position.set(0.2, 0.5, 0);
    this.group.add(rightLeg);

    this.group.position.copy(position);
  }

  setState(state: RobotState) {
    this.state = state;

    switch (state) {
      case 'idle':
        this.eyeMaterial.emissiveIntensity = 0.2;
        break;
      case 'active':
        this.eyeMaterial.emissiveIntensity = 1.5;
        this.activeTime = 0;
        break;
      case 'complete':
        this.eyeMaterial.emissiveIntensity = 2.0;
        break;
    }
  }

  update(delta: number) {
    this.idleTime += delta;

    if (this.state === 'idle') {
      this.group.position.y = this.baseY + Math.sin(this.idleTime * 1.5) * 0.05;
      this.headMesh.rotation.y = Math.sin(this.idleTime * 0.5) * 0.1;
    } else if (this.state === 'active') {
      this.activeTime += delta;
      this.group.position.y = this.baseY + Math.sin(this.activeTime * 3) * 0.08;
      this.headMesh.rotation.y = Math.sin(this.activeTime * 2) * 0.3;
      this.bodyMesh.rotation.z = Math.sin(this.activeTime * 4) * 0.05;
      const leftArm = this.group.children[4] as THREE.Mesh;
      const rightArm = this.group.children[5] as THREE.Mesh;
      leftArm.rotation.x = Math.sin(this.activeTime * 5) * 0.4;
      rightArm.rotation.x = Math.sin(this.activeTime * 5 + Math.PI) * 0.4;
    } else if (this.state === 'complete') {
      const scale = 1 + Math.sin(this.idleTime * 8) * 0.05;
      this.group.scale.setScalar(scale);
    }
  }
}
```

**Step 2: Create workstation reactivity**

```ts
// src/renderer/agents/workstation.ts
import * as THREE from 'three';
import { RobotState } from './agent-manager';

export class Workstation {
  group: THREE.Group;
  private light: THREE.PointLight;
  private screenMaterial: THREE.MeshStandardMaterial;
  private state: RobotState = 'idle';

  constructor(position: THREE.Vector3, color: string) {
    this.group = new THREE.Group();

    this.light = new THREE.PointLight(color, 0.3, 5);
    this.light.position.set(0, 3, 0);
    this.group.add(this.light);

    this.screenMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a1a,
      emissive: color,
      emissiveIntensity: 0.1,
    });
    const screenMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.8),
      this.screenMaterial
    );
    screenMesh.position.set(0, 2, -0.7);
    this.group.add(screenMesh);

    this.group.position.copy(position);
  }

  setState(state: RobotState) {
    this.state = state;
    switch (state) {
      case 'idle':
        this.light.intensity = 0.3;
        this.screenMaterial.emissiveIntensity = 0.1;
        break;
      case 'active':
        this.light.intensity = 2.0;
        this.screenMaterial.emissiveIntensity = 1.0;
        break;
      case 'complete':
        this.light.intensity = 3.0;
        this.screenMaterial.emissiveIntensity = 1.5;
        break;
    }
  }
}
```

**Step 3: Wire robots and workstations into app.ts**

```ts
import * as THREE from 'three';
import { Robot } from './agents/robot-loader';
import { Workstation } from './agents/workstation';
import { AGENT_MAP } from '../shared/agent-config';

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

  const workstation = new Workstation(pos, config.color);
  workstations.set(id, workstation);
  sceneManager.scene.add(workstation.group);
}

agentManager.onStateChange((agentId, state) => {
  robots.get(agentId)?.setState(state);
  workstations.get(agentId)?.setState(state);
});

sceneManager.onAnimate((delta) => {
  for (const robot of robots.values()) {
    robot.update(delta);
  }
});
```

**Step 4: Test robots respond to agent events**

Run: `npm run dev`, curl to activate an agent.
Expected: Robot animates energetically, workstation lights up.

**Step 5: Commit**

```bash
git add src/renderer/agents/ src/renderer/app.ts
git commit -m "feat: add placeholder robots and workstations with state-driven animations"
```

---

## Phase 5: UI Overlay (HUD)

### Task 11: HUD Overlay

**Files:**
- Create: `src/renderer/ui/overlay.ts`
- Create: `src/renderer/ui/styles.css`
- Modify: `src/renderer/index.html`
- Modify: `src/renderer/app.ts`

**Step 1: Add HUD container to HTML**

Add to `src/renderer/index.html` inside `#app`, after `#scene-container`:

```html
<div id="hud-overlay">
  <div id="hud-top">
    <div id="shell-toggle">
      <button class="shell-btn active" data-shell="powershell">PS</button>
      <button class="shell-btn" data-shell="bash">Bash</button>
    </div>
    <div id="camera-buttons">
      <button class="cam-btn active" data-preset="1">1</button>
      <button class="cam-btn" data-preset="2">2</button>
      <button class="cam-btn" data-preset="3">3</button>
      <button class="cam-btn" data-preset="4">4</button>
      <button class="cam-btn" data-preset="5">5</button>
      <button class="cam-btn" data-preset="6">6</button>
      <button class="cam-btn" data-preset="7">7</button>
      <button class="cam-btn" data-preset="8">8</button>
    </div>
  </div>
  <div id="hud-bottom">
    <div id="agent-status"></div>
  </div>
</div>
<link rel="stylesheet" href="./ui/styles.css" />
```

**Step 2: Create HUD styles**

```css
/* src/renderer/ui/styles.css */
#hud-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
  font-family: 'Consolas', 'Courier New', monospace;
}

#hud-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  pointer-events: auto;
}

#shell-toggle {
  display: flex;
  gap: 4px;
}

.shell-btn {
  background: rgba(10, 10, 26, 0.7);
  border: 1px solid rgba(0, 255, 204, 0.3);
  color: rgba(0, 255, 204, 0.6);
  padding: 6px 16px;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.shell-btn:hover {
  border-color: rgba(0, 255, 204, 0.6);
  color: rgba(0, 255, 204, 0.9);
}

.shell-btn.active {
  background: rgba(0, 255, 204, 0.15);
  border-color: #00ffcc;
  color: #00ffcc;
}

#camera-buttons {
  display: flex;
  gap: 4px;
}

.cam-btn {
  background: rgba(10, 10, 26, 0.7);
  border: 1px solid rgba(0, 255, 255, 0.3);
  color: rgba(0, 255, 255, 0.6);
  width: 32px;
  height: 32px;
  font-family: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.cam-btn:hover {
  border-color: rgba(0, 255, 255, 0.6);
}

.cam-btn.active {
  background: rgba(0, 255, 255, 0.15);
  border-color: #00ffff;
  color: #00ffff;
}

#hud-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 20px;
  pointer-events: auto;
}

#agent-status {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.agent-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: rgba(10, 10, 26, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.agent-indicator:hover {
  border-color: rgba(255, 255, 255, 0.3);
}

.agent-indicator.active {
  border-color: var(--agent-color);
  box-shadow: 0 0 10px var(--agent-color-dim);
}

.agent-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 0.3s;
}

.agent-indicator.active .agent-dot {
  background: var(--agent-color);
  box-shadow: 0 0 8px var(--agent-color);
}

.agent-name {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.agent-indicator.active .agent-name {
  color: var(--agent-color);
}

.agent-state-text {
  font-size: 10px;
  color: rgba(255, 255, 255, 0.3);
}

.agent-indicator.active .agent-state-text {
  color: var(--agent-color);
}
```

**Step 3: Create overlay controller**

```ts
// src/renderer/ui/overlay.ts
import { AGENT_MAP } from '../../shared/agent-config';
import { AgentManager, RobotState } from '../agents/agent-manager';
import { CameraController } from '../scene/camera';
import { CameraPreset } from '../../shared/types';
import { TerminalIO } from '../terminal/terminal-io';

const CAMERA_PRESET_KEYS: CameraPreset[] = [
  'overview', 'terminal', 'ui-architect', 'backend-engineer',
  'test-writer', 'trello-attacker', 'mobile-optimizer', 'qa-gatekeeper'
];

export class Overlay {
  constructor(
    agentManager: AgentManager,
    cameraController: CameraController,
    terminalIO: TerminalIO
  ) {
    this.setupAgentStatus(agentManager, cameraController);
    this.setupCameraButtons(cameraController);
    this.setupShellToggle(terminalIO);
  }

  private setupAgentStatus(agentManager: AgentManager, camera: CameraController) {
    const container = document.getElementById('agent-status')!;

    for (const [id, config] of Object.entries(AGENT_MAP)) {
      const indicator = document.createElement('div');
      indicator.className = 'agent-indicator';
      indicator.dataset.agentId = id;
      indicator.style.setProperty('--agent-color', config.color);
      indicator.style.setProperty('--agent-color-dim', config.color + '44');

      const dot = document.createElement('div');
      dot.className = 'agent-dot';
      indicator.appendChild(dot);

      const name = document.createElement('span');
      name.className = 'agent-name';
      name.textContent = config.displayName;
      indicator.appendChild(name);

      const stateText = document.createElement('span');
      stateText.className = 'agent-state-text';
      stateText.textContent = 'Idle';
      indicator.appendChild(stateText);

      indicator.addEventListener('click', () => {
        camera.goTo(id as CameraPreset);
      });
      container.appendChild(indicator);
    }

    agentManager.onStateChange((agentId, state) => {
      const indicator = container.querySelector(`[data-agent-id="${agentId}"]`);
      if (!indicator) return;
      indicator.className = `agent-indicator ${state === 'active' ? 'active' : ''}`;
      const stateText = indicator.querySelector('.agent-state-text')!;
      stateText.textContent = state === 'active' ? 'Working...' : state === 'complete' ? 'Done!' : 'Idle';
    });
  }

  private setupCameraButtons(camera: CameraController) {
    const buttons = document.querySelectorAll('.cam-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const preset = parseInt((btn as HTMLElement).dataset.preset!) - 1;
        camera.goTo(CAMERA_PRESET_KEYS[preset]);
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  private setupShellToggle(terminalIO: TerminalIO) {
    const buttons = document.querySelectorAll('.shell-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const shell = (btn as HTMLElement).dataset.shell!;
        terminalIO.switchShell(shell);
        buttons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }
}
```

**Step 4: Wire overlay into app.ts**

```ts
import { Overlay } from './ui/overlay';

new Overlay(agentManager, cameraController, terminalIO);
```

**Step 5: Test HUD displays and interacts correctly**

Run: `npm run dev`
Expected: HUD top/bottom bars visible. Shell toggle and camera buttons work. Agent indicators respond to events.

**Step 6: Commit**

```bash
git add src/renderer/ui/ src/renderer/index.html src/renderer/app.ts
git commit -m "feat: add cyberpunk HUD overlay with shell toggle, camera buttons, and agent status"
```

---

## Phase 6: City Backdrop & Post-Processing

### Task 12: City Skyline Backdrop

**Files:**
- Create: `src/renderer/scene/city-backdrop.ts`
- Modify: `src/renderer/app.ts`

**Step 1: Create city backdrop with procedural buildings and skybox**

```ts
// src/renderer/scene/city-backdrop.ts
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
```

**Step 2: Wire into app.ts**

```ts
import { CityBackdrop } from './scene/city-backdrop';

const city = new CityBackdrop();
sceneManager.scene.add(city.group);

sceneManager.onAnimate((delta) => {
  city.update(delta);
});
```

**Step 3: Test city renders through window**

Run: `npm run dev`
Expected: Neon-lit city visible through right wall. Rain particles falling. Dark sky with stars.

**Step 4: Commit**

```bash
git add src/renderer/scene/city-backdrop.ts src/renderer/app.ts
git commit -m "feat: add procedural cyberpunk city backdrop with neon buildings and rain"
```

---

### Task 13: Post-Processing Effects

**Files:**
- Modify: `src/renderer/scene/scene-manager.ts`

**Step 1: Install post-processing**

Run: `npm install postprocessing`

**Step 2: Add post-processing pipeline to scene manager**

Add bloom, chromatic aberration, and vignette to `scene-manager.ts`. Import from `postprocessing` package:

```ts
import { EffectComposer, BloomEffect, ChromaticAberrationEffect, VignetteEffect, EffectPass, RenderPass } from 'postprocessing';
```

Create the composer after renderer setup, add RenderPass and EffectPass with bloom (intensity 1.5, threshold 0.4), chromatic aberration (offset 0.001), and vignette (darkness 0.5). Replace `this.renderer.render()` with `composer.render(delta)` in the animation loop.

**Step 3: Test post-processing looks correct**

Run: `npm run dev`
Expected: Bloom on neon/emissive objects, chromatic aberration at edges, vignette at corners. Still 60 FPS.

**Step 4: Commit**

```bash
git add src/renderer/scene/scene-manager.ts package.json package-lock.json
git commit -m "feat: add bloom, chromatic aberration, and vignette post-processing"
```

---

## Phase 7: Claude Code Hook Scripts

### Task 14: Hook Parser Script

**Files:**
- Create: `src/hooks/parse-agent-event.js`

**Step 1: Create the parser script**

A Node.js script that reads Claude Code tool input from stdin, searches for known agent keywords, and POSTs to localhost:3847 if a match is found. Exits silently on no match or connection failure.

Takes one argument: event type (`start` or `complete`).

**Step 2: Test the parser script**

```bash
echo "{\"subagent_type\":\"ui-architect\",\"prompt\":\"Fix the layout\"}" | node src/hooks/parse-agent-event.js start
```
Expected: Posts to localhost:3847 if running, exits silently if not.

**Step 3: Commit**

```bash
git add src/hooks/
git commit -m "feat: add Claude Code hook parser script for agent event detection"
```

---

### Task 15: Claude Code Hook Configuration Docs

**Files:**
- Create: `docs/claude-code-hooks-setup.md`

**Step 1: Write setup documentation**

Document how to add PreToolUse and PostToolUse hooks to `.claude/settings.json` that pipe `$CLAUDE_TOOL_INPUT` into `parse-agent-event.js`. Include the full JSON config with matcher for the "Task" tool.

**Step 2: Commit**

```bash
git add docs/claude-code-hooks-setup.md
git commit -m "docs: add Claude Code hooks setup instructions"
```

---

## Phase 8: Asset Integration (3D Models)

### Task 16: GLB Model Loader

**Files:**
- Modify: `src/renderer/agents/robot-loader.ts`

**Step 1: Add GLTFLoader for real models**

Add an `async loadModel(modelPath: string)` method to the Robot class that:
1. Uses GLTFLoader from `three/addons/loaders/GLTFLoader.js`
2. Loads the GLB file
3. Removes placeholder geometry
4. Adds the loaded scene
5. Sets up AnimationMixer if model has animations
6. Falls back to placeholder geometry on load failure

**Step 2: Test with a sample GLB if available**

Place any test GLB in `assets/models/` and update the model path. Placeholder geometry works as fallback.

**Step 3: Commit**

```bash
git add src/renderer/agents/robot-loader.ts
git commit -m "feat: add GLB model loading with placeholder fallback for robot agents"
```

---

## Phase 9: Polish & Testing

### Task 17: Integration Testing

**Step 1: Full flow test checklist**

1. Electron window opens with 3D workshop scene
2. Terminal renders and accepts input
3. Camera hotkeys 1-8 work with smooth transitions
4. Shell toggle between PowerShell and Bash works
5. Curl agent events trigger robot animations + workstation reactivity
6. City backdrop renders through window
7. Post-processing effects active
8. 60 FPS target met (Electron DevTools Performance tab)
9. HUD overlay displays correctly and buttons work
10. Multiple agents can be active simultaneously

**Step 2: Fix any issues found**

**Step 3: Commit fixes**

---

### Task 18: Build & Package

**Files:**
- Create/Modify: `electron-builder.yml`
- Modify: `package.json`

**Step 1: Configure electron-builder**

Set appId, productName, output directory, Windows NSIS target, file includes for dist and assets.

**Step 2: Add build script**

Add `"build:dist": "vite build && electron-builder"` to package.json scripts.

**Step 3: Test build**

Run: `npm run build:dist`
Expected: Produces installer in `release/` directory.

**Step 4: Commit**

```bash
git add electron-builder.yml package.json
git commit -m "feat: add Electron build and packaging configuration"
```

---

## Summary: Build Order

| Phase | Tasks | What You Get |
|-------|-------|-------------|
| 1: Scaffolding | 1-4 | Running Electron app with shell and hook server |
| 2: 3D Scene | 5-7 | Workshop with lighting, workstations, and camera |
| 3: Terminal | 8 | Working terminal in the 3D scene |
| 4: Agents | 9-10 | Robots that react to hook events |
| 5: HUD | 11 | Shell toggle, camera buttons, agent status |
| 6: Visuals | 12-13 | City backdrop and post-processing |
| 7: Hooks | 14-15 | Claude Code integration scripts |
| 8: Assets | 16 | Real 3D model support |
| 9: Polish | 17-18 | Testing and packaging |

## Your First Step

**Start with NanoBanana.** While the code implementation follows the phases above, you should begin generating concept art for your 6 robot agents NOW, in parallel. This is the longest lead-time item because:
1. Concept art iteration in NanoBanana takes creative rounds
2. Meshy image-to-3D processing takes time
3. Mixamo rigging + animation selection takes time
4. The code can use placeholder geometry until models are ready (Task 10 handles this)

So the recommended parallel tracks are:
- **Track A (Art):** NanoBanana concepts -> Meshy models -> Mixamo animations
- **Track B (Code):** Phase 1 -> Phase 2 -> ... -> Phase 9

Track B does not block on Track A. You swap in real models at Phase 8 (Task 16).
