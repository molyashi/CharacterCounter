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
import { exec, execSync } from "node:child_process";
import {
  BrowserWindow,
  app,
  ipcMain,
  clipboard,
  Menu,
  dialog,
  shell,
  nativeTheme,
} from "electron";
import { autoUpdater } from "electron-updater";

let mainWindow: BrowserWindow | null = null;
let manualWindow: BrowserWindow | null = null;
let dependencyCheckCompleted = false;

const settingsPath = path.join(app.getPath("userData"), "CharacterCounterData.json");

interface AppSettings {
  theme: "light" | "dark" | "auto";
  hideClipboardWarning?: boolean;
}

function readSettings(): AppSettings {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Failed to read settings, using defaults:", error);
  }
  return { theme: "auto" };
}

function saveSettings(settings: AppSettings) {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

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
    'document.getElementById("main-textarea")?.value',
    true
  );
  if (typeof content === "string") {
    await handleSaveFile(content);
  }
}

function openManualWindow() {
  if (manualWindow) {
    manualWindow.focus();
    return;
  }
  if (!mainWindow) return;

  manualWindow = new BrowserWindow({
    width: 480,
    height: 400,
    title: "使用方法",
    parent: mainWindow,
    frame: true,
    resizable: false,
    maximizable: false,
    minimizable: true,
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

  manualWindow.webContents.on('did-finish-load', () => {
    const theme = nativeTheme.shouldUseDarkColors ? "dark" : "light";
    manualWindow?.webContents.send("theme-updated", theme);
  });

  manualWindow.on("closed", () => {
    manualWindow = null;
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

function manualCheckForUpdates() {
  autoUpdater.once("update-not-available", () => {
    dialog.showMessageBox({
      title: "更新の確認",
      message: "現在入手可能な更新はありません。",
    });
  });

  autoUpdater.once("error", (err) => {
    dialog.showMessageBox({
      title: "更新エラー",
      type: "error",
      message: `更新の確認中にエラーが発生しました: ${err.message}`,
    });
  });

  autoUpdater.once("update-downloaded", (info) => {
    dialog
      .showMessageBox({
        title: "アップデートの準備ができました",
        message: `バージョン ${info.version} のインストール準備ができました。アプリケーションを再起動してアップデートを適用します。`,
        buttons: ["再起動", "後で"],
      })
      .then((result) => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.checkForUpdates();
}

async function checkClipboardDependencies() {
  if (process.platform !== "linux") {
    return;
  }

  if (!mainWindow) {
    return;
  }

  const settings = readSettings();
  if (settings.hideClipboardWarning) {
    return;
  }

  try {
    execSync("command -v wl-paste >/dev/null 2>&1 || command -v xclip >/dev/null 2>&1");
  } catch (error) {
    const { checkboxChecked } = await dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "クリップボードライブラリの不足",
      message: "必要なクリップボードライブラリが見つかりません。",
      detail:
        "クリップボードの自動取得機能を正常に動作させるには、'wl-paste' (Wayland) または 'xclip' (X11) が必要です。\n\nこれらのライブラリがなくてもアプリケーションは基本的な機能を利用できますが、クリップボードの自動取得が正しく機能しない可能性があります。\n\nお使いのディストリビューションのパッケージマネージャを使用してインストールしてください。\n例(Debian/Ubuntuなど): sudo apt install wl-paste",
      buttons: ["OK"],
      checkboxLabel: "今後はこのメッセージを表示しない",
      checkboxChecked: false,
    });

    if (checkboxChecked) {
      saveSettings({ ...settings, hideClipboardWarning: true });
    }
  }
}

function buildMenu() {
  const menuTemplate: (
    | Electron.MenuItemConstructorOptions
    | Electron.MenuItem
  )[] = [
    {
      label: app.getName(),
      submenu: [{ role: "quit", label: "文字数カウンターを終了" }],
    },
    {
      label: "ファイル",
      submenu: [
        {
          label: ".txtを読み込む",
          click: () => handleOpenFile(),
          accelerator: "CmdOrCtrl+O",
        },
        {
          label: ".txtとして保存",
          click: () => handleSaveFileFromNativeMenu(),
          accelerator: "CmdOrCtrl+S",
        },
      ],
    },
    {
      label: "ツール",
      submenu: [
        {
          label: "テキスト全体をコピー",
          accelerator: "CmdOrCtrl+Shift+C",
          click: () => {
            mainWindow?.webContents.send("menu-action", "copy-text");
          },
        },
        {
          label: "テキスト全体をクリア",
          accelerator: "CmdOrCtrl+Shift+D",
          click: () => {
            mainWindow?.webContents.send("menu-action", "clear-text");
          },
        },
        {
          id: "toggle-auto-clipboard",
          label: "クリップボード自動取得",
          type: "checkbox",
          accelerator: "CmdOrCtrl+Shift+B",
          click: (menuItem) => {
            mainWindow?.webContents.send(
              "menu-action",
              "toggle-auto-clipboard",
              menuItem.checked
            );
          },
        },
        {
          id: "toggle-always-on-top",
          label: "常に手前に表示",
          type: "checkbox",
          accelerator: "CmdOrCtrl+Shift+T",
          click: (menuItem) => {
            mainWindow?.webContents.send(
              "menu-action",
              "toggle-always-on-top",
              menuItem.checked
            );
          },
        },
        {
          id: "toggle-compact-mode",
          label: "コンパクトモード",
          type: "checkbox",
          accelerator: "CmdOrCtrl+Shift+M",
          click: (menuItem) => {
            mainWindow?.webContents.send(
              "menu-action",
              "toggle-compact-mode",
              menuItem.checked
            );
          },
        },
        { type: "separator" },
        {
          id: "theme-menu",
          label: "テーマ",
          submenu: [
            {
              id: "theme-light",
              label: "ライト",
              type: "radio",
              click: () =>
                mainWindow?.webContents.send("menu-action", "set-theme", "light"),
            },
            {
              id: "theme-dark",
              label: "ダーク",
              type: "radio",
              click: () =>
                mainWindow?.webContents.send("menu-action", "set-theme", "dark"),
            },
            {
              id: "theme-auto",
              label: "システム",
              type: "radio",
              click: () =>
                mainWindow?.webContents.send("menu-action", "set-theme", "auto"),
            },
          ],
        },
      ],
    },
    {
      label: "ヘルプ",
      submenu: [
        { label: "使用方法", click: () => openManualWindow() },
        { label: "更新を確認...", click: () => manualCheckForUpdates() },
        { label: "バージョン情報", click: () => showAboutDialog() },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

ipcMain.on("update-menu-state", (event, key: string, value: boolean) => {
  const menu = Menu.getApplicationMenu();
  if (menu) {
    const menuItem = menu.getMenuItemById(key);
    if (menuItem) {
      menuItem.checked = value;
    }
  }
});

function createWindow() {
  const isMac = process.platform === "darwin";

  const browserWindowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 800,
    height: 800,
    show: false,
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
  } else {
    browserWindowOptions.frame = false;
    browserWindowOptions.titleBarStyle = "hidden";
    const getTitleBarOverlay = () => {
      const colors = {
        light: { color: "#ededff", symbolColor: "#60606a", height: 36 },
        dark: { color: "#2d2d2d", symbolColor: "#cccccc", height: 36 },
      };
      return nativeTheme.shouldUseDarkColors ? colors.dark : colors.light;
    };
    browserWindowOptions.titleBarOverlay = getTitleBarOverlay();
  }

  mainWindow = new BrowserWindow(browserWindowOptions);

  if (isMac) {
    buildMenu();
  } else {
    mainWindow.setMenu(null);
  }

  mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));

  // mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  autoUpdater.checkForUpdatesAndNotify();

  nativeTheme.on("updated", () => {
    const theme = nativeTheme.shouldUseDarkColors ? "dark" : "light";
    mainWindow?.webContents.send("theme-updated", theme);
    manualWindow?.webContents.send("theme-updated", theme);

    if (process.platform !== 'darwin' && mainWindow) {
        const colors = {
          light: { color: "#ededff", symbolColor: "#60606a", height: 36 },
          dark: { color: "#2d2d2d", symbolColor: "#cccccc", height: 36 },
        };
        mainWindow.setTitleBarOverlay(theme === 'dark' ? colors.dark : colors.light);
    }
  });

  ipcMain.on(
  "set-window-size",
  (event, width: number, height: number, resizable: boolean) => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      }
      mainWindow.setResizable(true);
      mainWindow.setSize(width, height, true);
      mainWindow.setResizable(resizable);
    }
  }
);

  ipcMain.on("set-minimum-size", (event, width: number, height: number) => {
    mainWindow?.setMinimumSize(width, height);
  });

  ipcMain.on("set-maximum-size", (event, width: number, height: number) => {
    mainWindow?.setMaximumSize(width, height);
  });

  ipcMain.on("set-maximizable", (event, maximizable: boolean) => {
    mainWindow?.setMaximizable(maximizable);
  });

  ipcMain.on("set-always-on-top", (event, isAlwaysOnTop) => {
    mainWindow?.setAlwaysOnTop(isAlwaysOnTop);
  });

  ipcMain.on("set-theme-source", (event, theme: "light" | "dark" | "auto") => {
    nativeTheme.themeSource = theme === "auto" ? "system" : theme;
  });

  ipcMain.handle("read-clipboard", () => {
    if (process.platform === 'linux') {
      return new Promise((resolve) => {
        const command = process.env.WAYLAND_DISPLAY
          ? 'wl-paste --no-newline'
          : 'xclip -o -selection clipboard';

        exec(command, (error, stdout) => {
          if (error) {
            console.warn(
              `Native clipboard command failed: ${error.message}. Falling back to Electron API.`
            );
            resolve(clipboard.readText());
          } else {
            resolve(stdout);
          }
        });
      });
    }
    return clipboard.readText();
  });

  ipcMain.on("quit-app", () => {
    app.quit();
  });

  ipcMain.handle("open-file", handleOpenFile);
  ipcMain.handle("save-file", (event, content: string) =>
    handleSaveFile(content)
  );

  ipcMain.on("open-manual-window", openManualWindow);
  ipcMain.on("show-about-dialog", showAboutDialog);

  ipcMain.on("open-external-link", (event, url: string) => {
    shell.openExternal(url);
  });

  ipcMain.on("check-for-updates", () => {
    manualCheckForUpdates();
  });

  ipcMain.handle('get-initial-load-info', () => {
    const settings = readSettings();
    const selectedTheme = settings.theme;
    let displayTheme: 'light' | 'dark';

    if (selectedTheme === 'auto') {
      displayTheme = nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
    } else {
      displayTheme = selectedTheme;
    }

    nativeTheme.themeSource = selectedTheme === 'auto' ? 'system' : selectedTheme;

    return {
      selectedTheme,
      displayTheme,
      platform: process.platform,
    };
  });

  ipcMain.on('ready-to-show', async () => {
    if (dependencyCheckCompleted) {
      return;
    }
    dependencyCheckCompleted = true;

    mainWindow?.show();

    await checkClipboardDependencies();
  });

  ipcMain.on("save-theme", (event, theme: "light" | "dark" | "auto") => {
    const settings = readSettings();
    settings.theme = theme;
    saveSettings(settings);

    if (process.platform === 'darwin') {
      const menu = Menu.getApplicationMenu();
      if (!menu) return;
      const lightItem = menu.getMenuItemById("theme-light");
      const darkItem = menu.getMenuItemById("theme-dark");
      const autoItem = menu.getMenuItemById("theme-auto");
      if(lightItem) lightItem.checked = theme === 'light';
      if(darkItem) darkItem.checked = theme === 'dark';
      if(autoItem) autoItem.checked = theme === 'auto';
    }
  });

  app.on("activate", () => {
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
