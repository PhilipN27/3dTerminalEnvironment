# Editor Freeze Fix + Universal Snap Grid Design

## Problem Statement

1. Editor mode freezes when exiting and re-entering — pointer lock and camera state become inconsistent
2. No visual grid or snap system for precise object placement

## Fix A — Editor Mode Freeze

**Root cause:** When in freeroam (pointer locked) and pressing E to enter editor, pointer lock isn't released. The CameraController's click handler tries to re-acquire pointer lock while editing. On re-entry, state is inconsistent.

**Fix:**
- `toggle()` releases pointer lock and exits freeroam when entering editor
- Add `editorBridge.active` guard to CameraController's click-to-lock handler
- When exiting editor, camera resumes cleanly from last state

**Files:** `src/renderer/editor/editor-mode.ts`, `src/renderer/scene/camera.ts`

## Fix B — Universal Snap Grid

- Visible `THREE.GridHelper` (200x200 units, 1-unit spacing) at floor level in editor mode
- Toggle with Ctrl+G keyboard shortcut + UI button in HUD panel
- When grid ON: TransformControls snaps to 1-unit position, 15-degree rotation, 0.1 scale
- When grid OFF: free placement, no snap
- Subtle cyan grid lines matching existing aesthetic
- Grid state persisted during session

**Files:** `src/renderer/editor/editor-mode.ts`, `src/renderer/editor/editor-bridge.ts`, `src/renderer/editorUI/app/components/HUDPanel.tsx`, `src/renderer/editorUI/app/components/BottomInfo.tsx`
