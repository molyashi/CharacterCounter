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

import React, { useEffect } from "react";
import "./Manual.css";

export const Manual: React.FC = () => {
  useEffect(() => {
    document.body.classList.add("manual-body-style");
    return () => {
      document.body.classList.remove("manual-body-style");
    };
  }, []);

  return (
    <div className="manual-container">
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
