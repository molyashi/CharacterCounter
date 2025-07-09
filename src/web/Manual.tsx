import React, { useEffect } from "react";
import "./Manual.css";

interface ManualProps {
  onClose: () => void;
  isStandalone?: boolean;
}

export const Manual: React.FC<ManualProps> = ({ onClose }) => {
  useEffect(() => {
    document.body.classList.add("manual-body-style");

    return () => {
      document.body.classList.remove("manual-body-style");
    };
  }, []);

  return (
    <div className="manual-container">
      <div className="manual-title-bar">使用方法</div>
      <button className="manual-close-btn" onClick={onClose}>
        ✕
      </button>
      <div className="manual-content">
        <h2>使用方法</h2>
        <ul>
          <li>
            テキストをコピーしてペーストするか、直接テキストを打つことができます。
          </li>
          <li>
            テキストファイルの読み込み・保存はファイルメニューから行えます。
          </li>
          <li>
            クリップボードの内容を自動で取得したり、ウィンドウを最前面に固定することもできます。
          </li>
          <li>バグがあれば報告していただけると幸いです。</li>
        </ul>
      </div>
    </div>
  );
};
