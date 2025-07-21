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
    content: string,
  ) => Promise<{ success: boolean; path?: string; error?: string }>;
  quitApp: () => void;
  openManualWindow: () => void;
  showAboutDialog: () => void;
  getPlatform: () => Promise<"win32" | "darwin" | "linux">;
  openExternalLink: (url: string) => void;
  onFileOpened: (callback: (content: string) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: IElectronAPI;
  }
}
