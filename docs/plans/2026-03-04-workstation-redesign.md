# Workstation Redesign

## Problem
Current workstation mockups are too bland — 4 of 6 are generic "dark desk with neon trim" that don't reflect each agent's role.

## Decision
- **Keep**: Backend Engineer (server rack), UI Architect (holographic drafting table)
- **Regenerate**: QA Gatekeeper, Mobile Optimizer, Trello Attacker, Test Writer

## Pipeline
NanoBanana concept art → Meshy image-to-3D (GLB export) → `assets/models/workstations/`

## NanoBanana Prompts

### QA Gatekeeper (#ff3366)
Cyberpunk quality inspection booth, dark metal with red-pink neon edge lighting. Features a scanning arch gateway with pulsing light bars, a control console with pass/fail gauges and warning indicators, holographic inspection readout floating above the desk. Small conveyor belt feeds through the scanner. Industrial, authoritative feel. Isometric view, dark studio background.

### Mobile Optimizer (#ffff00)
Cyberpunk mobile device testing laboratory workstation, dark metal with yellow neon edge lighting. Features a curved rack holding 6 glowing mobile devices and tablets at different angles, connected by visible cables to a central hub. Performance dashboard hologram floats above showing speed metrics and loading bars. Compact, technical feel. Isometric view, dark studio background.

### Trello Attacker (#ff00ff)
Cyberpunk war room tactical command table, dark metal with magenta neon edge lighting. Features a large holographic table surface projecting floating kanban board cards that glow magenta, with columns visible in the projection. Side-mounted weapon tool racks with aggressive angular design. War-planning feel, not office. Isometric view, dark studio background.

### Test Writer (#00ff66)
Cyberpunk laboratory testing workstation, dark metal with green neon edge lighting. Features a lab bench with glowing green test tubes in a rack, a microscope-like scanner device, and a holographic display showing scrolling code with green checkmarks and red X marks. Chemical scientific aesthetic mixed with tech. Isometric view, dark studio background.

## Code Changes
1. Add `workstationModelPath` to `AgentConfig` interface
2. Update `Workstation` class to load GLB models via `GLTFLoader`
3. Keep dynamic point light + emissive intensity state switching
4. Create `assets/models/workstations/` directory

## Existing Mockup Files (kept as-is)
- Backend Engineer: `backend-engineer_workstationMockUp1.png`
- UI Architect: `ui-architect_workstationMockUp1.png`
