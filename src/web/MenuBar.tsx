import React, { useState, useEffect, useRef } from "react";
import "./MenuBar.css";

interface MenuBarProps {
  onOpenFile: () => void;
  onSaveFile: () => void;
  onExit: () => void;
  onOpenManual: () => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({
  onOpenFile,
  onSaveFile,
  onExit,
  onOpenManual,
}) => {
  const [isFileMenuOpen, setFileMenuOpen] = useState(false);
  const [isHelpMenuOpen, setHelpMenuOpen] = useState(false);
  const fileMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  const handleFileMenuToggle = () => {
    setFileMenuOpen(!isFileMenuOpen);
  };

  const handleOpenFileClick = () => {
    onOpenFile();
    setFileMenuOpen(false);
  };

  const handleSaveFileClick = () => {
    onSaveFile();
    setFileMenuOpen(false);
  };

  const handleExitClick = () => {
    onExit();
    setFileMenuOpen(false);
  };

  const handleHelpMenuToggle = () => {
    setHelpMenuOpen(!isHelpMenuOpen);
  };

  const handleShowManual = () => {
    window.electronAPI?.openManualWindow?.();
    setHelpMenuOpen(false);
  };

  const handleShowAbout = () => {
    window.electronAPI?.showAboutDialog?.();
    setHelpMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        fileMenuRef.current &&
        !fileMenuRef.current.contains(event.target as Node)
      ) {
        setFileMenuOpen(false);
      }
      if (
        helpMenuRef.current &&
        !helpMenuRef.current.contains(event.target as Node)
      ) {
        setHelpMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <nav className="menu-bar">
      <div className="menu-item-container" ref={fileMenuRef}>
        <div className="menu-item" onClick={handleFileMenuToggle}>
          ファイル(F)
        </div>
        {isFileMenuOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleOpenFileClick}>
              .txtを読み込む
            </div>
            <div className="dropdown-item" onMouseDown={handleSaveFileClick}>
              .txtとして保存
            </div>
            <div className="dropdown-item" onClick={handleExitClick}>
              終了
            </div>
          </div>
        )}
      </div>
      <div className="menu-item-container" ref={helpMenuRef}>
        <div className="menu-item" onClick={handleHelpMenuToggle}>
          ヘルプ(E)
        </div>
        {isHelpMenuOpen && (
          <div className="dropdown-menu">
            <div className="dropdown-item" onClick={handleShowManual}>
              使用方法
            </div>
            <div className="dropdown-item" onClick={handleShowAbout}>
              バージョン情報
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
