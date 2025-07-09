import sys
from PyQt5.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QLabel, QTextEdit, QCheckBox, QPushButton, QFontDialog, QMenuBar, QMenu, QAction, QFileDialog
from PyQt5.QtGui import QFont, QGuiApplication
from PyQt5.QtCore import Qt, QTimer, QEvent

class CharacterCounter(QMainWindow):
    def __init__(self):
        super().__init__()
        try:
            self.setWindowTitle("文字数カウンター")
            self.setGeometry(100, 100, 600, 400)
            self.timer = QTimer(self)
            self.timer.timeout.connect(self.check_clipboard)

            menubar = self.menuBar()
            menubar.setNativeMenuBar(False)
            file_menu = QMenu("ファイル", self)
            menubar.addMenu(file_menu)
            open_action = QAction(".txtを読み込む", self)
            open_action.triggered.connect(self.open_text_file)
            file_menu.addAction(open_action)
            exit_action = QAction("終了", self)
            exit_action.triggered.connect(QApplication.quit)
            file_menu.addAction(exit_action)
            menubar.setStyleSheet("background-color: lightgray;")

            self.pin_checkbox = QCheckBox("最前面に固定", self)
            self.pin_checkbox.stateChanged.connect(self.toggle_pin)
            menubar.setCornerWidget(self.pin_checkbox, Qt.TopRightCorner)

            central_widget = QWidget()
            layout = QVBoxLayout()
            central_widget.setLayout(layout)
            self.setCentralWidget(central_widget)

            self.text_box = QTextEdit()
            self.text_box.textChanged.connect(self.calculate_length)
            self.text_box.installEventFilter(self)
            layout.addWidget(self.text_box)

            self.length_with_spaces = QLabel("文字数（空白を含む）: 0")
            self.length_with_spaces.setStyleSheet("font-weight: bold; font-size: 16pt;")
            layout.addWidget(self.length_with_spaces)

            self.length_without_spaces = QLabel("文字数（空白を含まない）: 0")
            self.length_without_spaces.setStyleSheet("font-weight: bold; font-size: 16pt;")
            layout.addWidget(self.length_without_spaces)

            self.line_count_label = QLabel("改行数: 0")
            self.line_count_label.setStyleSheet("font-weight: bold; font-size: 16pt;")
            layout.addWidget(self.line_count_label)

            bottom_layout = QHBoxLayout()
            layout.addLayout(bottom_layout)

            self.auto_clipboard_checkbox = QCheckBox("クリップボードの自動取得")
            self.auto_clipboard_checkbox.setChecked(True)
            self.auto_clipboard_checkbox.stateChanged.connect(self.toggle_auto_clipboard)
            bottom_layout.addWidget(self.auto_clipboard_checkbox)

            self.font_button = QPushButton("フォント設定")
            self.font_button.clicked.connect(self.set_font)
            bottom_layout.addWidget(self.font_button)

            self.toggle_auto_clipboard(Qt.Checked)

        except Exception as e:
            print(f"An error occurred during initialization: {e}")
            sys.exit(1)

    def calculate_length(self):
        text = self.text_box.toPlainText()
        if not text:
            self.length_with_spaces.setText("文字数（空白を含む）: 0")
            self.length_without_spaces.setText("文字数（空白を含まない）: 0")
            self.line_count_label.setText("改行数: 0")
            return

        self.length_with_spaces.setText(f"文字数（空白を含む）: {len(text)}")
        text_without_spaces = "".join(text.split())
        self.length_without_spaces.setText(f"文字数（空白を含まない）: {len(text_without_spaces)}")
        line_count = text.count("\n") + 1
        self.line_count_label.setText(f"改行数: {line_count}")

    def toggle_auto_clipboard(self, state):
        self.auto_clipboard = (state == Qt.Checked)
        if self.auto_clipboard:
            self.check_clipboard()
            self.timer.start(500)
        else:
            self.timer.stop()

    def check_clipboard(self):
        if self.auto_clipboard:
            clipboard = QGuiApplication.clipboard()
            mimeData = clipboard.mimeData()
            if mimeData.hasText():
                text = mimeData.text()
                if text != self.text_box.toPlainText():
                    self.text_box.setPlainText(text)

    def set_font(self):
        font, ok = QFontDialog.getFont(self.text_box.font(), self)
        if ok:
            self.text_box.setFont(font)

    def open_text_file(self):
        filename, _ = QFileDialog.getOpenFileName(self, ".txtファイルを開く", "", "テキストファイル (*.txt)")
        if filename:
            try:
                with open(filename, "r", encoding="utf-8") as file:
                    text = file.read()
                    self.text_box.setPlainText(text)
            except Exception as e:
                print(f"An error occurred while opening the file: {e}")

    def toggle_pin(self, state):
        if state == Qt.Checked:
            self.setWindowFlags(self.windowFlags() | Qt.WindowStaysOnTopHint)
        else:
            self.setWindowFlags(self.windowFlags() & ~Qt.WindowStaysOnTopHint)
        self.show()

    def eventFilter(self, source, event):
        if source is self.text_box and event.type() == QEvent.FocusIn:
            if self.auto_clipboard_checkbox.isChecked():
                self.auto_clipboard_checkbox.setChecked(False)

        return super().eventFilter(source, event)

if __name__ == "__main__":
    try:
        app = QApplication(sys.argv)
        window = CharacterCounter()
        window.show()
        sys.exit(app.exec_())
    except Exception as e:
        print(f"An error occurred: {e}")