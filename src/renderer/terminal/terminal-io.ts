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
  private get api() {
    return window.electronAPI;
  }

  onOutput(callback: (data: string) => void) {
    this.api?.onShellOutput(callback);
  }

  sendInput(data: string) {
    this.api?.sendShellInput(data);
  }

  resize(cols: number, rows: number) {
    this.api?.resizeShell(cols, rows);
  }

  switchShell(shell: string) {
    this.api?.switchShell(shell);
  }

  onAgentEvent(callback: (event: { agent: string; event: string }) => void) {
    this.api?.onAgentEvent(callback);
  }
}
