# Meshy-Generated Room Surfaces Design

## Overview

Replace procedural Three.js geometry for floor, walls, and ceiling with Meshy AI-generated 3D models (GLB). Each surface has a distinct visual identity combining sci-fi, industrial, organic, and high-tech aesthetics.

## Surface Identities

### Floor — Industrial/Organic Fusion
Dark weathered steel diamond plate with biomechanical organic veins and tendrils growing through cracks and seams. Alien bioluminescent cyan glow in organic parts. Gritty, worn, grounded.

### Walls — Sci-Fi Panels + Alien Textures
Back wall: heavy armored sci-fi panels with exposed conduits and alien membrane patches between metal seams. Organic ribbing texture with neon cyan accent strips. Side walls remain transparent glass with biomechanical framing.

### Ceiling — Clean High-Tech
Sleek minimal polished panels with recessed geometric lighting channels. Clean precise cutouts with soft glow. Elegant structural support ribs — polished, clinical, futuristic.

## Technical Approach

1. Generate 3 text-to-3D previews via Meshy API (realistic style)
2. Refine each to production quality
3. Download GLBs to `assets/models/room/`
4. Load via GLTFLoader in `workshop.ts`, replacing procedural geometry
5. Scale/position to fit 30x20x8 room dimensions

## Room Dimensions
- Floor: 30 x 20 units
- Walls: 8 units high
- Ceiling: at y=8

## File Locations
- `assets/models/room/floor.glb`
- `assets/models/room/wall.glb`
- `assets/models/room/ceiling.glb`
