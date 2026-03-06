# Edit Mode Behavioral Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix four editor mode behavioral issues — toggle deselection, individual tile selection, UI pointer events, and button functionality.

**Architecture:** Targeted fixes across 4 files. The 3D selection logic in `editor-mode.ts` needs two changes (toggle-deselect and smarter parent traversal). The workshop tiles in `workshop.ts` need `userData` tags so the selection system can identify them. The HTML/CSS pointer-events rules in `index.html` need simplification, and the React wrapper in `TerminalEditor.tsx` needs an explicit `pointer-events-none` class so clicks pass through transparent areas to the 3D canvas.

**Tech Stack:** TypeScript, Three.js, React, Tailwind CSS v4, Vite, Electron

---

### Task 1: Fix toggle deselection

**Files:**
- Modify: `src/renderer/editor/editor-mode.ts:152-153`

**Step 1: Change the early return to a toggle**

In `src/renderer/editor/editor-mode.ts`, find `selectObject()` at line 152-153. The current code:

```ts
  private selectObject(obj: THREE.Object3D) {
    if (this.selectedObject === obj) return;
```

Replace with:

```ts
  private selectObject(obj: THREE.Object3D) {
    if (this.selectedObject === obj) {
      this.deselectObject();
      return;
    }
```

This makes clicking the same object toggle selection off, which is standard editor behavior.

**Step 2: Manual test**

Run: `npm run dev`
1. Press E to enter editor mode
2. Click any object — it should highlight with the transform gizmo
3. Click the same object again — it should deselect (gizmo disappears, highlight removed)
4. Click empty space — should also deselect (existing behavior, unchanged)

**Step 3: Commit**

```bash
git add src/renderer/editor/editor-mode.ts
git commit -m "fix: toggle deselection when clicking same object in editor"
```

---

### Task 2: Tag workshop tiles as individually selectable

**Files:**
- Modify: `src/renderer/scene/workshop.ts:13-14, 60-66, 104-115, 136-139, 192-199, 237-239, 281-283`

**Step 1: Mark the top-level group as non-selectable**

In the constructor (line 14), after `this.group = new THREE.Group();` add:

```ts
  constructor() {
    this.group = new THREE.Group();
    this.group.userData.selectable = false;
    this.buildFloorFallback();
```

**Step 2: Tag floor panels**

In `loadFloorPanels()`, after cloning the panel (line 60-66), add userData tags:

```ts
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const panel = template.clone();
          panel.position.set(
            startX + col * PANEL_SIZE,
            0,
            startZ + row * PANEL_SIZE,
          );
          panel.userData.selectable = true;
          panel.name = `floor-panel-${col}-${row}`;
          this.group.add(panel);
        }
      }
```

**Step 3: Tag wall tiles**

In the `buildMirroredWallTile()` method, at the end (around line 104-115), tag the returned tile group:

```ts
    const tile = new THREE.Group();
    tile.add(leftHalf);
    tile.add(rightHalf);

    tile.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    tile.userData.selectable = true;

    return tile;
```

In the `placeWall` inner function inside `loadWallPanels()` (line 134-141), name each tile:

```ts
      const placeWall = (
        cols: number,
        getPosition: (col: number, row: number) => THREE.Vector3,
        rotationY: number,
        wallName: string,
      ) => {
        for (let col = 0; col < cols; col++) {
          for (let row = 0; row < vRows; row++) {
            const tile = tileTemplate.clone();
            tile.position.copy(getPosition(col, row));
            tile.rotation.y = rotationY;
            tile.userData.selectable = true;
            tile.name = `${wallName}-panel-${col}-${row}`;
            this.group.add(tile);
          }
        }
      };
```

Update the four `placeWall` calls to pass the wall name:

```ts
      // Back wall (z = -ROOM_DEPTH/2)
      placeWall(hCols, (col, row) => new THREE.Vector3(
        -ROOM_WIDTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE,
        wallRowHeight / 2 + row * wallRowHeight,
        -ROOM_DEPTH / 2,
      ), 0, 'back-wall');

      // Left wall (x = -ROOM_WIDTH/2)
      placeWall(dCols, (col, row) => new THREE.Vector3(
        -ROOM_WIDTH / 2,
        wallRowHeight / 2 + row * wallRowHeight,
        -ROOM_DEPTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE,
      ), Math.PI / 2, 'left-wall');

      // Right wall (x = ROOM_WIDTH/2)
      placeWall(dCols, (col, row) => new THREE.Vector3(
        ROOM_WIDTH / 2,
        wallRowHeight / 2 + row * wallRowHeight,
        -ROOM_DEPTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE,
      ), -Math.PI / 2, 'right-wall');

      // Front wall (z = ROOM_DEPTH/2)
      placeWall(hCols, (col, row) => new THREE.Vector3(
        -ROOM_WIDTH / 2 + PANEL_SIZE / 2 + col * PANEL_SIZE,
        wallRowHeight / 2 + row * wallRowHeight,
        ROOM_DEPTH / 2,
      ), Math.PI, 'front-wall');
```

**Step 4: Tag ceiling panels**

In `loadCeilingPanels()` (line 192-199), tag each panel:

```ts
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          const panel = template.clone();
          panel.position.set(
            startX + col * PANEL_SIZE,
            ROOM_HEIGHT,
            startZ + row * PANEL_SIZE,
          );
          panel.rotation.x = Math.PI;
          panel.userData.selectable = true;
          panel.name = `ceiling-panel-${col}-${row}`;
          this.group.add(panel);
        }
      }
```

**Step 5: Tag ceiling lights**

In `loadCeilingLights()`, tag strip lights (around line 237-239):

```ts
      for (const x of stripRows) {
        for (const z of stripPositionsZ) {
          const light = template.clone();
          light.position.set(x, ROOM_HEIGHT, z);
          light.userData.selectable = true;
          light.name = `strip-light-${x}-${z}`;
          this.group.add(light);
        }
      }
```

And tag cage lights (around line 281-283):

```ts
      for (const pos of cagePositions) {
        const cage = template.clone();
        cage.position.set(pos.x, ROOM_HEIGHT, pos.z);
        cage.userData.selectable = true;
        cage.name = `cage-light-${pos.x}-${pos.z}`;
        this.group.add(cage);
      }
```

**Step 6: Commit**

```bash
git add src/renderer/scene/workshop.ts
git commit -m "feat: tag all workshop tiles as individually selectable"
```

---

### Task 3: Update selection traversal to respect selectable tags

**Files:**
- Modify: `src/renderer/editor/editor-mode.ts:131-140`

**Step 1: Replace the parent traversal logic**

In `onPointerDown()`, find lines 131-140. The current code:

```ts
    if (intersects.length > 0) {
      // Find the top-level group or object
      let obj = intersects[0].object;
      while (obj.parent && obj.parent !== this.scene) {
        obj = obj.parent;
      }
      this.selectObject(obj);
    } else {
      this.deselectObject();
    }
```

Replace with:

```ts
    if (intersects.length > 0) {
      // Walk up from the hit mesh to find the nearest selectable ancestor
      let obj = intersects[0].object;
      let selectable: THREE.Object3D | null = null;

      // Check the hit object itself and each ancestor
      let current: THREE.Object3D | null = obj;
      while (current && current !== this.scene) {
        if (current.userData.selectable === true) {
          selectable = current;
          break;
        }
        current = current.parent;
      }

      // Fallback: if no selectable tag found, use top-level scene child (for spawned/editor objects)
      if (!selectable) {
        let fallback = obj;
        while (fallback.parent && fallback.parent !== this.scene) {
          fallback = fallback.parent;
        }
        // Only select if not explicitly marked non-selectable
        if (fallback.userData.selectable !== false) {
          selectable = fallback;
        }
      }

      if (selectable) {
        this.selectObject(selectable);
      }
    } else {
      this.deselectObject();
    }
```

**How this works:**
- Walks up from the hit mesh looking for `userData.selectable === true` — stops at the first match (individual tile)
- If nothing tagged `selectable` is found (e.g. spawned editor objects, robots), falls back to the top-level scene child
- Objects marked `selectable: false` (like `workshop.group`) are never selected
- Spawned objects (from `spawnModel()`) have no `selectable` tag, so they use the fallback and still work correctly

**Step 2: Also tag spawned objects as selectable**

In `spawnModel()` (around line 277), add the selectable tag alongside the existing editorManaged tag:

```ts
      // Tag as editor-managed
      obj.userData.editorManaged = true;
      obj.userData.selectable = true;
      obj.userData.modelPath = modelPath;
```

**Step 3: Manual test**

Run: `npm run dev`
1. Press E to enter editor mode
2. Click individual floor tile — should select ONLY that tile (not the entire floor)
3. Properties inspector should show tile name like "floor-panel-2-3"
4. Gizmo should appear on the individual tile
5. Click a different floor tile — should switch selection
6. Click a wall tile — should select individual wall panel
7. Click a ceiling tile — should select individual ceiling panel
8. Click a strip light — should select individual light
9. Click empty space — should deselect

**Step 4: Commit**

```bash
git add src/renderer/editor/editor-mode.ts
git commit -m "feat: individual tile selection using userData.selectable tags"
```

---

### Task 4: Fix UI pointer events

**Files:**
- Modify: `index.html:12-14`
- Modify: `src/renderer/editorUI/app/components/TerminalEditor.tsx:69`

**Step 1: Simplify the index.html CSS rules**

In `index.html`, replace lines 12-14:

```css
    #editor-root { position: absolute; inset: 0; pointer-events: none; z-index: 20; display: none; }
    #editor-root > * { pointer-events: none; }
    #editor-root button, #editor-root input, #editor-root [class*="pointer-events-auto"] { pointer-events: auto; }
```

With just:

```css
    #editor-root { position: absolute; inset: 0; pointer-events: none; z-index: 20; display: none; }
```

The old approach tried to selectively re-enable pointer events via CSS attribute selectors, but intermediate container divs created dead zones where clicks were swallowed. The new approach lets React components handle their own pointer events via Tailwind classes (`pointer-events-auto` on panels, `pointer-events-none` on transparent areas).

**Step 2: Add pointer-events-none to TerminalEditor root wrapper**

In `src/renderer/editorUI/app/components/TerminalEditor.tsx`, line 69:

```tsx
    <div className="w-full h-full relative font-mono select-none overflow-hidden">
```

Change to:

```tsx
    <div className="w-full h-full relative font-mono select-none overflow-hidden pointer-events-none">
```

This ensures the full-screen React overlay doesn't block clicks to the 3D canvas. The individual panels (`TopToolbar`, `SpawnMenuPanel`, `HUDPanel`, `PropertiesPanel`, `BottomInfo`) already have `pointer-events-auto` on their wrapper divs, so they remain clickable.

**Step 3: Manual test**

Run: `npm run dev`
1. Press E to enter editor mode
2. Click the Move/Rotate/Scale tool buttons in the HUD panel — active tool should switch and highlight
3. Click a model in the Spawn Menu Panel — model should spawn in front of camera
4. Select an object, then click Delete in Properties panel — object should be removed
5. Click Save Layout — should trigger file download
6. Click through transparent areas between panels — should raycast to 3D objects behind

**Step 4: Commit**

```bash
git add index.html src/renderer/editorUI/app/components/TerminalEditor.tsx
git commit -m "fix: simplify editor pointer events so UI buttons receive clicks"
```

---

### Task 5: Button functionality audit and edge case fixes

**Files:**
- Possibly modify: `src/renderer/editorUI/app/components/SpawnMenuPanel.tsx`
- Possibly modify: `src/renderer/editorUI/app/components/HUDPanel.tsx`

**Step 1: Audit tool switching**

Run the app, press E, and verify:
- Click "Move (G)" button → gizmo changes to translate mode
- Click "Rotate (R)" button → gizmo changes to rotate mode
- Click "Scale (S)" button → gizmo changes to scale mode
- Press G/R/S keys → same behavior as clicking buttons
- Active button should have orange highlight, others should be cyan

If buttons are still not responding after Task 4 fix, check the browser devtools console for errors. A possible secondary issue: the button `onClick` might be getting swallowed by an ancestor. In that case, add `e.stopPropagation()` to the button handlers.

**Step 2: Audit spawn functionality**

- Switch to each tab (Lights, Walls, Props, Effects)
- Click a model — should spawn 5 units in front of camera at y=0
- Check devtools console for "Spawned: [name]" log or error messages
- If the model fails to load, check the model path matches an actual file in `assets/models/`

**Step 3: Audit delete functionality**

- Select an object
- Click Delete button in Properties panel — object should be removed from scene
- Verify "Deleted: [name]" appears in console
- Delete button should grey out after deletion (nothing selected)

**Step 4: Audit save functionality**

- Spawn a few objects, move them around
- Click Save Layout (or Ctrl+Shift+S) — should trigger a `room-layout.json` download
- Open the downloaded file — should contain array of objects with modelPath, position, rotation, scale

**Step 5: Commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix: resolve remaining editor button issues"
```

---

### Task 6: Final integration test

**Step 1: Full workflow test**

1. Start app, verify normal mode works (camera, terminal, agents)
2. Press E — editor UI appears, HUD hides
3. Click floor tile — individual tile selected, name shown in Properties
4. Click same tile — deselects (toggle)
5. Click wall tile — individual wall panel selected
6. Switch to Rotate tool via button click — gizmo changes
7. Drag gizmo — tile rotates, Properties panel updates live
8. Press G — gizmo switches to Move
9. Spawn a Strip Light from Spawn Menu — appears in scene
10. Select spawned light — shows in Properties
11. Click Delete — light removed
12. Save Layout — downloads JSON
13. Press Esc — deselects
14. Press E — exits editor, normal mode resumes

**Step 2: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: complete editor mode behavioral fixes"
```
