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

import { useState, useEffect, useRef, useCallback } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { MenuBar } from "./MenuBar";
import { Manual } from "./Manual";
import Encoding from "encoding-japanese";
import {
  CopyIcon,
  MoonIcon,
  SunIcon,
  ClipboardCopyIcon,
  TrashIcon,
  ClipboardIcon,
  PinIcon,
  CompactIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SystemThemeIcon,
} from "./Icon";

interface Counts {
  withSpaces: number;
  withoutNewlines: number;
  withoutSpacesAndNewlines: number;
  lines: number;
  bytesUtf8: number;
  bytesUtf16: number;
  bytesShiftJis: number;
  bytesEucJp: number;
  bytesJis: number;
  manuscriptPages: number;
}

export const App = () => {
  const [platform, setPlatform] = useState<string>("");
  const [text, setText] = useState<string>("");
  const [counts, setCounts] = useState<Counts>({
    withSpaces: 0,
    withoutNewlines: 0,
    withoutSpacesAndNewlines: 0,
    lines: 1,
    bytesUtf8: 0,
    bytesUtf16: 0,
    bytesShiftJis: 0,
    bytesEucJp: 0,
    bytesJis: 0,
    manuscriptPages: 0,
  });
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(false);
  const [isAutoClipboard, setIsAutoClipboard] = useState<boolean>(true);
  const [selectedTheme, setSelectedTheme] = useState<"light" | "dark" | "auto">(
    "auto"
  );
  const [displayTheme, setDisplayTheme] = useState<"light" | "dark">("light");
  const lastClipboardText = useRef<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false);
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);
  const preCompactState = useRef<{
    isAutoClipboard: boolean;
    isAlwaysOnTop: boolean;
  }>({
    isAutoClipboard: true,
    isAlwaysOnTop: false,
  });

  useEffect(() => {
    const initializeApp = async () => {
      const { selectedTheme, displayTheme, platform } =
        await window.electronAPI.getInitialLoadInfo();

      setSelectedTheme(selectedTheme);
      setDisplayTheme(displayTheme);
      setPlatform(platform);

      document.body.className = displayTheme === "dark" ? "dark-theme" : "";

      window.electronAPI.readyToShow();

      if (platform === "darwin") {
        window.electronAPI.saveTheme(selectedTheme);
      }
    };
    initializeApp();
  }, []);

  useEffect(() => {
    if (!platform) return;
    window.electronAPI.setThemeSource(selectedTheme);
    window.electronAPI.saveTheme(selectedTheme);

    let cleanupThemeUpdate: (() => void) | undefined;

    const updateDisplayTheme = async () => {
      if (selectedTheme === "auto") {
        cleanupThemeUpdate = window.electronAPI.onThemeUpdate((newTheme) => {
          setDisplayTheme(newTheme);
        });
      } else {
        setDisplayTheme(selectedTheme);
      }
    };

    updateDisplayTheme();

    return () => {
      if (cleanupThemeUpdate) {
        cleanupThemeUpdate();
      }
    };
  }, [selectedTheme, platform]);

  useEffect(() => {
    document.body.className = displayTheme === "dark" ? "dark-theme" : "";
  }, [displayTheme]);

  const handleSetTheme = useCallback((theme: "light" | "dark" | "auto") => {
    setSelectedTheme(theme);
  }, []);

  const cycleTheme = useCallback(() => {
    const themes: Array<"light" | "dark" | "auto"> = ["light", "dark", "auto"];
    const currentIndex = themes.indexOf(selectedTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setSelectedTheme(themes[nextIndex]);
  }, [selectedTheme]);

  const handleCopyText = useCallback(() => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback("テキスト全体をコピーしました");
      setTimeout(() => setCopyFeedback(""), 2000);
    });
  }, [text]);

  const handleClearText = useCallback(() => {
    if (text) {
      setText("");
      setCopyFeedback("テキストボックスをクリアしました");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  }, [text]);

  const handleToggleAutoClipboard = useCallback(() => {
    setIsAutoClipboard((prev) => !prev);
  }, []);

  const handleToggleAlwaysOnTop = useCallback(() => {
    setIsAlwaysOnTop((prev) => !prev);
  }, []);

  const handleToggleCompactMode = useCallback(() => {
    setIsCompactMode((prev) => !prev);
  }, []);

  const COMPACT_WIDTH = 420;
  const COMPACT_HEIGHT = 340;
  const NORMAL_MIN_WIDTH = 540;
  const NORMAL_MIN_HEIGHT = 600;

  useEffect(() => {
    if (!platform) return;
    if (isCompactMode) {
      preCompactState.current = {
        isAutoClipboard,
        isAlwaysOnTop,
      };
      setIsAutoClipboard(true);
      setIsAlwaysOnTop(true);

      window.electronAPI.setMaximizable(false);
      window.electronAPI.setMinimumSize(COMPACT_WIDTH, COMPACT_HEIGHT);
      window.electronAPI.setMaximumSize(COMPACT_WIDTH, 585);
      window.electronAPI.setWindowSize(COMPACT_WIDTH, COMPACT_HEIGHT, true);
    } else {
      setIsAutoClipboard(preCompactState.current.isAutoClipboard);
      setIsAlwaysOnTop(preCompactState.current.isAlwaysOnTop);
      window.electronAPI.setMaximizable(true);

      window.electronAPI.setMinimumSize(NORMAL_MIN_WIDTH, NORMAL_MIN_HEIGHT);
      window.electronAPI.setMaximumSize(10000, 10000);
      window.electronAPI.setWindowSize(800, 800, true);
    }
  }, [isCompactMode, platform]);

  useEffect(() => {
    if (!platform) return;
    const cleanupFileOpened = window.electronAPI.onFileOpened((content) => {
      if (content !== null) {
        setText(content);
      }
    });

    const cleanupMenuAction = window.electronAPI.onMenuAction(
      (action, payload) => {
        switch (action) {
          case "copy-text":
            handleCopyText();
            break;
          case "clear-text":
            handleClearText();
            break;
          case "toggle-auto-clipboard":
            setIsAutoClipboard(payload ?? ((prev) => !prev));
            break;
          case "toggle-always-on-top":
            setIsAlwaysOnTop(payload ?? ((prev) => !prev));
            break;
          case "toggle-compact-mode":
            handleToggleCompactMode();
            break;
          case "set-theme":
            if (
              payload === "light" ||
              payload === "dark" ||
              payload === "auto"
            ) {
              handleSetTheme(payload);
            }
            break;
        }
      }
    );

    return () => {
      cleanupFileOpened();
      cleanupMenuAction();
    };
  }, [
    platform,
    handleCopyText,
    handleClearText,
    handleToggleAutoClipboard,
    handleToggleAlwaysOnTop,
    handleToggleCompactMode,
    handleSetTheme,
  ]);

  const handleOpenFile = useCallback(async () => {
    const fileContent = await window.electronAPI.openFile();
    if (fileContent !== null && fileContent !== undefined) {
      setText(fileContent);
    }
  }, []);

  const handleSaveFile = useCallback(async () => {
    if (!text) return;
    const result = await window.electronAPI.saveFile(text);
    if (result?.success) {
      setCopyFeedback(`ファイルを保存しました: ${result.path}`);
      setTimeout(() => setCopyFeedback(""), 3000);
    } else if (result?.error && result.error !== "Save dialog was canceled.") {
      setCopyFeedback(`エラー: ${result.error}`);
      setTimeout(() => setCopyFeedback(""), 3000);
    }
  }, [text]);

  useEffect(() => {
    if (!platform) return;
    window.electronAPI.updateMenuState("toggle-compact-mode", isCompactMode);
  }, [isCompactMode, platform]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!platform) return;
      const modifier = platform === "darwin" ? e.metaKey : e.ctrlKey;

      if (modifier && e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case "c":
            e.preventDefault();
            handleCopyText();
            break;
          case "d":
            e.preventDefault();
            handleClearText();
            break;
          case "b":
            e.preventDefault();
            handleToggleAutoClipboard();
            break;
          case "t":
            e.preventDefault();
            handleToggleAlwaysOnTop();
            break;
          case "m":
            e.preventDefault();
            handleToggleCompactMode();
            break;
        }
        return;
      }

      if (modifier && !e.shiftKey) {
        if (platform === "darwin") return;
        switch (e.key.toLowerCase()) {
          case "o":
            e.preventDefault();
            handleOpenFile();
            break;
          case "s":
            e.preventDefault();
            handleSaveFile();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    platform,
    handleOpenFile,
    handleSaveFile,
    handleCopyText,
    handleClearText,
    handleToggleAutoClipboard,
    handleToggleAlwaysOnTop,
    handleToggleCompactMode,
  ]);

  useEffect(() => {
    const textAsArray = Array.from(text);
    const withSpaces = textAsArray.length;
    const textWithoutNewlines = text.replace(/(\r\n|\n|\r)/gm, "");
    const withoutNewlines = Array.from(textWithoutNewlines).length;
    const withoutSpacesAndNewlines = Array.from(text.replace(/\s/g, "")).length;
    const lines = text.length === 0 ? 0 : text.split("\n").length;
    const bytesUtf8 = new TextEncoder().encode(text).length;
    const bytesUtf16 = text.length * 2;
    const unicodeArray = Encoding.stringToCode(text);
    const bytesShiftJis = Encoding.convert(unicodeArray, {
      to: "SJIS",
      type: "array",
    }).length;
    const bytesEucJp = Encoding.convert(unicodeArray, {
      to: "EUCJP",
      type: "array",
    }).length;
    const bytesJis = Encoding.convert(unicodeArray, {
      to: "JIS",
      type: "array",
    }).length;
    const manuscriptPages = Math.ceil(withoutNewlines / 400);

    setCounts({
      withSpaces,
      withoutNewlines,
      withoutSpacesAndNewlines,
      lines,
      bytesUtf8,
      bytesUtf16,
      bytesShiftJis,
      bytesEucJp,
      bytesJis,
      manuscriptPages,
    });
  }, [text]);

  useEffect(() => {
    if (!platform) return;
    window.electronAPI.setAlwaysOnTop(isAlwaysOnTop);
    window.electronAPI.updateMenuState("toggle-always-on-top", isAlwaysOnTop);
  }, [isAlwaysOnTop, platform]);

  useEffect(() => {
    if (!platform) return;
    window.electronAPI.updateMenuState(
      "toggle-auto-clipboard",
      isAutoClipboard
    );
    if (!isAutoClipboard) return;
    const intervalId = setInterval(async () => {
      const clipboardText = await window.electronAPI.readClipboard();
      if (clipboardText && clipboardText !== lastClipboardText.current) {
        lastClipboardText.current = clipboardText;
        setText(clipboardText);
      }
    }, 500);
    return () => clearInterval(intervalId);
  }, [isAutoClipboard, platform]);

  const handleTextAreaFocus = () => {
    if (isAutoClipboard) {
      setIsAutoClipboard(false);
    }
  };

  const handleCopy = (value: string | number) => {
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopyFeedback(`「${value}」をコピーしました`);
      setTimeout(() => setCopyFeedback(""), 2000);
    });
  };

  const handleExit = () => {
    window.electronAPI.quitApp();
  };

  const handleCheckForUpdates = () => {
    window.electronAPI.checkForUpdates();
  };

  const ThemeSwitcher = () => {
    const getIcon = () => {
      switch (selectedTheme) {
        case "light":
          return <SunIcon />;
        case "dark":
          return <MoonIcon />;
        case "auto":
          return <SystemThemeIcon />;
        default:
          return null;
      }
    };
    const getTitle = () => {
      switch (selectedTheme) {
        case "light":
          return "テーマの切り替え(ライトテーマ)";
        case "dark":
          return "テーマの切り替え(ダークテーマ)";
        case "auto":
          return "テーマの切り替え(システムテーマ)";
        default:
          return "テーマの切り替え";
      }
    };
    return (
      <button className="icon-button" onClick={cycleTheme} title={getTitle()}>
        {getIcon()}
      </button>
    );
  };

  if (!platform) {
    return null;
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className={`container${isCompactMode ? " compact" : ""}`}>
              <MenuBar
                platform={platform}
                onOpenFile={handleOpenFile}
                onSaveFile={handleSaveFile}
                onExit={handleExit}
                onOpenManual={() => window.electronAPI.openManualWindow()}
                onCheckForUpdates={handleCheckForUpdates}
                onCopyText={handleCopyText}
                onClearText={handleClearText}
                onToggleAutoClipboard={handleToggleAutoClipboard}
                onToggleAlwaysOnTop={handleToggleAlwaysOnTop}
                onToggleCompactMode={handleToggleCompactMode}
                isAutoClipboard={isAutoClipboard}
                isAlwaysOnTop={isAlwaysOnTop}
                isCompactMode={isCompactMode}
                theme={selectedTheme}
                onToggleTheme={cycleTheme}
              />
              <div className={`main-content${isCompactMode ? " compact" : ""}`}>
                <div className={`controls${isCompactMode ? " compact" : ""}`}>
                  <div className="controls-left">
                    <button
                      className="icon-button copy-style"
                      onClick={handleCopyText}
                      title="テキスト全体をコピー"
                    >
                      <ClipboardCopyIcon />
                    </button>
                    <button
                      className="icon-button clear-style"
                      onClick={handleClearText}
                      title="テキスト全体をクリア"
                    >
                      <TrashIcon />
                    </button>
                    <button
                      className={`icon-button ${
                        isAutoClipboard ? "active" : ""
                      }`}
                      onClick={() => setIsAutoClipboard(!isAutoClipboard)}
                      title="クリップボード自動取得"
                      disabled={isCompactMode}
                    >
                      <ClipboardIcon />
                    </button>
                    <button
                      className={`icon-button ${isAlwaysOnTop ? "active" : ""}`}
                      onClick={() => setIsAlwaysOnTop(!isAlwaysOnTop)}
                      title="常に手前に表示"
                    >
                      <PinIcon />
                    </button>
                    <button
                      className={`icon-button ${isCompactMode ? "active" : ""}`}
                      onClick={handleToggleCompactMode}
                      title={
                        isCompactMode ? "通常モードに戻す" : "コンパクトモード"
                      }
                    >
                      <CompactIcon />
                    </button>
                    <ThemeSwitcher />
                  </div>
                </div>

                {!isCompactMode && (
                  <textarea
                    id="main-textarea"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={handleTextAreaFocus}
                    placeholder="ここにテキストを入力またはペーストしてください"
                  />
                )}

                <div className="info-panel">
                  <div className="info-item">
                    <span>文字数</span>
                    <span>{counts.withSpaces}</span>
                    <button
                      className="icon-copy-button"
                      onClick={() => handleCopy(counts.withSpaces)}
                      title="数値をコピー"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                  <div className="info-item">
                    <span>文字数 (改行除く)</span>
                    <span>{counts.withoutNewlines}</span>
                    <button
                      className="icon-copy-button"
                      onClick={() => handleCopy(counts.withoutNewlines)}
                      title="数値をコピー"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                  <div className="info-item">
                    <span>文字数 (改行、空白除く)</span>
                    <span>{counts.withoutSpacesAndNewlines}</span>
                    <button
                      className="icon-copy-button"
                      onClick={() =>
                        handleCopy(counts.withoutSpacesAndNewlines)
                      }
                      title="数値をコピー"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                  <div className="info-item">
                    <span>行数</span>
                    <span>{counts.lines}</span>
                    <button
                      className="icon-copy-button"
                      onClick={() => handleCopy(counts.lines)}
                      title="数値をコピー"
                    >
                      <CopyIcon />
                    </button>
                  </div>
                  <hr className="info-divider" />
                  <div
                    className="details-toggle"
                    onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                  >
                    <span>
                      {isDetailsVisible ? (
                        <ChevronUpIcon size={18} />
                      ) : (
                        <ChevronDownIcon size={18} />
                      )}
                      詳細なカウント
                    </span>
                  </div>
                  {isDetailsVisible && (
                    <div className="collapsible-content">
                      <div className="info-item">
                        <span>バイト数 (UTF-8)</span>
                        <span>{counts.bytesUtf8}</span>
                        <button
                          className="icon-copy-button"
                          onClick={() => handleCopy(counts.bytesUtf8)}
                          title="数値をコピー"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                      <div className="info-item">
                        <span>バイト数 (UTF-16)</span>
                        <span>{counts.bytesUtf16}</span>
                        <button
                          className="icon-copy-button"
                          onClick={() => handleCopy(counts.bytesUtf16)}
                          title="数値をコピー"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                      <div className="info-item">
                        <span>バイト数 (Shift-JIS)</span>
                        <span>{counts.bytesShiftJis}</span>
                        <button
                          className="icon-copy-button"
                          onClick={() => handleCopy(counts.bytesShiftJis)}
                          title="数値をコピー"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                      <div className="info-item">
                        <span>バイト数 (EUC-JP)</span>
                        <span>{counts.bytesEucJp}</span>
                        <button
                          className="icon-copy-button"
                          onClick={() => handleCopy(counts.bytesEucJp)}
                          title="数値をコピー"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                      <div className="info-item">
                        <span>バイト数 (JIS)</span>
                        <span>{counts.bytesJis}</span>
                        <button
                          className="icon-copy-button"
                          onClick={() => handleCopy(counts.bytesJis)}
                          title="数値をコピー"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                      <hr className="info-divider" />
                      <div className="info-item">
                        <span>原稿用紙 (400字)</span>
                        <span>{counts.manuscriptPages} 枚</span>
                        <button
                          className="icon-copy-button"
                          onClick={() => handleCopy(counts.manuscriptPages)}
                          title="数値をコピー"
                        >
                          <CopyIcon />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {copyFeedback && (
                <div className="copy-feedback">{copyFeedback}</div>
              )}
            </div>
          }
        />
        <Route path="/manual" element={<Manual />} />
      </Routes>
    </HashRouter>
  );
};
