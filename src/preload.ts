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

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  setAlwaysOnTop: (isAlwaysOnTop: boolean) =>
    ipcRenderer.send("set-always-on-top", isAlwaysOnTop),
  readClipboard: () => ipcRenderer.invoke("read-clipboard"),
  openFile: () => ipcRenderer.invoke("open-file"),
  saveFile: (content: string) => ipcRenderer.invoke("save-file", content),
  quitApp: () => ipcRenderer.send("quit-app"),
  openManualWindow: () => ipcRenderer.send("open-manual-window"),
  showAboutDialog: () => ipcRenderer.send("show-about-dialog"),
  getPlatform: () => ipcRenderer.invoke("get-platform"),
  openExternalLink: (url: string) =>
    ipcRenderer.send("open-external-link", url),
  setWindowSize: (width: number, height: number, resizable: boolean) =>
    ipcRenderer.send("set-window-size", width, height, resizable),
  setMinimumSize: (width: number, height: number) =>
    ipcRenderer.send("set-minimum-size", width, height),
  onFileOpened: (callback: (content: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: string) =>
      callback(value);
    ipcRenderer.on("file-opened", handler);
    return () => {
      ipcRenderer.removeListener("file-opened", handler);
    };
  },
  onMenuAction: (callback: (action: string, checked?: boolean) => void) => {
    const handler = (
      _event: Electron.IpcRendererEvent,
      action: string,
      checked?: boolean
    ) => callback(action, checked);
    ipcRenderer.on("menu-action", handler);
    return () => {
      ipcRenderer.removeListener("menu-action", handler);
    };
  },
  setMaximumSize: (width: number, height: number) =>
  ipcRenderer.send("set-maximum-size", width, height),
  setMaximizable: (maximizable: boolean) =>
  ipcRenderer.send("set-maximizable", maximizable),
  updateMenuState: (key: string, value: boolean) => {
    ipcRenderer.send("update-menu-state", key, value);
  },
  checkForUpdates: () => ipcRenderer.send("check-for-updates"),
  setNativeTheme: (theme: "light" | "dark") => {
    ipcRenderer.send("set-native-theme", theme);
  },
  getInitialTheme: () => ipcRenderer.invoke("get-initial-theme"),
  saveTheme: (theme: "light" | "dark") => {
    ipcRenderer.send("save-theme", theme);
  },
});
