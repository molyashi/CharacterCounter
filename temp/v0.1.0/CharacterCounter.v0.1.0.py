import sys
from PyQt5.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
    QLabel, QTextEdit, QCheckBox, QPushButton, QFontDialog,
    QMenuBar, QMenu, QAction, QFileDialog, QStyle, QFrame, QSizePolicy
)
from PyQt5.QtGui import QFont, QGuiApplication, QIcon
from PyQt5.QtCore import Qt, QTimer, QEvent

LIGHT_QSS = """
    QWidget {
        background-color: #F0F0F0;
        color: #2B2B2B;
        font-family: "Segoe UI", "Meiryo", "Avenir", sans-serif;
        font-size: 10pt;
    }
    QMainWindow {
        border: 1px solid #D0D0D0;
    }
    QMenuBar {
        background-color: #E8E8E8;
        border-bottom: 1px solid #D0D0D0;
    }
    QMenuBar::item {
        spacing: 5px;
        padding: 5px 10px;
        background: transparent;
    }
    QMenuBar::item:selected {
        color: white;
        background-color: #4A90E2;
    }
    QMenu {
        background-color: #FFFFFF;
        border: 1px solid #D0D0D0;
    }
    QMenu::item {
        padding: 5px 20px;
    }
    QMenu::item:selected {
        color: white;
        background-color: #4A90E2;
    }
    QTextEdit {
        background-color: #FFFFFF;
        border: 1px solid #D0D0D0;
        border-radius: 4px;
        padding: 8px;
        font-size: 12pt;
    }
    QLabel#CounterLabel {
        font-size: 14pt;
        font-weight: bold;
        color: #555555;
        padding: 5px;
    }
    QPushButton {
        background-color: #4A90E2;
        color: white;
        border: none;
        border-radius: 4px;
        padding: 8px 16px;
        font-weight: bold;
    }
    QPushButton:hover {
        background-color: #5FA5F5;
    }
    QPushButton:pressed {
        background-color: #3A80D2;
    }
    QCheckBox {
        spacing: 10px;
    }
    QCheckBox::indicator {
        width: 18px;
        height: 18px;
        border-radius: 9px;
        border: 2px solid #B0B0B0;
    }
    QCheckBox::indicator:unchecked {
        background-color: #FFFFFF;
    }
    QCheckBox::indicator:checked {
        background-color: #4A90E2;
        border-color: #4A90E2;
    }
    QFrame#InfoFrame {
        border: 1px solid #D0D0D0;
        border-radius: 4px;
        padding: 5px;
    }
"""

class CharacterCounter(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("文字数カウンター")
        self.setGeometry(100, 100, 700, 500)

        self.create_menu()

        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        main_layout = QVBoxLayout(central_widget)
        main_layout.setContentsMargins(15, 15, 15, 15)
        main_layout.setSpacing(15)

        self.text_box = QTextEdit()
        self.text_box.textChanged.connect(self.calculate_length)
        self.text_box.installEventFilter(self)
        main_layout.addWidget(self.text_box, 1)

        info_frame = QFrame()
        info_frame.setObjectName("InfoFrame")
        info_layout = QVBoxLayout(info_frame)

        self.length_with_spaces = QLabel("文字数（空白を含む）: 0")
        self.length_with_spaces.setObjectName("CounterLabel")
        self.length_without_spaces = QLabel("文字数（空白を含まない）: 0")
        self.length_without_spaces.setObjectName("CounterLabel")
        self.line_count_label = QLabel("改行数: 0")
        self.line_count_label.setObjectName("CounterLabel")

        info_layout.addWidget(self.length_with_spaces)
        info_layout.addWidget(self.length_without_spaces)
        info_layout.addWidget(self.line_count_label)
        main_layout.addWidget(info_frame)

        bottom_layout = QHBoxLayout()
        self.auto_clipboard_checkbox = QCheckBox("クリップボードの自動取得")
        self.auto_clipboard_checkbox.setChecked(True)
        self.auto_clipboard_checkbox.stateChanged.connect(self.toggle_auto_clipboard)

        self.font_button = QPushButton("フォント設定")
        self.font_button.clicked.connect(self.set_font)

        bottom_layout.addWidget(self.auto_clipboard_checkbox)
        bottom_layout.addStretch()
        bottom_layout.addWidget(self.font_button)
        main_layout.addLayout(bottom_layout)

        self.timer = QTimer(self)
        self.timer.timeout.connect(self.check_clipboard)
        self.toggle_auto_clipboard(Qt.Checked)
        self.calculate_length()

    def create_menu(self):
        menubar = self.menuBar()

        file_menu = menubar.addMenu("ファイル")
        open_action = QAction(self.style().standardIcon(QStyle.SP_FileIcon), ".txtを読み込む", self)
        open_action.triggered.connect(self.open_text_file)
        file_menu.addAction(open_action)

        file_menu.addSeparator()

        exit_action = QAction(self.style().standardIcon(QStyle.SP_DialogCloseButton), "終了", self)
        exit_action.triggered.connect(QApplication.quit)
        file_menu.addAction(exit_action)

        spacer = QWidget()
        spacer.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Preferred)
        menubar.setCornerWidget(spacer, Qt.TopLeftCorner)

        self.pin_checkbox = QCheckBox("最前面に固定", self)
        self.pin_checkbox.stateChanged.connect(self.toggle_pin)
        menubar.setCornerWidget(self.pin_checkbox, Qt.TopRightCorner)

    def calculate_length(self):
        text = self.text_box.toPlainText()
        self.length_with_spaces.setText(f"文字数（空白を含む）: {len(text)}")
        self.length_without_spaces.setText(f"文字数（空白を含まない）: {len(''.join(text.split()))}")
        line_count = text.count('\n') + 1 if text else 0
        self.line_count_label.setText(f"改行数: {line_count}")

    def toggle_auto_clipboard(self, state):
        self.auto_clipboard = (state == Qt.Checked)
        if self.auto_clipboard:
            self.check_clipboard()
            self.timer.start(500)
        else:
            self.timer.stop()

    def check_clipboard(self):
        if not self.auto_clipboard or self.text_box.hasFocus():
            return

        clipboard = QGuiApplication.clipboard()
        if clipboard.mimeData().hasText():
            text = clipboard.text()
            if text != self.text_box.toPlainText():
                self.text_box.setPlainText(text)

    def set_font(self):
        font, ok = QFontDialog.getFont(self.text_box.font(), self, "フォントを選択")
        if ok:
            self.text_box.setFont(font)

    def open_text_file(self):
        filename, _ = QFileDialog.getOpenFileName(self, ".txtファイルを開く", "", "テキストファイル (*.txt)")
        if filename:
            try:
                with open(filename, "r", encoding="utf-8") as f:
                    self.text_box.setPlainText(f.read())
            except Exception as e:
                print(f"ファイル読み込みエラー: {e}")

    def toggle_pin(self, state):
        flags = self.windowFlags()
        if state == Qt.Checked:
            self.setWindowFlags(flags | Qt.WindowStaysOnTopHint)
        else:
            self.setWindowFlags(flags & ~Qt.WindowStaysOnTopHint)
        self.show()

    def eventFilter(self, source, event):
        if source is self.text_box and event.type() == QEvent.FocusIn:
            if self.auto_clipboard_checkbox.isChecked():
                self.auto_clipboard_checkbox.setChecked(False)
        return super().eventFilter(source, event)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setStyleSheet(LIGHT_QSS)
    window = CharacterCounter()
    window.show()
    sys.exit(app.exec_())