# 3D Terminal Environment - Design Document

**Date:** 2026-03-02
**Status:** Approved

## Problem

Spending extended time in a plain PowerShell/terminal window is visually fatiguing. There is no visual feedback when AI agents are working on your behalf.

## Solution

A 3D interactive cyberpunk workshop environment that houses an embedded terminal and visualizes AI agent activity as animated robot characters at workstations.

## Architecture

**Approach:** Monolithic Electron App

```
Electron Main Process
  ├── Shell Manager (PowerShell / Bash via node-pty)
  ├── Hook Event Server (local HTTP, listens for Claude Code hook triggers)
  └── Window Manager

Electron Renderer Process
  ├── Three.js Scene (workshop, robots, city skyline)
  ├── xterm.js Terminal (rendered as in-world screen texture)
  ├── Agent State Manager (maps hook events → robot animations)
  └── Camera Controller (fixed angle presets)
```

**Data Flow:**
- Claude Code hook → HTTP POST → Main Process → IPC → Renderer → Agent State Manager → Robot Animation
- User keystroke → xterm.js → IPC → Main Process → node-pty → Shell → stdout → IPC → xterm.js

## Tech Stack

| Layer | Technology |
|-------|-----------|
| App shell | Electron 30+ |
| 3D rendering | Three.js r160+ |
| Terminal | xterm.js + xterm-addon-fit + xterm-addon-webgl |
| Shell backend | node-pty |
| Hook server | Express.js |
| Build tool | Vite |
| Language | TypeScript |
| Package manager | npm |

## 3D Environment

### The Workshop
- Rectangular industrial space with high ceilings, exposed beams, metal grating floors
- Cyberpunk aesthetic: neon accent lighting (cyan, magenta, orange), holographic displays, cable runs, steam/particle effects
- Large panoramic windows revealing the city outside

### The Terminal Station
- Central workstation with a large monitor where xterm.js renders
- Focal point of the default camera angle
- Emissive glow matching cyberpunk palette

### Agent Workstations (6 stations)

| Agent | Robot Personality | Workstation Vibe |
|-------|------------------|------------------|
| UI Architect | Sleek, precision-built, many arms/tools | Design table with floating holographic screens |
| Backend Engineer | Heavy, industrial, tank-like | Server rack station with cables and blinking lights |
| Test Writer | Analytical, scanner-like optics | QA bench with diagnostic displays |
| Trello Attacker | Fast, agile, multiple limbs | Task board wall with pinned cards/holographic tickets |
| Mobile Optimizer | Compact, efficient, streamlined | Mobile device testing rig with various screens |
| Q&A Gatekeeper | Armored, sentinel-like, imposing | Guard post/checkpoint station with shields |

### The City Outside
- Visible through workshop windows
- Cyberpunk skyline: towering buildings, neon signs, flying vehicles, rain/fog
- Skybox + parallax layers (not fully modeled city)
- Animated elements: blinking lights, moving vehicles (particle paths), volumetric fog

### Lighting
- Moody ambient base (dark blues/purples)
- Neon accent lights from workstations and signage (cyan, magenta, warm orange)
- Volumetric light rays through windows
- Emissive materials on screens, robot eyes, status indicators

## Robot Agents & Animations

### Design Language
- Common cyberpunk industrial aesthetic, distinct silhouettes and color accents
- Roughly humanoid proportions (required for Mixamo auto-rigging)
- Glowing eyes that change color based on state
- Metallic/chrome base materials with colored emissive accents

### Agent States

| State | Visual | Animation |
|-------|--------|-----------|
| Idle | Dim eyes, subtle breathing/hover | Gentle idle - slight sway, occasional head turn |
| Active | Bright eyes, workstation lights up | Working animation at station (role-specific) |
| Complete | Brief flash/pulse effect | Completion flourish, status indicator turns green, returns to idle |

### Per-Agent Active Animations

| Agent | Active Animation |
|-------|-----------------|
| UI Architect | Manipulating holographic UI panels, resizing/dragging elements |
| Backend Engineer | Plugging cables, turning wrenches on server racks |
| Test Writer | Scanning with optic beam, checking off diagnostic items |
| Trello Attacker | Grabbing and moving cards on task board |
| Mobile Optimizer | Swapping between devices, running across screens |
| Q&A Gatekeeper | Raising shields, scanning items, stamping approvals |

### Animation Pipeline
1. NanoBanana → concept art for each robot
2. Meshy Pro → image-to-3D (GLB/GLTF export)
3. Mixamo → auto-rigging + animation library
4. Blender → custom animations only if Mixamo doesn't cover it

## Claude Code Hook Integration

### Event Server
- Electron main process runs a local HTTP server on `localhost:3847`
- Claude Code hooks POST JSON payloads to it on agent start/stop

### Hook Configuration
Hooks in `.claude/settings.json` fire on PreToolUse/PostToolUse for the Task tool. A parser script (`parse-agent-event.js`) extracts agent identity from tool input JSON.

### Event Flow
1. Agent invoked (by user or Claude autonomously)
2. PreToolUse hook fires → curl POSTs `{ agent, event: "start" }` to localhost:3847
3. Electron main process receives → IPC to renderer
4. Agent State Manager maps agent name → robot → triggers active animation
5. PostToolUse hook fires → `{ event: "complete" }` → robot returns to idle

### Agent Name Mapping
Config file maps skill/agent names to robot IDs. Unmapped agents are ignored silently.

### Resilience
- If 3D environment isn't running, curl commands fail silently
- Multiple agents can be active simultaneously
- Unmapped agent names are ignored

## Camera System

### Presets

| Hotkey | Camera | View |
|--------|--------|------|
| 1 | Overview (default) | Full workshop, all robots visible |
| 2 | Terminal Focus | Close-up on terminal screen |
| 3-8 | Agent Focus | One per agent workstation |

### Behavior
- Smooth lerp transitions (0.5-1s ease-in-out)
- Subtle camera nudge when an agent activates
- Auto-follow mode (Tab toggle): camera follows active agent automatically

## UI Overlay (HUD)

### Top Bar
- Shell switcher (PowerShell / Bash toggle)
- Camera preset buttons
- Semi-transparent, cyberpunk styled

### Bottom Bar
- Agent status indicators (glow when active, dim when idle)
- Click agent name to switch camera to their workstation
- Shows agent name + status text

Terminal is NOT in the overlay - it renders in-world on the 3D screen mesh.

## Performance Budget (3060 12GB Target)

**Target:** 60 FPS stable at 1920x1080

| Budget Item | Allocation |
|-------------|-----------|
| Robot models | ~20-30K tris each x 6 = ~150K |
| Workshop environment | ~100K |
| City backdrop | ~50K geometry + skybox |
| Props/furniture | ~100K |
| Total | < 500K triangles |

### Texture Budget
- 2K textures for robots, 1K for props/environment
- Single 2K skybox cubemap
- Total VRAM target: < 2GB

### Optimization Strategies
- LOD: Simplified meshes for off-camera robots
- Instanced rendering for repeated props
- Frustum culling (Three.js default)
- Baked lighting for base illumination
- Post-processing: bloom + chromatic aberration + vignette only
- City skyline: parallax layers, not full geometry
- Terminal texture updates only on content change
- Only active robots run skeletal animations
- Idle robots use shader-based breathing effect

## Project Structure

```
3dTerminalEnvironment/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts
│   │   ├── shell-manager.ts
│   │   ├── hook-server.ts
│   │   └── ipc-handlers.ts
│   ├── renderer/                # Electron renderer process
│   │   ├── index.html
│   │   ├── app.ts
│   │   ├── scene/
│   │   │   ├── scene-manager.ts
│   │   │   ├── workshop.ts
│   │   │   ├── city-backdrop.ts
│   │   │   ├── lighting.ts
│   │   │   └── camera.ts
│   │   ├── agents/
│   │   │   ├── agent-manager.ts
│   │   │   ├── robot-loader.ts
│   │   │   └── workstation.ts
│   │   ├── terminal/
│   │   │   ├── terminal-mesh.ts
│   │   │   └── terminal-io.ts
│   │   └── ui/
│   │       ├── overlay.ts
│   │       └── styles.css
│   ├── shared/
│   │   ├── agent-config.ts
│   │   └── types.ts
│   └── hooks/
│       └── parse-agent-event.js
├── assets/
│   ├── models/
│   ├── textures/
│   ├── animations/
│   └── audio/
├── docs/plans/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── electron-builder.yml
```

## Asset Pipeline Summary

| Asset Type | Pipeline |
|-----------|----------|
| Robot agents | NanoBanana → Meshy image-to-3D → Mixamo → (Blender if needed) |
| Animated props | Three.js shader animations |
| Static props | NanoBanana → Meshy (or Meshy text-to-3D direct) |
| City skyline | NanoBanana skybox + simple Meshy building meshes |
| Particle effects | Pure Three.js code |

## Shell Support
- PowerShell and Bash/WSL supported
- Switchable via UI toggle or hotkey
- Multiple shell tabs supported
