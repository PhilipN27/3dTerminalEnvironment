import { BrowserWindow, ipcMain } from 'electron';
import { IPC } from '../shared/types';

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  ipcMain.on(IPC.SHELL_INPUT, (_event, data: { input: string }) => {
    console.log('Shell input received:', data.input);
  });

  ipcMain.on(IPC.SHELL_SWITCH, (_event, data: { shell: string }) => {
    console.log('Shell switch requested:', data.shell);
  });

  ipcMain.on(IPC.SHELL_RESIZE, (_event, data: { cols: number; rows: number }) => {
    console.log('Shell resize:', data.cols, data.rows);
  });
}
