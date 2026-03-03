declare global {
  interface Window {
    electronAPI: {
      sendShellInput: (input: string) => void;
      onShellOutput: (callback: (data: string) => void) => void;
      switchShell: (shell: string) => void;
      resizeShell: (cols: number, rows: number) => void;
      onAgentEvent: (callback: (event: { agent: string; event: string }) => void) => void;
    };
  }
}

export class TerminalIO {
  onOutput(callback: (data: string) => void) {
    window.electronAPI.onShellOutput(callback);
  }

  sendInput(data: string) {
    window.electronAPI.sendShellInput(data);
  }

  resize(cols: number, rows: number) {
    window.electronAPI.resizeShell(cols, rows);
  }

  switchShell(shell: string) {
    window.electronAPI.switchShell(shell);
  }
}
