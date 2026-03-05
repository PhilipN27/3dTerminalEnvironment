 Layout Spec                                      
                                                   
  Screen: 1920x1080 (fullscreen Electron app)      
  All panels: position fixed, overlay on top of 3D
  scene
  Panels semi-transparent: rgba(10, 15, 30, 0.85)  
  Border: 1px solid rgba(100, 200, 255, 0.3)       
  Border radius: 8px
  Font: Consolas / monospace

  Color Tokens

  --editor-blue: #64C8FF (light blue - labels,     
  borders, headers)
  --editor-orange: #FF8C42 (orange - active states,
   values, highlights)
  --editor-bg: rgba(10, 15, 30, 0.85) (panel       
  backgrounds)
  --editor-text: #C0D0E0 (muted text)
  --editor-hover: rgba(100, 200, 255, 0.15) (hover 
  state)
  --editor-active: rgba(255, 140, 66, 0.2) (active 
  tool bg)

  Panel Dimensions

  Top Toolbar:    100% width x 48px, pinned top    
  Left Spawn:     280px x 60% height, pinned left  
  Right Props:    300px x auto, pinned right       
  Bottom Info:    400px x 36px, pinned bottom      
  center

  Component States

  Tool Button:    idle (blue border) → hover (blue 
  bg) → active (orange bg + glow)
  Model Card:     idle (blue border) → hover (scale
   1.02 + glow) → selected (orange border)
  Input Field:    dark bg, orange text, blue focus 
  ring
  Toggle:         off (gray) → on (orange pill)    
  Section Header: light blue left accent bar,      
  collapsible with arrow icon

  Interaction Notes

  - Press E to toggle editor mode on/off
  - Click 3D object to select → shows orange       
  outline + opens properties
  - Drag from spawn panel into scene to place new  
  object
  - G/R/S keys switch transform gizmo mode
  - Ctrl+Shift+S saves layout to JSON
  - Escape deselects current object