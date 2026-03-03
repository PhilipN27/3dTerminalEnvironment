# NanoBanana Prompts — Workstations, Podium & Room Assets

**Date:** 2026-03-03
**Purpose:** Concept art prompts for Meshy image-to-3D generation
**Design ref:** `2026-03-03-workstation-room-design.md`

## Style Baseline

All prompts share this visual language to match the existing robot models:

- **Aesthetic:** Clean cyberpunk sci-fi laboratory
- **Materials:** Dark chrome, brushed dark metal, polished black surfaces
- **Lighting:** Neon accent glows (each station has its own color)
- **Era:** Near-future, sleek and precise — more Stark Industries than Blade Runner
- **Tone:** Polished, high-tech, minimal clutter
- **Camera:** 3/4 front perspective, full object visible, plain dark background
- **Important:** No characters/robots in the scene — just the furniture and props

---

## What Gets Modeled (GLB) vs Code Overlay

For each station, the **static physical furniture** is a Meshy GLB. The **dynamic animated elements** are Three.js code overlays positioned on top.

| Station | Meshy GLB (static) | Code Overlay (animated) |
|---------|-------------------|------------------------|
| UI Architect | Drafting table, legs, mounting arm | Holographic projection plane, projection beams, orbiting UI elements |
| Backend Engineer | Desk, server rack tower, cable housings | LED planes on rack face, cable emissive pulse, console screen glow |
| Test Writer | Desk, dashboard frame/housing | Test result squares, progress bar fill, dashboard glow |
| Trello Attacker | Desk, kanban board frame/housing | Card planes, column dividers glow, column headers |
| Mobile Optimizer | Desk, performance screen frame/housing | Metric bar fills, floating device, screen glow |
| QA Gatekeeper | Desk, shield projector base/pedestal | Energy shield hex, wireframe glow, scan line, status indicator |
| Command Podium | Octagonal pedestal, base structure | Floor accent ring pulse, screen frame brackets, terminal screen |
| Room Furniture | Floor panels, wall segments, ceiling fixtures | LED strips, arc guide lines, downlight colors |

---

## Workstation Prompts

### 1. UI Architect Workstation

```
Futuristic architect drafting table workstation, cyberpunk sci-fi laboratory furniture.
Angled tilted drawing surface on sleek dark chrome legs, wider than a normal desk.
A curved mounting arm extends from the back of the table arching upward, designed
to project holograms above the surface. The table surface is smooth dark glass with
thin cyan neon edge lighting along the borders. Clean minimal design, no clutter.
Dark brushed metal and polished black materials. Cyan accent color theme.
3/4 front view, plain dark background, studio lighting.
```

**After Meshy:** Position the holographic projection plane, 4 projection beam cylinders, and orbiting UI element planes relative to the mounting arm in code.

---

### 2. Backend Engineer Workstation

```
Futuristic server rack workstation, cyberpunk sci-fi laboratory furniture.
A sleek dark chrome desk with a tall server rack tower standing directly behind it.
The server rack is about twice the height of the desk, rectangular with ventilation
slots and horizontal shelf dividers creating rows for equipment. Two or three thick
cable conduits run from the top of the rack down to the desk surface in smooth curves.
A small flat console monitor sits on the desk. Everything is dark brushed metal with
orange neon accent lighting along edges and seams. Clean and industrial but polished.
3/4 front view, plain dark background, studio lighting.
```

**After Meshy:** Overlay LED planes on the rack face rows, add emissive pulse to cables, animate console screen glow.

---

### 3. Test Writer Workstation

```
Futuristic QA testing workstation, cyberpunk sci-fi laboratory furniture.
A sleek dark chrome desk with a large wide rectangular display panel mounted behind
and above it like a wall-mounted dashboard screen. The display panel has a thin frame
housing with clean bezels. The screen area is dark and blank, ready for diagnostic
readouts. A small secondary monitor sits on the desk surface. Clean minimal design,
dark brushed metal and polished black materials. Green neon accent lighting along
the frame edges and desk borders. No text or UI elements on screens.
3/4 front view, plain dark background, studio lighting.
```

**After Meshy:** Overlay test result square planes, progress bar, and dashboard frame glow on the display panel surface.

---

### 4. Trello Attacker Workstation

```
Futuristic task management workstation, cyberpunk sci-fi laboratory furniture.
A sleek dark chrome desk with a large vertical board panel mounted behind it like
a wall-mounted display board. The board is slightly taller than it is wide, with a
thin frame housing and clean bezels. The board surface is dark and flat, divided by
two subtle vertical grooves creating three equal columns. A small flat console sits
on the desk. Clean minimal design, dark brushed metal and polished black materials.
Magenta pink neon accent lighting along frame edges and column dividers.
3/4 front view, plain dark background, studio lighting.
```

**After Meshy:** Overlay card planes in columns, animated column headers, glowing divider lines.

---

### 5. Mobile Optimizer Workstation

```
Futuristic performance monitoring workstation, cyberpunk sci-fi laboratory furniture.
A sleek dark chrome desk with a medium-sized rectangular display screen mounted
behind and above it on a slim stand. The screen has a thin frame housing. In front
of the main screen, a small articulated arm extends from the desk holding a small
phone-sized device mount at eye level. The device mount is empty, designed to hold
a floating holographic device. Clean minimal design, dark brushed metal and polished
black materials. Yellow neon accent lighting along edges and the device mount arm.
3/4 front view, plain dark background, studio lighting.
```

**After Meshy:** Overlay metric bar fills on the screen, floating device mesh on the mount arm, animated screen glow.

---

### 6. QA Gatekeeper Workstation

```
Futuristic security checkpoint workstation, cyberpunk sci-fi laboratory furniture.
A sleek dark chrome desk with a hexagonal pedestal platform rising behind it. The
hexagonal platform is about waist height, flat on top, designed as a base for
projecting an energy shield above it. The pedestal has angular faceted sides with
recessed lighting channels. A small console monitor sits on the desk with a round
status indicator dome next to it. Imposing and sturdy but clean and polished.
Dark brushed metal materials. Red-pink neon accent lighting along hexagonal edges
and recessed channels.
3/4 front view, plain dark background, studio lighting.
```

**After Meshy:** Overlay hexagonal energy shield plane, wireframe edges, shield rotation, scan line sweep, status indicator glow.

---

## Command Podium

```
Futuristic command terminal pedestal, cyberpunk sci-fi laboratory furniture.
A central octagonal pedestal standing about waist height, made of polished dark
chrome with an octagonal cross-section. The top surface is flat and slightly
recessed, designed to project a floating screen above it. Thin neon cyan light
rings embedded around the base and the top rim of the pedestal. The base flares
slightly wider than the top for stability. Four small angular bracket mounts on
the top corners designed to frame a holographic display. Commanding and elegant,
the centerpiece of a high-tech control room. Dark brushed metal and polished
black materials with cyan accent lighting.
3/4 front view, plain dark background, studio lighting.
```

**After Meshy:** Mount the xterm.js terminal screen floating above the pedestal, add floor accent ring, animate bracket glow and ring pulse.

---

## Room Furniture / Environment Pieces

### Floor Panel Section

```
Futuristic laboratory floor panel, cyberpunk sci-fi environment piece.
A square section of polished dark floor tile, high-gloss reflective surface
with subtle recessed grid line patterns. Thin cyan neon light strips embedded
in the seams between floor sections. The surface is dark navy blue-black,
ultra clean and smooth like polished obsidian. Flat, viewed from above at
a slight angle. Plain dark background.
```

### Wall Panel Section

```
Futuristic laboratory wall panel, cyberpunk sci-fi environment piece.
A rectangular section of sleek dark wall paneling with subtle angular
geometric surface details. Thin horizontal LED strip channels run along
the top and bottom edges, designed for accent lighting. The surface is
dark brushed metal, flat and clean with minimal texture. No windows,
no screens. Subtle recessed lines create a panel grid pattern.
Viewed straight-on, plain dark background.
```

### Ceiling Light Fixture

```
Futuristic recessed ceiling light fixture, cyberpunk sci-fi environment piece.
A slim rectangular ceiling-mounted light panel with a frosted diffuser surface,
set into a dark chrome frame housing. Designed to sit flush between exposed
ceiling beams. Minimal and clean, functional industrial design. Dark brushed
metal frame, frosted white-blue diffuser panel. Viewed from below at an angle,
plain dark background.
```

---

## Generation Order (Recommended)

Priority order for Meshy generation — do the unique hero pieces first:

1. **Command Podium** — centerpiece, sets the visual tone
2. **QA Gatekeeper station** — most unique shape (hexagonal pedestal)
3. **Backend Engineer station** — server rack is a strong visual anchor
4. **UI Architect station** — drafting table + mounting arm is distinctive
5. **Trello Attacker station** — board panel
6. **Test Writer station** — dashboard panel (similar to Trello, do after to differentiate)
7. **Mobile Optimizer station** — screen + arm mount
8. **Room pieces** (floor, wall, ceiling) — these can be last or even stay as primitives if the stations look good enough

---

## Meshy Settings Notes

- Export as **GLB** (binary glTF)
- Keep polygon count reasonable (~20-30K tris per station max)
- Ensure consistent scale across all models — or normalize in code like the robots
- Dark materials photograph better for Meshy — the dark chrome aesthetic should translate well
- If Meshy adds unwanted colors, the materials can be overridden in Three.js after loading

---

## After Generation Checklist

For each generated GLB:
1. Load in code via `GLTFLoader` (same as robot-loader pattern)
2. Auto-scale and position relative to the station's arc position
3. Verify material consistency — override if needed to match room palette
4. Add code overlay elements (lights, animated planes, etc.)
5. Test state transitions (idle/active/complete visual changes)
