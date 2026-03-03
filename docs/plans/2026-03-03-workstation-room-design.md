# Workstation & Room Design

**Date:** 2026-03-03
**Status:** Approved

## Overview

Redesign the workshop room and all 6 agent workstations from generic identical desks into a clean sci-fi lab with unique, role-specific stations arranged in a semicircle around a central command podium.

## Room Shell

### Layout: Semicircle

- Terminal command podium at center `(0, 0, 2)`
- 6 workstations on an arc of radius ~12, spanning ~150 degrees
- Arc center at `(0, 0, 0)`, curving from roughly `(-11, 0, -8)` to `(11, 0, -8)`
- Each station rotated to face inward toward the terminal
- Station order (left to right when viewed from terminal):
  1. UI Architect
  2. Backend Engineer
  3. Test Writer
  4. QA Gatekeeper
  5. Mobile Optimizer
  6. Trello Attacker

```
         [City windows - right wall]

  UI Arch     Backend     Test Writer
    \            |            /
     \           |           /
      ----  TERMINAL  ----
     /           |           \
    /            |            \
  QA Gate    Mobile Opt   Trello Atk

         [City windows - left wall]
```

### Position Calculation

```typescript
const ARC_RADIUS = 12;
const ARC_CENTER = new THREE.Vector3(0, 0, 0);
const ARC_START_ANGLE = Math.PI * 0.6;   // ~108 degrees
const ARC_END_ANGLE = Math.PI * 1.4;     // ~252 degrees (wrapping behind)
const AGENT_ORDER = [
  'ui-architect',       // leftmost
  'backend-engineer',
  'test-writer',
  'qa-gatekeeper',      // rightmost-back
  'mobile-optimizer',
  'trello-attacker',    // rightmost
];

// For each agent at index i (0-5):
const angle = ARC_START_ANGLE + (i / 5) * (ARC_END_ANGLE - ARC_START_ANGLE);
const x = ARC_CENTER.x + Math.cos(angle) * ARC_RADIUS;
const z = ARC_CENTER.z + Math.sin(angle) * ARC_RADIUS;
const rotation_y = Math.atan2(-x, -z); // face toward center
```

### Dimensions

- Floor: 30 x 20 (unchanged)
- Walls: 8 units high (unchanged)
- Ceiling: 8 units (unchanged)

### Floor

- **Material:** Polished dark (`color: 0x0a0a1e`, `metalness: 0.7`, `roughness: 0.2`) for subtle reflections
- **Guide arcs:** Thin emissive cyan lines tracing the semicircle path on the floor where stations sit (`RingGeometry` or custom curve)
- **Terminal ring:** Circular emissive ring (`RingGeometry`, radius ~2) in the floor beneath the command podium, subtle pulse animation

### Walls

- **Back wall:** Opaque, dark material with thin horizontal LED strips along top and bottom edges (cyan emissive `BoxGeometry` strips)
- **Side walls:** Semi-transparent (unchanged - windows to city backdrop)
- **Edge lighting:** Thin emissive strips at wall/floor and wall/ceiling junctions

### Ceiling

- **Beams:** Keep exposed beams (unchanged)
- **Downlights:** One colored `SpotLight` or `PointLight` above each workstation, matching that agent's accent color, intensity tied to agent state
- **Ambient panels:** Subtle emissive planes between beams for soft ambient fill

### Aesthetic

- Clean sci-fi lab: sleek surfaces, glass-like accents, bright neon edge lighting
- Color palette: dark blues/purples for surfaces, agent-specific neon accents
- No grit, rust, or industrial damage - everything is polished and precise

---

## Terminal Command Podium

Replaces the current plain `BoxGeometry` desk at `(0, 1, 2)`.

### Components

| Element | Geometry | Material | Position |
|---------|----------|----------|----------|
| Pedestal base | `CylinderGeometry(0.8, 1.0, 1.2, 8)` octagonal | Dark chrome (`color: 0x1a1a2e`, `metalness: 0.8`, `roughness: 0.2`) | `(0, 0.6, 2)` |
| Base ring | `TorusGeometry(1.0, 0.03, 8, 32)` | Emissive cyan | `(0, 0.01, 2)` floor level |
| Top ring | `TorusGeometry(0.85, 0.02, 8, 32)` | Emissive cyan | `(0, 1.2, 2)` pedestal top |
| Screen frame brackets | 4x small L-shaped boxes | Emissive cyan | Corners of terminal screen |
| Floor accent ring | `RingGeometry(1.8, 2.0, 32)` | Emissive cyan, low intensity, subtle pulse | `(0, 0.01, 2)` |

### Terminal Screen

- xterm.js texture mesh position: `(0, 2.0, 2)` — floats ~0.3 above pedestal top
- Tilted 15 degrees toward viewer: `rotation.x = -0.26`
- Thin emissive frame border (4 thin box meshes)

### Animations

- Floor accent ring: subtle emissive pulse (`sin(time * 1.5) * 0.1 + 0.2`)
- Screen brackets: very subtle emissive flicker

---

## Asset Pipeline

All workstation furniture, the command podium, and room furniture are **Meshy-generated GLB models** loaded via `GLTFLoader`, matching the visual quality of the robot models. Dynamic/animated elements (glowing screens, LED blinks, shield pulses, card slides, progress bars) are **Three.js code overlays** positioned on top of the loaded models.

- **NanoBanana prompts:** See `2026-03-03-nanobanana-prompts.md`
- **Pipeline:** NanoBanana concept art -> Meshy image-to-3D (GLB) -> Load in Three.js -> Code overlays for animations
- **Target:** ~20-30K tris per station GLB, consistent dark chrome aesthetic

## Code Architecture

### File Structure

```
src/renderer/
  agents/
    stations/
      base-station.ts        # Shared desk, floor accent, light, state logic
      ui-architect-station.ts
      backend-engineer-station.ts
      test-writer-station.ts
      trello-attacker-station.ts
      mobile-optimizer-station.ts
      qa-gatekeeper-station.ts
      index.ts               # Re-exports + factory function
    workstation.ts            # DELETE (replaced by stations/)
    robot-loader.ts           # Unchanged
    agent-manager.ts          # Unchanged
  scene/
    workshop.ts               # Room shell only (floor, walls, ceiling, ambient)
    command-podium.ts          # NEW - terminal pedestal + frame
    ...
```

### BaseStation Class

```typescript
abstract class BaseStation {
  group: THREE.Group;
  protected state: RobotState = 'idle';
  protected accentColor: string;
  protected light: THREE.PointLight;
  protected desk: THREE.Mesh;
  protected floorAccent: THREE.Mesh;

  constructor(position: THREE.Vector3, rotation: number, color: string) {
    // Creates: desk, overhead light, floor accent circle
    // Rotates entire group to face center
  }

  setState(state: RobotState): void {
    // Adjusts light intensity, floor accent emissive
    // Calls onStateChange() for subclass-specific behavior
  }

  update(delta: number): void {
    // Calls onUpdate() for subclass-specific animations
  }

  protected abstract onStateChange(state: RobotState): void;
  protected abstract onUpdate(delta: number): void;
}
```

### Station Factory

```typescript
// stations/index.ts
export function createStation(
  agentId: string,
  position: THREE.Vector3,
  rotation: number,
  color: string
): BaseStation {
  switch (agentId) {
    case 'ui-architect': return new UIArchitectStation(position, rotation, color);
    case 'backend-engineer': return new BackendEngineerStation(position, rotation, color);
    // ... etc
  }
}
```

---

## Workstation Designs

### 1. UI Architect — Drafting Table + Hologram

**Color:** Cyan `#00ffff`

| Element | Geometry | Material | Notes |
|---------|----------|----------|-------|
| Drafting table | `BoxGeometry(3.0, 0.15, 1.8)` rotated 15deg on X | Dark chrome | Angled surface, wider than standard |
| Table legs | 4x `CylinderGeometry(0.05, 0.05, 1.0)` | Dark chrome | Support the angled table |
| Holographic projection | `PlaneGeometry(1.5, 2.0)` | Semi-transparent cyan, `opacity: 0.3`, emissive | Rises vertically from back of table |
| Projection beams | 4x `CylinderGeometry(0.01, 0.01, 1.5)` | Emissive cyan | Connect table corners to hologram corners |
| Orbiting UI elements | 3x `PlaneGeometry(0.3, 0.2)` | Emissive cyan, varying opacity | Only visible when active |

**Idle animation:**
- Hologram dim emissive (0.2)
- No orbiting elements
- Subtle projection beam flicker

**Active animation:**
- Hologram emissive pulses (0.5-1.0 range, `sin(time * 2)`)
- 3 small UI element planes orbit the hologram (`cos/sin(time)` at different phases)
- Projection beams brighten to full
- Overhead light intensifies

**Complete animation:**
- Hologram flash to full brightness then settle
- Orbiting elements converge to center then fade

---

### 2. Backend Engineer — Server Rack Tower

**Color:** Orange `#ff6600`

| Element | Geometry | Material | Notes |
|---------|----------|----------|-------|
| Desk | Standard from BaseStation | Dark chrome | |
| Server rack | `BoxGeometry(1.5, 4.0, 0.5)` | Dark metallic (`metalness: 0.7`) | Positioned behind desk |
| Rack frame edges | `EdgesGeometry` on rack | Emissive orange lines | Wireframe outline |
| LED rows | 8-10x `PlaneGeometry(0.12, 0.06)` | Emissive orange/green | Arranged in rows on rack face |
| Cables | 2-3x `TubeGeometry` from `QuadraticBezierCurve3` | Dark with orange emissive tint | Curve from rack top to desk |
| Console screen | `PlaneGeometry(0.8, 0.5)` | Emissive orange | On desk surface |

**Idle animation:**
- 2-3 LEDs on steady (dim orange)
- Remaining LEDs off
- Cables dark, console dim

**Active animation:**
- LEDs blink in cascading sequence top-to-bottom (`(time * 8 + rowIndex) % 2 > 1`)
- Alternating orange/green LED colors
- Cable emissive pulses
- Console glow intensifies

**Complete animation:**
- All LEDs flash green simultaneously, then return to idle pattern

---

### 3. Test Writer — Diagnostic Dashboard Wall

**Color:** Green `#00ff66`

| Element | Geometry | Material | Notes |
|---------|----------|----------|-------|
| Desk | Standard from BaseStation | Dark chrome | |
| Dashboard backing | `PlaneGeometry(3.0, 2.0)` | Dark background (`0x0a0a12`) | Mounted behind desk, ~2.5 units up |
| Test squares | 12x `PlaneGeometry(0.15, 0.15)` | Emissive green or red | 3 rows x 4 columns on dashboard |
| Progress bar bg | `BoxGeometry(2.5, 0.15, 0.05)` | Dark gray | Bottom of dashboard |
| Progress bar fill | `BoxGeometry(2.5, 0.12, 0.06)` | Emissive green | Animates `scale.x` 0-1 |
| Dashboard frame | `EdgesGeometry` | Emissive green lines | Thin border around dashboard |

**Idle animation:**
- All test squares green (steady)
- Progress bar full (scale.x = 1)
- Dim overall glow

**Active animation:**
- Test squares randomly flip red/green every 0.3-0.5s (simulating test runs)
- Progress bar fill animates from 0 to 1 over ~3 seconds, then resets
- Dashboard frame brightens
- Overhead light intensifies

**Complete animation:**
- All squares snap to green in a wave (left to right)
- Progress bar fills to 1.0 and pulses once

---

### 4. Trello Attacker — Kanban Board Wall

**Color:** Magenta `#ff00ff`

| Element | Geometry | Material | Notes |
|---------|----------|----------|-------|
| Desk | Standard from BaseStation | Dark chrome | |
| Board backing | `PlaneGeometry(3.5, 2.5)` | Dark background (`0x0a0a12`) | Behind desk |
| Column dividers | 2x `BoxGeometry(0.02, 2.3, 0.02)` | Emissive magenta | Divide board into 3 columns |
| Column headers | 3x `PlaneGeometry(1.0, 0.2)` | Emissive magenta, varying intensity | Top of each column (TODO/DOING/DONE) |
| Cards | 6-8x `PlaneGeometry(0.7, 0.4)` | Emissive magenta | Distributed across columns |
| Board frame | `EdgesGeometry` | Emissive magenta lines | Border |

**Card initial positions:**
- TODO column (left): 3 cards
- DOING column (center): 2 cards
- DONE column (right): 2 cards

**Idle animation:**
- Cards static in their columns
- DONE column cards slightly brighter
- Dim overall glow

**Active animation:**
- Cards animate sliding from left columns to right (`position.x` lerp over 1-2s, staggered)
- New cards fade in at the TODO column
- Board glow intensifies
- Column header emissive pulses

**Complete animation:**
- All cards sweep to DONE column
- Brief magenta flash on the board

---

### 5. Mobile Optimizer — Performance Dashboard + Device

**Color:** Yellow `#ffff00`

| Element | Geometry | Material | Notes |
|---------|----------|----------|-------|
| Desk | Standard from BaseStation | Dark chrome | |
| Performance screen | `PlaneGeometry(2.5, 1.8)` | Dark background | Behind desk |
| Metric bar backgrounds | 3x `BoxGeometry(1.8, 0.2, 0.05)` | Dark gray | Rows on the screen |
| Metric bar fills | 3x `BoxGeometry(1.8, 0.16, 0.06)` | Emissive yellow/amber/green | Animate `scale.x` |
| Metric labels | 3x `PlaneGeometry(0.3, 0.2)` | Dim emissive | Left side of each bar |
| Floating device | `BoxGeometry(0.3, 0.5, 0.03)` | Dark with yellow emissive edges | Hovers between screen and desk |
| Device screen | `PlaneGeometry(0.25, 0.42)` | Emissive yellow | Inset on device face |
| Screen frame | `EdgesGeometry` | Emissive yellow lines | Border |

**Idle animation:**
- Bars full (scale.x = 1), all green-tinted
- Device hovers still with gentle float (`sin(time) * 0.02`)
- Dim glow

**Active animation:**
- Bars oscillate (`scale.x` fluctuates 0.3-0.9, different rates per bar)
- Bar colors shift from red-amber toward green as they fill
- Floating device bobs more actively and rotates slowly on Y
- Screen brightens

**Complete animation:**
- All bars snap to full green
- Device pulses bright yellow once

---

### 6. QA Gatekeeper — Shield Wall + Console

**Color:** Red-pink `#ff3366`

| Element | Geometry | Material | Notes |
|---------|----------|----------|-------|
| Desk | Standard from BaseStation | Dark chrome | |
| Shield projector base | `CylinderGeometry(1.0, 1.0, 0.15, 6)` hexagonal | Dark chrome with emissive edge | Behind/above desk |
| Energy shield | `CircleGeometry(1.5, 6)` hexagonal | Semi-transparent red-pink, `opacity: 0.15`, emissive | Hovers above projector base |
| Shield wireframe | `EdgesGeometry` on shield | Emissive red-pink `LineSegments` | Glowing hex border |
| Shield inner ring | `RingGeometry(0.5, 0.55, 6)` | Emissive red-pink | Concentric inner hex |
| Console screen | `PlaneGeometry(0.8, 0.5)` | Emissive red-pink | On desk |
| Status indicator | `SphereGeometry(0.1)` | Emissive green/red | On desk corner |

**Idle animation:**
- Shield barely visible (`opacity: 0.05`, `emissiveIntensity: 0.1`)
- Wireframe edges very dim
- Status indicator steady green
- No rotation

**Active animation:**
- Shield opacity rises to 0.15, emissive pulses (`sin(time * 3) * 0.3 + 0.5`)
- Shield slowly rotates on Y axis (`rotation.y += delta * 0.5`)
- Wireframe brightens to full
- Scan line effect: a thin emissive plane sweeps vertically across the shield face (translate Y from bottom to top, repeat)
- Status indicator blinks red

**Complete animation:**
- Shield flashes bright, then fades back to idle
- Status indicator turns green
- Brief pulse on wireframe

---

## State Integration

Each station's `setState()` flows through `BaseStation`:

```
AgentManager.onStateChange(agentId, state)
  -> robot.setState(state)        // existing - robot animations
  -> station.setState(state)      // new - station animations
     -> BaseStation.setState()    // light + floor accent
     -> SubclassStation.onStateChange()  // unique props
```

### Shared State Behavior (BaseStation)

| State | Overhead light | Floor accent emissive |
|-------|---------------|----------------------|
| idle | 0.3 | 0.1 |
| active | 2.0 | 0.8 |
| complete | 3.0 then fade to 0.3 | 1.5 then fade to 0.1 |

### Animation Update

Each station gets `update(delta)` called every frame from the animation loop in `app.ts`. Subclasses use this for:
- LED blink timing
- Card movement interpolation
- Bar fill animation
- Shield rotation
- Hologram orbit calculations
- Progress bar cycling

---

## Migration from Current Code

### Files to modify:
- `app.ts` — Replace `Workstation` imports with `createStation()`, update position calculation to use arc math, pass rotation
- `workshop.ts` — Remove `buildWorkstations()` method (stations now created in app.ts), add LED strips, upgrade floor material, add ceiling downlights

### Files to create:
- `src/renderer/agents/stations/base-station.ts`
- `src/renderer/agents/stations/ui-architect-station.ts`
- `src/renderer/agents/stations/backend-engineer-station.ts`
- `src/renderer/agents/stations/test-writer-station.ts`
- `src/renderer/agents/stations/trello-attacker-station.ts`
- `src/renderer/agents/stations/mobile-optimizer-station.ts`
- `src/renderer/agents/stations/qa-gatekeeper-station.ts`
- `src/renderer/agents/stations/index.ts`
- `src/renderer/scene/command-podium.ts`

### Files to delete:
- `src/renderer/agents/workstation.ts` (replaced by stations/)

### Camera presets to update:
All agent camera presets in `camera.ts` need new positions/lookAt targets to match the semicircle layout. The overview preset should be adjusted to frame the full arc.
