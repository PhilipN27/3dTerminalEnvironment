import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from '../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  sendShellInput: (input: string) => ipcRenderer.send(IPC.SHELL_INPUT, { input }),
  onShellOutput: (callback: (data: string) => void) =>
    ipcRenderer.on(IPC.SHELL_OUTPUT, (_event, data) => callback(data)),
  switchShell: (shell: string) => ipcRenderer.send(IPC.SHELL_SWITCH, { shell }),
  resizeShell: (cols: number, rows: number) =>
    ipcRenderer.send(IPC.SHELL_RESIZE, { cols, rows }),
  onAgentEvent: (callback: (event: { agent: string; event: string }) => void) =>
    ipcRenderer.on(IPC.AGENT_EVENT, (_event, data) => callback(data)),
});
