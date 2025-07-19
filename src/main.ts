const path = require("node:path");
import { BrowserWindow, app, ipcMain, clipboard } from "electron";

app.whenReady().then(() => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 800,
    icon: path.join(__dirname, "../assets/icon.png"),
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#ededff",
      symbolColor: "#60606a",
      height: 36,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.setMenu(null);

  ipcMain.on("set-always-on-top", (event, isAlwaysOnTop) => {
    mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  });

  ipcMain.handle("read-clipboard", () => {
    return clipboard.readText();
  });

  ipcMain.on("quit-app", () => {
    app.quit();
  });

  ipcMain.handle("open-file", async () => {
    const { dialog } = require("electron");
    const fs = require("node:fs");
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [{ name: "Text Files", extensions: ["txt"] }],
    });
    if (!canceled && filePaths.length > 0) {
      try {
        return fs.readFileSync(filePaths[0], "utf-8");
      } catch (error) {
        console.error("Failed to read file:", error);
        return null;
      }
    }
    return null;
  });

  ipcMain.handle("save-file", async (event, content: string) => {
    const { dialog } = require("electron");
    const fs = require("node:fs");
    const { canceled, filePath } = await dialog.showSaveDialog({
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
  });

  ipcMain.on("open-manual-window", () => {
    const manualWindow = new BrowserWindow({
      width: 480,
      height: 400,
      frame: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      title: "使用方法",
      parent: mainWindow,
      modal: false,
      transparent: true,
      closable: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
      },
    });
    manualWindow.setMenu(null);
    manualWindow.loadFile(path.join(__dirname, "../dist/index.html"), {
      hash: "/manual",
    });
  });

  ipcMain.on("show-about-dialog", () => {
    const { dialog } = require("electron");
    const appVersion = app.getVersion();
    dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "バージョン情報",
      message: `文字数カウンター\nバージョン: ${appVersion}\n制作者: molyashi`,
      buttons: ["OK"],
    });
  });

  mainWindow.loadFile("dist/index.html");
});

app.once("window-all-closed", () => app.quit());
