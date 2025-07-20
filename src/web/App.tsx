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

import { useState, useEffect, useRef } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import { MenuBar } from "./MenuBar";
import { Manual } from "./Manual";
import Encoding from "encoding-japanese";

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
  const lastClipboardText = useRef<string>("");
  const [copyFeedback, setCopyFeedback] = useState<string>("");
  const [isDetailsVisible, setIsDetailsVisible] = useState<boolean>(false);

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
    window.electronAPI?.setAlwaysOnTop(isAlwaysOnTop);
  }, [isAlwaysOnTop]);

  useEffect(() => {
    if (!isAutoClipboard) return;
    const intervalId = setInterval(async () => {
      const clipboardText = await window.electronAPI?.readClipboard();
      if (clipboardText && clipboardText !== lastClipboardText.current) {
        lastClipboardText.current = clipboardText;
        setText(clipboardText);
      }
    }, 500);
    return () => clearInterval(intervalId);
  }, [isAutoClipboard]);

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

  const handleCopyText = () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback("テキスト全体をコピーしました");
      setTimeout(() => setCopyFeedback(""), 2000);
    });
  };

  const handleOpenFile = async () => {
    const fileContent = await window.electronAPI?.openFile();
    if (fileContent !== null && fileContent !== undefined) {
      setText(fileContent);
    }
  };

  interface SaveFileResult {
    success?: boolean;
    path?: string;
    error?: string;
  }

  const handleSaveFile = async () => {
    if (!text) return;
    const result = (await window.electronAPI?.saveFile(text)) as
      | SaveFileResult
      | undefined;
    if (result?.success) {
      setCopyFeedback(`ファイルを保存しました: ${result.path}`);
      setTimeout(() => setCopyFeedback(""), 3000);
    } else if (result?.error && result.error !== "Save dialog was canceled.") {
      setCopyFeedback(`エラー: ${result.error}`);
      setTimeout(() => setCopyFeedback(""), 3000);
    }
  };

  const handleClearText = () => {
    if (text) {
      setText("");
      setCopyFeedback("テキストボックスをクリアしました");
      setTimeout(() => setCopyFeedback(""), 2000);
    }
  };

  const handleExit = () => {
    window.electronAPI?.quitApp();
  };

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <div className="container">
              <MenuBar
                onOpenFile={handleOpenFile}
                onSaveFile={handleSaveFile}
                onExit={handleExit}
                onOpenManual={() => window.electronAPI?.openManualWindow?.()}
              />
              <div className="main-content">
                <div className="controls">
                  <div className="controls-left">
                    <button
                      className="text-copy-button"
                      onClick={handleCopyText}
                    >
                      コピー
                    </button>
                    <button className="clear-button" onClick={handleClearText}>
                      クリア
                    </button>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={isAutoClipboard}
                        onChange={(e) => setIsAutoClipboard(e.target.checked)}
                      />
                      クリップボード自動取得
                    </label>
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={isAlwaysOnTop}
                      onChange={(e) => setIsAlwaysOnTop(e.target.checked)}
                    />
                    最前面に固定
                  </label>
                </div>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onFocus={handleTextAreaFocus}
                  placeholder="ここにテキストを入力またはペーストしてください"
                />

                <div className="info-panel">
                  <div className="info-item">
                    <span>文字数</span>
                    <span>{counts.withSpaces}</span>
                    <button
                      className="copy-button"
                      onClick={() => handleCopy(counts.withSpaces)}
                    >
                      コピー
                    </button>
                  </div>
                  <div className="info-item">
                    <span>文字数 (改行除く)</span>
                    <span>{counts.withoutNewlines}</span>
                    <button
                      className="copy-button"
                      onClick={() => handleCopy(counts.withoutNewlines)}
                    >
                      コピー
                    </button>
                  </div>
                  <div className="info-item">
                    <span>文字数 (改行、空白除く)</span>
                    <span>{counts.withoutSpacesAndNewlines}</span>
                    <button
                      className="copy-button"
                      onClick={() =>
                        handleCopy(counts.withoutSpacesAndNewlines)
                      }
                    >
                      コピー
                    </button>
                  </div>
                  <div className="info-item">
                    <span>行数</span>
                    <span>{counts.lines}</span>
                    <button
                      className="copy-button"
                      onClick={() => handleCopy(counts.lines)}
                    >
                      コピー
                    </button>
                  </div>
                  <hr className="info-divider" />
                  <div
                    className="details-toggle"
                    onClick={() => setIsDetailsVisible(!isDetailsVisible)}
                  >
                    <span>
                      詳細なカウント {isDetailsVisible ? "▲ 閉じる" : "▼ 開く"}
                    </span>
                  </div>
                  {isDetailsVisible && (
                    <div className="collapsible-content">
                      <div className="info-item">
                        <span>バイト数 (UTF-8)</span>
                        <span>{counts.bytesUtf8}</span>
                        <button
                          className="copy-button"
                          onClick={() => handleCopy(counts.bytesUtf8)}
                        >
                          コピー
                        </button>
                      </div>
                      <div className="info-item">
                        <span>バイト数 (UTF-16)</span>
                        <span>{counts.bytesUtf16}</span>
                        <button
                          className="copy-button"
                          onClick={() => handleCopy(counts.bytesUtf16)}
                        >
                          コピー
                        </button>
                      </div>
                      <div className="info-item">
                        <span>バイト数 (Shift-JIS)</span>
                        <span>{counts.bytesShiftJis}</span>
                        <button
                          className="copy-button"
                          onClick={() => handleCopy(counts.bytesShiftJis)}
                        >
                          コピー
                        </button>
                      </div>
                      <div className="info-item">
                        <span>バイト数 (EUC-JP)</span>
                        <span>{counts.bytesEucJp}</span>
                        <button
                          className="copy-button"
                          onClick={() => handleCopy(counts.bytesEucJp)}
                        >
                          コピー
                        </button>
                      </div>
                      <div className="info-item">
                        <span>バイト数 (JIS)</span>
                        <span>{counts.bytesJis}</span>
                        <button
                          className="copy-button"
                          onClick={() => handleCopy(counts.bytesJis)}
                        >
                          コピー
                        </button>
                      </div>
                      <hr className="info-divider" />
                      <div className="info-item">
                        <span>原稿用紙 (400字)</span>
                        <span>{counts.manuscriptPages} 枚</span>
                        <button
                          className="copy-button"
                          onClick={() => handleCopy(counts.manuscriptPages)}
                        >
                          コピー
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
        <Route
          path="/manual"
          element={
            <Manual onClose={() => window.close()} isStandalone={true} />
          }
        />
      </Routes>
    </HashRouter>
  );
};
