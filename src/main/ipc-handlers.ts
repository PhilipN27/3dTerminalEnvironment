import { BrowserWindow, ipcMain } from 'electron';
import { IPC, ShellType } from '../shared/types';
import { ShellManager } from './shell-manager';

export function setupIpcHandlers(mainWindow: BrowserWindow) {
  const shellManager = new ShellManager();

  shellManager.onData((data) => {
    mainWindow.webContents.send(IPC.SHELL_OUTPUT, data);
  });

  shellManager.start('powershell');

  ipcMain.on(IPC.SHELL_INPUT, (_event, data: { input: string }) => {
    shellManager.write(data.input);
  });

  ipcMain.on(IPC.SHELL_SWITCH, (_event, data: { shell: ShellType }) => {
    shellManager.start(data.shell);
  });

  ipcMain.on(IPC.SHELL_RESIZE, (_event, data: { cols: number; rows: number }) => {
    shellManager.resize(data.cols, data.rows);
  });

  mainWindow.on('closed', () => {
    shellManager.dispose();
  });

  return shellManager;
}
