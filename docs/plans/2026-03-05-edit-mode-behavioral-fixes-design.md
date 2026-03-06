# Edit Mode Behavioral Fixes Design

## Problem Statement

The editor mode (press E) has four behavioral issues:
1. Clicking a selected object again doesn't deselect it
2. Floor/walls/ceiling select as entire surfaces instead of individual tiles
3. UI buttons (tool switch, spawn, delete, save) don't respond to clicks
4. General button functionality needs verification after pointer event fixes

## Root Causes

### 1. No toggle-deselect
`editor-mode.ts:153` — `if (this.selectedObject === obj) return;` exits early instead of toggling.

### 2. Whole-surface selection
`workshop.ts` adds all tiles as children of `workshop.group` (single THREE.Group added to scene). Selection traversal at `editor-mode.ts:134` walks up to scene root children: `while (obj.parent && obj.parent !== this.scene)`, resolving every tile click to `workshop.group`.

### 3. UI pointer events blocked
`index.html:13` — `#editor-root > * { pointer-events: none; }` disables events on React wrapper. The re-enable rules on line 14 target specific selectors but intermediate container divs create dead zones.

## Fixes

### Fix A — Toggle Deselection
**File:** `src/renderer/editor/editor-mode.ts`

Change `selectObject()` to toggle when clicking same object:
```ts
if (this.selectedObject === obj) {
  this.deselectObject();
  return;
}
```

### Fix B — Individual Tile Selection
**File:** `src/renderer/scene/workshop.ts`

Tag tiles with `userData.selectable = true` and names during creation. Tag `workshop.group` with `userData.selectable = false`.

**File:** `src/renderer/editor/editor-mode.ts`

Modify parent traversal to stop at first `selectable`-tagged ancestor instead of scene root child. Skip objects tagged `selectable: false`.

### Fix C — UI Pointer Events
**File:** `index.html`

Simplify CSS to just position/z-index. Remove restrictive pointer-events rules.

**File:** `src/renderer/editorUI/app/components/TerminalEditor.tsx`

Add `pointer-events-none` to root wrapper. Panels already have `pointer-events-auto`.

### Fix D — Button Audit
Verify all button categories after Fix C. Fix any remaining bridge communication issues.

## Files Modified
- `src/renderer/editor/editor-mode.ts` (Fixes A, B)
- `src/renderer/scene/workshop.ts` (Fix B)
- `index.html` (Fix C)
- `src/renderer/editorUI/app/components/TerminalEditor.tsx` (Fix C)
