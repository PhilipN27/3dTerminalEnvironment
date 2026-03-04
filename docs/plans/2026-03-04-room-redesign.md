# Room Redesign — Panel Tile Approach

## Problem
Workshop is placeholder flat geometry (plain walls, floor, ceiling). Doesn't match the cyberpunk quality of the workstations and robots.

## Approach
Generate 3 Meshy panels (wall, floor, ceiling), tile them in code to form a hollow room.

## Pipeline
NanoBanana concept art → Meshy image-to-3D (GLB, ~10-15K poly each) → `assets/models/room/`

## NanoBanana Prompts

### Wall Panel
Cyberpunk industrial wall panel section, dark metal with exposed rivets, ventilation slats, cable conduits, and subtle cyan neon strip lighting along edges. Weathered brushed steel with rust accents. Flat rectangular panel, front-facing view, dark studio background, no floor or ceiling visible.

### Floor Panel
Cyberpunk industrial floor tile section, dark metal grating with diamond plate pattern, subtle cyan neon strips embedded in grooves between plates. Worn industrial steel with slight grime. Top-down view, square tile, dark studio background.

### Ceiling Panel
Cyberpunk industrial ceiling panel section, dark metal with exposed pipes, cable bundles, ventilation ducts, and dim recessed strip lights. Heavy industrial look with support beams. Bottom-up view, rectangular panel, dark studio background.

## Code Changes
1. Remove `buildWorkstations()` from workshop.ts (replaced by workstation GLBs)
2. Replace `buildFloor()`, `buildWalls()`, `buildCeiling()` with GLB panel tiling
3. Load each panel GLB once, clone/instance for tiling
4. Keep right wall transparent (window to city backdrop)
5. Keep terminal desk in center
6. Create `assets/models/room/` directory

## Layout
- Room: 30x20 units, 8 units tall
- Panel target: ~5x5 units each, tiled to fill surfaces
- Back wall: 6 panels across
- Left wall: 4 panels across
- Floor: 6x4 grid = 24 panels
- Ceiling: 6x4 grid = 24 panels
- Right wall: transparent (window)

## Poly Budget
~10-15K per panel. With instancing, total room geometry stays under 100K vertices.
