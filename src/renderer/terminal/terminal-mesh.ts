import * as THREE from 'three';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { TerminalIO } from './terminal-io';

export class TerminalMesh {
  mesh: THREE.Mesh;
  private terminal: Terminal;
  private fitAddon: FitAddon;
  private io: TerminalIO;
  private canvas: HTMLCanvasElement;
  private texture: THREE.CanvasTexture;
  private hiddenContainer: HTMLDivElement;
  private needsUpdate = false;

  constructor(io: TerminalIO) {
    this.io = io;

    // Hidden container for xterm.js (it needs a DOM element)
    this.hiddenContainer = document.createElement('div');
    this.hiddenContainer.style.position = 'absolute';
    this.hiddenContainer.style.left = '-9999px';
    this.hiddenContainer.style.width = '960px';
    this.hiddenContainer.style.height = '540px';
    document.body.appendChild(this.hiddenContainer);

    // Initialize xterm.js
    this.terminal = new Terminal({
      cols: 120,
      rows: 30,
      theme: {
        background: '#0a0a1a',
        foreground: '#00ffcc',
        cursor: '#00ffcc',
        cyan: '#00ffff',
        green: '#00ff66',
        magenta: '#ff00ff',
        yellow: '#ffff00',
        red: '#ff3366',
        blue: '#3366ff',
      },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
      cursorBlink: true,
    });

    this.fitAddon = new FitAddon();
    this.terminal.loadAddon(this.fitAddon);
    this.terminal.open(this.hiddenContainer);
    this.fitAddon.fit();

    // Canvas for texture
    this.canvas = document.createElement('canvas');
    this.canvas.width = 1024;
    this.canvas.height = 512;

    // Three.js texture
    this.texture = new THREE.CanvasTexture(this.canvas);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;

    // Monitor mesh
    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(5, 2.5),
      new THREE.MeshStandardMaterial({
        map: this.texture,
        emissive: 0x003322,
        emissiveIntensity: 0.3,
      })
    );
    // Mounted on back wall, facing forward
    this.mesh.position.set(0, 4, -9.5);

    // Wire up I/O
    this.terminal.onData((data) => {
      this.io.sendInput(data);
    });

    this.io.onOutput((data) => {
      this.terminal.write(data);
      this.needsUpdate = true;
    });

    this.terminal.onRender(() => {
      this.needsUpdate = true;
    });
  }

  focus() {
    this.terminal.focus();
  }

  update() {
    if (!this.needsUpdate) return;
    this.needsUpdate = false;

    const xtermCanvas = this.hiddenContainer.querySelector('canvas');
    if (xtermCanvas) {
      const ctx = this.canvas.getContext('2d')!;
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.drawImage(xtermCanvas, 0, 0, this.canvas.width, this.canvas.height);
      this.texture.needsUpdate = true;
    }
  }
}
