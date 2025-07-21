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

import path from "node:path";
import fs from "node:fs";
import { BrowserWindow, app, ipcMain, clipboard, Menu, dialog } from "electron";

let mainWindow: BrowserWindow | null = null;

async function handleOpenFile() {
  if (!mainWindow) return null;
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ["openFile"],
    filters: [{ name: "Text Files", extensions: ["txt"] }],
  });
  if (!canceled && filePaths.length > 0) {
    try {
      const content = fs.readFileSync(filePaths[0], "utf-8");
      mainWindow.webContents.send("file-opened", content);
      return content;
    } catch (error) {
      console.error("Failed to read file:", error);
      return null;
    }
  }
  return null;
}

async function handleSaveFile(content: string) {
  if (!mainWindow) return { success: false, error: "Main window not found." };
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: "名前を付けて保存",
    defaultPath: "document.txt",
    filters: [{ name: "Text Files", extensions: ["txt"] }],
  });

  if (!canceled && filePath) {
    try {
      fs.writeFileSync(filePath, content, "utf-8");
      return { success: true, path: filePath };
    } catch (error: any) {
      console.error("Failed to save file:", error);
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: "Save dialog was canceled." };
}

async function handleSaveFileFromNativeMenu() {
    if (!mainWindow) return;
    const content = await mainWindow.webContents.executeJavaScript(
      'document.getElementById("main-textarea")?.value', true
    );
    if (typeof content === 'string') {
      await handleSaveFile(content);
    }
}

function openManualWindow() {
  if (!mainWindow) return;
  const manualWindow = new BrowserWindow({
    width: 480,
    height: 400,
    title: "使用方法",
    parent: mainWindow,
    modal: false,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  manualWindow.setMenu(null);
  manualWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
    hash: "/manual",
  });
}

function showAboutDialog() {
  if (!mainWindow) return;
  const appVersion = app.getVersion();
  dialog.showMessageBox(mainWindow, {
    type: "info",
    title: "バージョン情報",
    message: `文字数カウンター\nバージョン: ${appVersion}\n制作者: molyashi`,
    buttons: ["OK"],
  });
}

const macMenuTemplate: (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] = [
    {
        label: app.getName(),
        submenu: [
            { role: 'quit', label: '文字数カウンターを終了' }
        ]
    },
    {
        label: "ファイル",
        submenu: [
            { label: ".txtを読み込む", click: () => handleOpenFile(), accelerator: 'CmdOrCtrl+O' },
            { label: ".txtとして保存", click: () => handleSaveFileFromNativeMenu(), accelerator: 'CmdOrCtrl+S' }
        ],
    },
    {
        label: "ヘルプ",
        submenu: [
            { label: "使用方法", click: () => openManualWindow() },
            { label: 'バージョン情報', click: () => showAboutDialog() }
        ],
    },
];

function createWindow() {
  const isMac = process.platform === "darwin";
  const isLinux = process.platform === "linux";

  const browserWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 800,
    icon: path.join(__dirname, "../assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
  };

  if (isMac) {
    browserWindowOptions.titleBarStyle = "hidden";
    browserWindowOptions.trafficLightPosition = { x: 15, y: 11 };
  } else if (isLinux) {
    browserWindowOptions.frame = true;
  } else {
    browserWindowOptions.frame = false;
    browserWindowOptions.titleBarStyle = "hidden";
    browserWindowOptions.titleBarOverlay = {
      color: "#ededff",
      symbolColor: "#60606a",
      height: 36,
    };
  }

  mainWindow = new BrowserWindow(browserWindowOptions);

  if (isMac) {
    const menu = Menu.buildFromTemplate(macMenuTemplate);
    Menu.setApplicationMenu(menu);
  } else {
    mainWindow.setMenu(null);
  }

  mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}


app.whenReady().then(() => {
  createWindow();

  ipcMain.handle("get-platform", () => process.platform);

  ipcMain.on("set-always-on-top", (event, isAlwaysOnTop) => {
    mainWindow?.setAlwaysOnTop(isAlwaysOnTop);
  });

  ipcMain.handle("read-clipboard", () => {
    return clipboard.readText();
  });

  ipcMain.on("quit-app", () => {
    app.quit();
  });

  ipcMain.handle("open-file", handleOpenFile);
  ipcMain.handle("save-file", (event, content: string) => handleSaveFile(content));

  ipcMain.on("open-manual-window", openManualWindow);
  ipcMain.on("show-about-dialog", showAboutDialog);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
