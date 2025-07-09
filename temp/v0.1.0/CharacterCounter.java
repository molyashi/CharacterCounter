import javax.swing.*;
import java.awt.*;
import java.awt.datatransfer.Clipboard;
import java.awt.datatransfer.DataFlavor;
import java.awt.datatransfer.UnsupportedFlavorException;
import java.awt.event.*;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Timer;
import java.util.TimerTask;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.util.logging.Logger;
import java.util.logging.Level;

public class CharacterCounter extends JFrame {
    private JTextArea textArea;
    private JLabel lengthWithSpacesLabel;
    private JLabel lengthWithoutSpacesLabel;
    private JLabel lineCountLabel;
    private JCheckBox autoClipboardCheckbox;
    private Timer timer;

    public CharacterCounter() {
        super("文字数カウンター");
        try {
            UIManager.setLookAndFeel("com.sun.java.swing.plaf.windows.WindowsLookAndFeel");
        } catch (Exception e) {
            e.printStackTrace();
        }

        // メニューバー
        JMenuBar menuBar = new JMenuBar();
        JMenu fileMenu = new JMenu("ファイル");
        JMenuItem openMenuItem = new JMenuItem(".txtを読み込む");
        openMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                openTextFile();
            }
        });
        fileMenu.add(openMenuItem);
        JMenuItem exitMenuItem = new JMenuItem("終了");
        exitMenuItem.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                System.exit(0);
            }
        });
        fileMenu.add(exitMenuItem);
        menuBar.add(fileMenu);
        setJMenuBar(menuBar);

        // 最前面に固定
        JCheckBox pinCheckbox = new JCheckBox("最前面に固定");
        pinCheckbox.addItemListener(new ItemListener() {
            @Override
            public void itemStateChanged(ItemEvent e) {
                togglePin(e.getStateChange() == ItemEvent.SELECTED);
            }
        });
        menuBar.add(Box.createHorizontalGlue()); // 右端に配置
        menuBar.add(pinCheckbox);

        // 中央パネル
        JPanel centralPanel = new JPanel(new BorderLayout());
        textArea = new JTextArea();
        textArea.setFont(new Font("Monospaced", Font.PLAIN, 16));
        textArea.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) {
                calculateLength();
            }
            @Override
            public void removeUpdate(DocumentEvent e) {
                calculateLength();
            }
            @Override
            public void changedUpdate(DocumentEvent e) {
                calculateLength();
            }
        });
        textArea.addFocusListener(new FocusAdapter() {
            @Override
            public void focusGained(FocusEvent e) {
                if (autoClipboardCheckbox.isSelected()) {
                    autoClipboardCheckbox.setSelected(false);
                    stopClipboardTimer();
                }
            }
        });
        centralPanel.add(new JScrollPane(textArea), BorderLayout.CENTER);

        // 文字数表示
        JPanel infoPanel = new JPanel(new GridLayout(3, 1));
        lengthWithSpacesLabel = new JLabel("文字数（空白を含む）: 0");
        lengthWithoutSpacesLabel = new JLabel("文字数（空白を含まない）: 0");
        lineCountLabel = new JLabel("改行数: 0");

        // 共通で使えるフォントとサイズを指定
        Font labelFont = new Font("Dialog", Font.BOLD, 24);
        lengthWithSpacesLabel.setFont(labelFont);
        lengthWithoutSpacesLabel.setFont(labelFont);
        lineCountLabel.setFont(labelFont);

        infoPanel.add(lengthWithSpacesLabel);
        infoPanel.add(lengthWithoutSpacesLabel);
        infoPanel.add(lineCountLabel);
        centralPanel.add(infoPanel, BorderLayout.SOUTH);

        // 下部パネル
        JPanel bottomPanel = new JPanel(new FlowLayout());
        autoClipboardCheckbox = new JCheckBox("クリップボードの自動取得");
        autoClipboardCheckbox.setSelected(true);
        autoClipboardCheckbox.addItemListener(new ItemListener() {
            @Override
            public void itemStateChanged(ItemEvent e) {
                toggleAutoClipboard(e.getStateChange() == ItemEvent.SELECTED);
            }
        });
        bottomPanel.add(autoClipboardCheckbox);
        JButton fontButton = new JButton("フォント設定");
        fontButton.addActionListener(new ActionListener() {
            @Override
            public void actionPerformed(ActionEvent e) {
                setFont();
            }
        });
        bottomPanel.add(fontButton);
        centralPanel.add(bottomPanel, BorderLayout.NORTH);

        add(centralPanel);

        // 初期設定
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(600, 400);
        setLocationRelativeTo(null);
        setVisible(true);
        toggleAutoClipboard(true);// クリップボード自動取得開始
    }

    private void calculateLength() {
        String text = textArea.getText();
        lengthWithSpacesLabel.setText("文字数（空白を含む）: " + text.length());
        lengthWithoutSpacesLabel.setText("文字数（空白を含まない）: " + text.replaceAll("\\s+", "").length());
        lineCountLabel.setText("改行数: " + (text.split("\n").length));
    }

    private void toggleAutoClipboard(boolean enabled) {
        if (enabled) {
            startClipboardTimer();
        } else {
            stopClipboardTimer();
        }
    }

    private void startClipboardTimer() {
        timer = new Timer();
        timer.schedule(new TimerTask() {
            @Override
            public void run() {
                checkClipboard();
            }
        }, 0, 500);
    }

    private void stopClipboardTimer() {
        if (timer != null) {
            timer.cancel();
            timer = null;
        }
    }

    private void checkClipboard() {
        Clipboard clipboard = Toolkit.getDefaultToolkit().getSystemClipboard();
        try {
            if (clipboard.isDataFlavorAvailable(DataFlavor.stringFlavor)) {
                String text = (String) clipboard.getData(DataFlavor.stringFlavor);
                SwingUtilities.invokeLater(() -> {
                    textArea.setText(text);
                });
            } else {
                // Unicode String 形式でない場合は FINE レベルのログを出力
                Logger.getLogger(CharacterCounter.class.getName()).log(Level.FINE, "クリップボードのデータは Unicode String 形式ではありません。");
            }
        } catch (UnsupportedFlavorException | IOException e) {
            e.printStackTrace();
        }
    }

    private void setFont() {
        Font currentFont = textArea.getFont();
        Font newFont = JFontChooser.showDialog(this, "フォント設定", currentFont);
        if (newFont != null) {
            textArea.setFont(newFont);
        }
    }

    private void openTextFile() {
        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setFileSelectionMode(JFileChooser.FILES_ONLY);
        int result = fileChooser.showOpenDialog(this);
        if (result == JFileChooser.APPROVE_OPTION) {
            File selectedFile = fileChooser.getSelectedFile();
            try {
                String text = Files.readString(selectedFile.toPath());
                textArea.setText(text);
            } catch (IOException e) {
                e.printStackTrace();
            }
        }
    }

    private void togglePin(boolean pinned) {
        setAlwaysOnTop(pinned);
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(new Runnable() {
            @Override
            public void run() {
                new CharacterCounter();
            }
        });
    }
}

// JFontChooser クラスの定義
class JFontChooser extends JDialog {
    private static final long serialVersionUID = 1L;
    private Font selectedFont;

    public JFontChooser(Frame owner, String title, Font initialFont) {
        super(owner, title, true);
        setDefaultCloseOperation(JDialog.DISPOSE_ON_CLOSE);
        JPanel contentPane = new JPanel(new BorderLayout());
        JFontChooserPanel fontChooserPanel = new JFontChooserPanel(initialFont);
        contentPane.add(fontChooserPanel, BorderLayout.CENTER);
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton okButton = new JButton("OK");
        okButton.addActionListener(e -> {
            selectedFont = fontChooserPanel.getSelectedFont();
            dispose();
        });
        buttonPanel.add(okButton);
        JButton cancelButton = new JButton("キャンセル");
        cancelButton.addActionListener(e -> dispose());
        buttonPanel.add(cancelButton);
        contentPane.add(buttonPanel, BorderLayout.SOUTH);
        setContentPane(contentPane);
        pack();
        setLocationRelativeTo(owner);
    }
    public Font getSelectedFont() {
        return selectedFont;
    }
    public static Font showDialog(Frame owner, String title, Font initialFont) {
        JFontChooser fontChooser = new JFontChooser(owner, title, initialFont);
        fontChooser.setVisible(true);
        return fontChooser.getSelectedFont();
    }
}

// JFontChooserPanel クラスの定義
class JFontChooserPanel extends JPanel implements ItemListener {
    private static final long serialVersionUID = 1L;
    private Font selectedFont;
    private JComboBox<String> fontFamilyComboBox;
    private JComboBox<String> fontSizeComboBox;
    private JCheckBox boldCheckBox;
    private JCheckBox italicCheckBox;
    private JLabel previewLabel;
    public JFontChooserPanel(Font initialFont) {
        setLayout(new GridLayout(5, 2, 5, 5));

        // フォントファミリー
        add(new JLabel("フォントファミリー:"));
        fontFamilyComboBox = new JComboBox<>(GraphicsEnvironment.getLocalGraphicsEnvironment().getAvailableFontFamilyNames());
        fontFamilyComboBox.setSelectedItem(initialFont.getFamily());
        fontFamilyComboBox.addItemListener(this);
        add(fontFamilyComboBox);

        // フォントサイズ
        add(new JLabel("フォントサイズ:"));
        fontSizeComboBox = new JComboBox<>(new String[] { "8", "9", "10", "11", "12", "14", "16", "18", "20", "22", "24", "26", "28", "36", "48", "72" });
        fontSizeComboBox.setSelectedItem(String.valueOf(initialFont.getSize()));
        fontSizeComboBox.addItemListener(this);
        add(fontSizeComboBox);

        // 太字
        add(new JLabel("太字:"));
        boldCheckBox = new JCheckBox();
        boldCheckBox.setSelected(initialFont.isBold());
        boldCheckBox.addItemListener(this);
        add(boldCheckBox);

        // イタリック
        add(new JLabel("イタリック:"));
        italicCheckBox = new JCheckBox();
        italicCheckBox.setSelected(initialFont.isItalic());
        italicCheckBox.addItemListener(this);
        add(italicCheckBox);

        // プレビュー
        add(new JLabel("プレビュー:"));
        previewLabel = new JLabel("AaBbYyZz");
        previewLabel.setFont(initialFont);
        add(previewLabel);

        selectedFont = initialFont;
    }

    @Override
    public void itemStateChanged(ItemEvent e) {
        String fontFamily = (String) fontFamilyComboBox.getSelectedItem();
        int fontSize = Integer.parseInt((String) fontSizeComboBox.getSelectedItem());
        int fontStyle = (boldCheckBox.isSelected() ? Font.BOLD : 0) | (italicCheckBox.isSelected() ? Font.ITALIC : 0);
        selectedFont = new Font(fontFamily, fontStyle, fontSize);
        previewLabel.setFont(selectedFont);
    }

    public Font getSelectedFont() {
        return selectedFont;
    }
}