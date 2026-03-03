# Workstation & Room Implementation Plan

**Date:** 2026-03-03
**Design doc:** `2026-03-03-workstation-room-design.md`

## Implementation Order

Work is ordered to minimize breakage — room shell first, then base station, then individual stations one at a time, then wire everything together.

---

### Phase 1: Room Shell Upgrade (`workshop.ts`)

**Goal:** Update the room to match clean sci-fi lab aesthetic without changing layout yet.

1. Upgrade floor material (polished dark, high metalness)
2. Add floor arc guide lines (thin emissive ring geometry tracing the semicircle)
3. Add floor accent ring around terminal position
4. Add horizontal LED strips along wall top/bottom edges
5. Add colored downlight placeholders above each station position (will connect to state later)
6. Remove `buildWorkstations()` — desks/monitors move to station classes
7. Upgrade ceiling with subtle ambient glow panels between beams

**Files:** `workshop.ts`

---

### Phase 2: Command Podium (`command-podium.ts`)

**Goal:** Replace the plain terminal desk with the command podium.

1. Create `CommandPodium` class with octagonal pedestal, accent rings, floor ring
2. Add holographic frame brackets around screen position
3. Add subtle pulse animation on floor ring
4. Update `app.ts` — replace `terminalDesk` positioning, mount terminal screen on podium
5. Adjust `terminal-mesh.ts` position/rotation to float above podium at 15deg tilt

**Files:** new `command-podium.ts`, modify `app.ts`, modify `workshop.ts` (remove terminalDesk)

---

### Phase 3: BaseStation Class

**Goal:** Create the shared station foundation.

1. Create `src/renderer/agents/stations/base-station.ts`
2. Implement: sleek desk, floor accent circle in agent color, overhead PointLight
3. Constructor takes `position`, `rotation` (to face center), `color`
4. `setState()` — adjusts light intensity + floor accent emissive + calls abstract `onStateChange()`
5. `update(delta)` — calls abstract `onUpdate(delta)`
6. Create `stations/index.ts` with `createStation()` factory (initially returns BaseStation for all agents)

**Files:** new `base-station.ts`, new `index.ts`

---

### Phase 4: Individual Stations (one at a time)

Each station: create the file, add unique props, implement `onStateChange()` and `onUpdate()`. These can be done in any order or in parallel.

#### 4a. UI Architect Station
- Angled drafting table (replaces standard desk)
- Holographic projection plane (semi-transparent cyan)
- 4 projection beam cylinders
- 3 orbiting UI element planes (hidden when idle)
- Active: hologram pulse, orbiting elements, beam brighten
- File: `ui-architect-station.ts`

#### 4b. Backend Engineer Station
- Server rack tower (tall box behind desk)
- 8-10 LED planes on rack face
- 2-3 cable TubeGeometry curves
- Console screen on desk
- Active: cascading LED blink, cable pulse
- File: `backend-engineer-station.ts`

#### 4c. Test Writer Station
- Dashboard backing plane
- 12 test result square planes (3x4 grid)
- Progress bar (background + fill with animated scale.x)
- Dashboard frame (EdgesGeometry)
- Active: random red/green flipping, progress bar cycling
- File: `test-writer-station.ts`

#### 4d. Trello Attacker Station
- Kanban board backing plane
- 2 column divider lines
- 3 column header planes
- 6-8 card planes distributed across columns
- Active: cards animate sliding between columns
- File: `trello-attacker-station.ts`

#### 4e. Mobile Optimizer Station
- Performance screen plane
- 3 metric bar backgrounds + fills (animated scale.x)
- Floating device box with emissive screen inset
- Active: bars oscillate, device bobs/rotates
- File: `mobile-optimizer-station.ts`

#### 4f. QA Gatekeeper Station
- Shield projector base (hexagonal cylinder)
- Energy shield (hexagonal circle, semi-transparent)
- Shield wireframe (EdgesGeometry + LineSegments)
- Inner ring, console screen, status indicator sphere
- Active: shield pulse, rotation, scan line sweep
- File: `qa-gatekeeper-station.ts`

---

### Phase 5: Wiring — Semicircle Layout + Integration

**Goal:** Connect everything together, replace old workstation system.

1. Update `app.ts`:
   - Replace `AGENT_POSITIONS` with semicircle arc calculation
   - Import `createStation()` instead of `Workstation`
   - Create stations with calculated positions + rotations
   - Add `station.update(delta)` to animation loop
   - Connect `agentManager.onStateChange` to `station.setState()`
2. Update `camera.ts`:
   - Recalculate all agent camera presets to match new semicircle positions
   - Adjust overview preset to frame the full arc
3. Delete `src/renderer/agents/workstation.ts`

**Files:** modify `app.ts`, modify `camera.ts`, delete `workstation.ts`

---

### Phase 6: Polish

1. Tune lighting intensities — make sure the room feels balanced
2. Adjust state transitions — ensure complete state flash looks good before returning to idle
3. Verify all station animations run smoothly with the shared delta timing
4. Test camera presets aim correctly at each new station position

---

## Dependency Graph

```
Phase 1 (room shell) ──┐
                        ├── Phase 5 (wiring)── Phase 6 (polish)
Phase 2 (podium) ──────┤
                        │
Phase 3 (base station) ─┤
                        │
Phase 4a-f (stations) ──┘
```

Phases 1, 2, 3, and 4 can all be developed independently. Phase 5 brings them together. Phase 6 is final tuning.
