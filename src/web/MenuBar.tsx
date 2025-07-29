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

import React, { useState, useEffect, useRef, useCallback } from "react";
import "./MenuBar.css";
import { MoonIcon, SunIcon, SystemThemeIcon } from "./Icon";

interface MenuBarProps {
  platform: string;
  onOpenFile: () => void;
  onSaveFile: () => void;
  onExit: () => void;
  onOpenManual: () => void;
  onCheckForUpdates: () => void;
  onCopyText: () => void;
  onClearText: () => void;
  onToggleAutoClipboard: () => void;
  onToggleAlwaysOnTop: () => void;
  onToggleCompactMode: () => void;
  isAutoClipboard: boolean;
  isAlwaysOnTop: boolean;
  isCompactMode: boolean;
  theme: "light" | "dark" | "auto";
  onToggleTheme: () => void;
}

interface MenuItem {
  label: string;
  shortcut?: string;
  checked?: boolean;
  icon?: React.ReactNode;
}

const MENU_ORDER = ["file", "tool", "help"];

export const MenuBar: React.FC<MenuBarProps> = ({
  platform,
  onOpenFile,
  onSaveFile,
  onExit,
  onOpenManual,
  onCheckForUpdates,
  onCopyText,
  onClearText,
  onToggleAutoClipboard,
  onToggleAlwaysOnTop,
  onToggleCompactMode,
  isAutoClipboard,
  isAlwaysOnTop,
  isCompactMode,
  theme,
  onToggleTheme,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [focusedBarItem, setFocusedBarItem] = useState<string | null>(null);
  const [selectedDropdownIndex, setSelectedDropdownIndex] = useState<
    number | null
  >(null);
  const [isAltPressed, setIsAltPressed] = useState(false);
  const altActionTaken = useRef(false);

  const menuBarRef = useRef<HTMLDivElement>(null);
  const barItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dropdownItemRefs = useRef<Record<string, (HTMLDivElement | null)[]>>({
    file: [],
    tool: [],
    help: [],
  });

  const resetMenuState = useCallback(() => {
    setOpenMenu(null);
    setSelectedDropdownIndex(null);
    setFocusedBarItem(null);
    setIsAltPressed(false);
    altActionTaken.current = false;
  }, []);

  const menuActions: Record<string, (() => void)[]> = {
    file: [onOpenFile, onSaveFile, onExit],
    tool: [
      onCopyText,
      onClearText,
      onToggleAutoClipboard,
      onToggleAlwaysOnTop,
      onToggleCompactMode,
      onToggleTheme,
    ],
    help: [
      onOpenManual,
      onCheckForUpdates,
      () => window.electronAPI?.showAboutDialog?.(),
    ],
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (platform === "darwin") return;

      if (e.key === "Alt") {
        e.preventDefault();
        if (!isAltPressed) {
          setIsAltPressed(true);
          altActionTaken.current = false;
        }
        return;
      }

      if (isAltPressed) {
        let menuToOpen: string | null = null;
        if (e.key.toLowerCase() === "f") menuToOpen = "file";
        if (e.key.toLowerCase() === "t") menuToOpen = "tool";
        if (e.key.toLowerCase() === "h") menuToOpen = "help";

        if (menuToOpen) {
          e.preventDefault();
          altActionTaken.current = true;
          setOpenMenu(menuToOpen);
          setFocusedBarItem(menuToOpen);
          setSelectedDropdownIndex(0);
          setIsAltPressed(false);
        }
        return;
      }

      if (focusedBarItem === null) return;
      e.preventDefault();

      if (openMenu) {
        const items = dropdownItemRefs.current[openMenu] || [];
        const itemCount = items.length;

        switch (e.key) {
          case "ArrowDown":
            setSelectedDropdownIndex((prev) =>
              prev === null ? 0 : (prev + 1) % itemCount
            );
            break;
          case "ArrowUp":
            setSelectedDropdownIndex((prev) =>
              prev === null ? itemCount - 1 : (prev - 1 + itemCount) % itemCount
            );
            break;
          case "Enter":
            if (selectedDropdownIndex !== null) {
              const action = menuActions[openMenu]?.[selectedDropdownIndex];
              if (action) {
                action();
                resetMenuState();
              }
            }
            break;
          case "Escape":
            setOpenMenu(null);
            setSelectedDropdownIndex(null);
            barItemRefs.current[openMenu]?.focus();
            break;
          case "ArrowLeft":
          case "ArrowRight": {
            const currentIdx = MENU_ORDER.indexOf(openMenu);
            const nextIdx =
              (currentIdx +
                (e.key === "ArrowRight" ? 1 : -1) +
                MENU_ORDER.length) %
              MENU_ORDER.length;
            const nextMenu = MENU_ORDER[nextIdx];
            setOpenMenu(nextMenu);
            setFocusedBarItem(nextMenu);
            setSelectedDropdownIndex(0);
            break;
          }
        }
      } else {
        switch (e.key) {
          case "ArrowLeft":
          case "ArrowRight": {
            const currentIdx = MENU_ORDER.indexOf(focusedBarItem);
            const nextIdx =
              (currentIdx +
                (e.key === "ArrowRight" ? 1 : -1) +
                MENU_ORDER.length) %
              MENU_ORDER.length;
            const nextMenu = MENU_ORDER[nextIdx];
            setFocusedBarItem(nextMenu);
            barItemRefs.current[nextMenu]?.focus();
            break;
          }
          case "Enter":
          case "ArrowDown":
            setOpenMenu(focusedBarItem);
            setSelectedDropdownIndex(0);
            break;
          case "Escape":
            barItemRefs.current[focusedBarItem]?.blur();
            resetMenuState();
            break;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (platform === "darwin") return;
      if (e.key === "Alt") {
        if (isAltPressed && !altActionTaken.current) {
          setFocusedBarItem(MENU_ORDER[0]);
          barItemRefs.current[MENU_ORDER[0]]?.focus();
        }
        setIsAltPressed(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuBarRef.current &&
        !menuBarRef.current.contains(event.target as Node)
      ) {
        resetMenuState();
      }
    };

    const handleWindowBlur = () => {
      resetMenuState();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [
    openMenu,
    focusedBarItem,
    selectedDropdownIndex,
    isAltPressed,
    resetMenuState,
    platform,
    menuActions,
  ]);

  const getMenuDisplayName = (name: string) => {
    if (name === "file") return "ファイル";
    if (name === "tool") return "ツール";
    if (name === "help") return "ヘルプ";
    return "";
  };

  const getMnemonic = (name: string) => {
    if (name === "file") return "F";
    if (name === "tool") return "T";
    if (name === "help") return "H";
    return "";
  };

  return (
    <nav
      className={`menu-bar ${platform === "darwin" ? "platform-macos" : ""}`}
      ref={menuBarRef}
    >
      {platform === "darwin" && <div className="traffic-light-spacer" />}

      {platform !== "darwin" &&
        MENU_ORDER.map((menuName) => {
          const getThemeIcon = () => {
            switch (theme) {
              case "light":
                return <SunIcon size={18} />;
              case "dark":
                return <MoonIcon size={18} />;
              case "auto":
                return <SystemThemeIcon size={18} />;
              default:
                return null;
            }
          };
          const getThemeLabel = () => {
            switch (theme) {
              case "light":
                return "テーマ: ライト";
              case "dark":
                return "テーマ: ダーク";
              case "auto":
                return "テーマ: システム";
              default:
                return "テーマ切り替え";
            }
          };

          const menuItems: Record<string, MenuItem[]> = {
            file: [
              { label: ".txtを読み込む", shortcut: "Ctrl+O" },
              { label: ".txtとして保存", shortcut: "Ctrl+S" },
              { label: "終了" },
            ],
            tool: [
              { label: "テキスト全体をコピー", shortcut: "Ctrl+Shift+C" },
              { label: "テキスト全体をクリア", shortcut: "Ctrl+Shift+D" },
              {
                label: "クリップボード自動取得",
                shortcut: "Ctrl+Shift+B",
                checked: isAutoClipboard,
              },
              {
                label: "常に手前に表示",
                shortcut: "Ctrl+Shift+T",
                checked: isAlwaysOnTop,
              },
              {
                label: "コンパクトモード",
                shortcut: "Ctrl+Shift+M",
                checked: isCompactMode,
              },
              {
                label: getThemeLabel(),
                icon: getThemeIcon(),
              },
            ],
            help: [
              { label: "使用方法" },
              { label: "更新を確認..." },
              { label: "バージョン情報" },
            ],
          };

          return (
            <div
              key={menuName}
              className="menu-item-container"
              onMouseEnter={() => openMenu && setOpenMenu(menuName)}
              onClick={() => {
                if (openMenu === menuName) {
                  resetMenuState();
                } else {
                  setOpenMenu(menuName);
                  setFocusedBarItem(menuName);
                  setSelectedDropdownIndex(null);
                  setIsAltPressed(false);
                }
              }}
            >
              <div
                ref={(el) => {
                  barItemRefs.current[menuName] = el;
                }}
                className={`menu-item ${
                  focusedBarItem === menuName && !openMenu ? "focused" : ""
                }`}
                tabIndex={-1}
              >
                {getMenuDisplayName(menuName)}(
                <span className={isAltPressed ? "mnemonic-visible" : ""}>
                  {getMnemonic(menuName)}
                </span>
                )
              </div>
              {openMenu === menuName && (
                <div className="dropdown-menu">
                  {(menuItems[menuName as keyof typeof menuItems] || []).map(
                    (item, index) => (
                      <div
                        key={item.label}
                        ref={(el) => {
                          if (dropdownItemRefs.current[menuName]) {
                            dropdownItemRefs.current[menuName][index] = el;
                          }
                        }}
                        className={`dropdown-item ${
                          selectedDropdownIndex === index ? "selected" : ""
                        } ${item.checked ? "checked" : ""} ${
                          item.checked !== undefined ? "is-toggle" : ""
                        } ${item.icon ? "has-svg-icon" : ""}`}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const action = menuActions[menuName]?.[index];
                          if (action) {
                            action();
                          }
                          resetMenuState();
                        }}
                      >
                        <span className="dropdown-item-label">
                          <span className="dropdown-check-mark">
                            {item.icon ? item.icon : null}
                          </span>
                          {item.label}
                        </span>
                        {item.shortcut && (
                          <span className="dropdown-item-shortcut">
                            {item.shortcut}
                          </span>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          );
        })}
    </nav>
  );
};
