export interface IElectronAPI {
  setAlwaysOnTop: (isAlwaysOnTop: boolean) => void;
  readClipboard: () => Promise<string>;
  openFile: () => Promise<string | null>;
  saveFile: (content: string) => Promise<{ success: boolean; path?: string; error?: string; }>;
  quitApp: () => void;
  openManualWindow: () => void;
  showAboutDialog: () => void;
  getPlatform: () => Promise<'win32' | 'darwin' | 'linux'>;
  onFileOpened: (callback: (content: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
