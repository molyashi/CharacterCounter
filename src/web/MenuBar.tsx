import React, { useState, useEffect, useRef, useCallback } from "react";
import "./MenuBar.css";

interface MenuBarProps {
  onOpenFile: () => void;
  onSaveFile: () => void;
  onExit: () => void;
  onOpenManual: () => void;
}

const MENU_ORDER = ["file", "help"];

export const MenuBar: React.FC<MenuBarProps> = ({
  onOpenFile,
  onSaveFile,
  onExit,
  onOpenManual,
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
    help: [
      () => window.electronAPI?.openManualWindow?.(),
      () => window.electronAPI?.showAboutDialog?.(),
    ],
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
  ]);

  return (
    <nav className="menu-bar" ref={menuBarRef}>
      {MENU_ORDER.map((menuName) => {
        const menuItems = {
          file: [".txtを読み込む", ".txtとして保存", "終了"],
          help: ["使用方法", "バージョン情報"],
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
              {menuName === "file" ? "ファイル" : "ヘルプ"}(
              <span className={isAltPressed ? "mnemonic-visible" : ""}>
                {menuName === "file" ? "F" : "H"}
              </span>
              )
            </div>
            {openMenu === menuName && (
              <div className="dropdown-menu">
                {menuItems[menuName as keyof typeof menuItems].map(
                  (item, index) => (
                    <div
                      key={item}
                      ref={(el) => {
                        dropdownItemRefs.current[menuName][index] = el;
                      }}
                      className={`dropdown-item ${
                        selectedDropdownIndex === index ? "selected" : ""
                      }`}
                      onMouseDown={() => {
                        const action = menuActions[menuName]?.[index];
                        if (action) {
                          action();
                          resetMenuState();
                        }
                      }}
                    >
                      {item}
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
