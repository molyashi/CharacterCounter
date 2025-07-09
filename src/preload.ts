import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setAlwaysOnTop: (isAlwaysOnTop: boolean) => ipcRenderer.send('set-always-on-top', isAlwaysOnTop),
  readClipboard: () => ipcRenderer.invoke('read-clipboard'),
  openFile: () => ipcRenderer.invoke('open-file'),
  saveFile: (content: string) => ipcRenderer.invoke('save-file', content),
  quitApp: () => ipcRenderer.send('quit-app'),
  openManualWindow: () => ipcRenderer.send('open-manual-window'),
  showAboutDialog: () => ipcRenderer.send('show-about-dialog'),
});

declare global {
  interface Window {
    electronAPI: {
      saveFile(text: string): unknown;
      setAlwaysOnTop: (isAlwaysOnTop: boolean) => void;
      readClipboard: () => Promise<string>;
      openFile: () => Promise<string | null>;
      quitApp: () => void;
      openManualWindow?: () => void;
      showAboutDialog?: () => void;
    };
  }
}
