// Character Counter - A simple tool to count characters copied to the clipboard.
// Copyright (C) 2025 molyashi
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

export interface IElectronAPI {
  setAlwaysOnTop: (isAlwaysOnTop: boolean) => void;
  readClipboard: () => Promise<string>;
  openFile: () => Promise<string | null>;
  saveFile: (
    content: string
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  quitApp: () => void;
  openManualWindow: () => void;
  showAboutDialog: () => void;
  openExternalLink: (url: string) => void;
  setWindowSize: (width: number, height: number, resizable: boolean) => void;
  setMinimumSize: (width: number, height: number) => void;
  setMaximumSize: (width: number, height: number) => void;
  setMaximizable: (maximizable: boolean) => void;
  onFileOpened: (callback: (content: string) => void) => () => void;
  onMenuAction: (
    callback: (action: string, payload?: any) => void
  ) => () => void;
  updateMenuState: (key: string, value: boolean) => void;
  checkForUpdates: () => void;
  setThemeSource: (theme: "light" | "dark" | "auto") => void;
  saveTheme: (theme: "light" | "dark" | "auto") => void;
  onThemeUpdate: (callback: (theme: "light" | "dark") => void) => () => void;
  getInitialLoadInfo: () => Promise<{
    selectedTheme: "light" | "dark" | "auto";
    displayTheme: "light" | "dark";
    platform: string;
  }>;
  readyToShow: () => void;
}
declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
