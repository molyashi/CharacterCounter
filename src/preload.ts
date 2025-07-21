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
  openExternalLink: (url: string) => ipcRenderer.send("open-external-link", url),
  onFileOpened: (callback: (content: string) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, value: string) =>
      callback(value);
    ipcRenderer.on("file-opened", handler);
    return () => {
      ipcRenderer.removeListener("file-opened", handler);
    };
  },
});
