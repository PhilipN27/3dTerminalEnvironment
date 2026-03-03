import * as pty from 'node-pty';
import { ShellType } from '../shared/types';

export class ShellManager {
  private activeShell: pty.IPty | null = null;
  private shellType: ShellType = 'powershell';
  private onDataCallback: ((data: string) => void) | null = null;

  constructor() {}

  onData(callback: (data: string) => void) {
    this.onDataCallback = callback;
  }

  start(type: ShellType = 'powershell') {
    this.dispose();
    this.shellType = type;

    const shell = type === 'powershell' ? 'powershell.exe' : 'bash.exe';

    this.activeShell = pty.spawn(shell, [], {
      name: 'xterm-256color',
      cols: 120,
      rows: 30,
      cwd: process.env.HOME || process.env.USERPROFILE || '.',
      env: process.env as Record<string, string>,
    });

    this.activeShell.onData((data) => {
      this.onDataCallback?.(data);
    });
  }

  write(data: string) {
    this.activeShell?.write(data);
  }

  resize(cols: number, rows: number) {
    this.activeShell?.resize(cols, rows);
  }

  getType(): ShellType {
    return this.shellType;
  }

  dispose() {
    this.activeShell?.kill();
    this.activeShell = null;
  }
}
