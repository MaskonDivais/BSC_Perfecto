import { PyQtFile } from '../types';

export const pythonFiles: PyQtFile[] = [
  {
    path: 'requirements.txt',
    description: 'Python package requirements for installation.',
    content: `PyQt6>=6.4.0
# Requires official Windows / macOS / Linux OS Python support
`
  },
  {
    path: 'main.py',
    description: 'The main entry point widget that starts the PyQt6 window and hosts the infinite node canvas.',
    content: `import sys
import os
from PyQt6.QtWidgets import QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, QPushButton, QLabel, QSplitter
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QIcon, QFont, QColor, QPalette

from canvas import NodeCanvas
from utils import ensure_project_dirs

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Branching Storyline Editor (Desktop PyQt6)")
        self.setMinimumSize(1200, 800)
        
        # Ensure workspace dirs exist
        ensure_project_dirs()
        
        # Configure overall style
        self.apply_theme()
        
        # Main widget & layout
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        layout = QVBoxLayout(main_widget)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        
        # Sleek Top Header
        header = QWidget()
        header.setFixedHeight(60)
        header.setObjectName("HeaderBar")
        header_layout = QHBoxLayout(header)
        header_layout.setContentsMargins(20, 0, 20, 0)
        
        title_label = QLabel("BRANCHING STORYLINE EDITOR")
        title_font = QFont("Helvetica Neue", 12, QFont.Weight.Bold)
        title_font.setLetterSpacing(QFont.SpacingType.AbsoluteSpacing, 1.5)
        title_label.setFont(title_font)
        title_label.setStyleSheet("color: #f8fafc;")
        
        subtitle_label = QLabel("•  DESKTOP TOOLKIT PORT")
        sub_font = QFont("JetBrains Mono", 9)
        subtitle_label.setFont(sub_font)
        subtitle_label.setStyleSheet("color: #64748b; margin-left: 10px;")
        
        header_layout.addWidget(title_label)
        header_layout.addWidget(subtitle_label)
        header_layout.addStretch()
        
        reset_btn = QPushButton("Reset Canvas Grid")
        reset_btn.clicked.connect(self.reset_canvas)
        reset_btn.setStyleSheet("""
            QPushButton {
                background-color: #1e293b;
                color: #e2e8f0;
                border: 1px solid #334155;
                padding: 6px 12px;
                font-family: 'JetBrains Mono';
                font-size: 11px;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #2b3a53;
                border-color: #475569;
            }
        """)
        header_layout.addWidget(reset_btn)
        
        # Divider Line
        divider = QWidget()
        divider.setFixedHeight(1)
        divider.setStyleSheet("background-color: #334155;")
        
        # Infinite canvas instance
        self.canvas = NodeCanvas()
        
        layout.addWidget(header)
        layout.addWidget(divider)
        layout.addWidget(self.canvas)
        
    def reset_canvas(self):
        self.canvas.reset_view()
        
    def apply_theme(self):
        # Apply dark slate technical theme
        app = QApplication.instance()
        palette = QPalette()
        palette.setColor(QPalette.ColorRole.Window, QColor("#090d16"))
        palette.setColor(QPalette.ColorRole.WindowText, QColor("#f1f5f9"))
        palette.setColor(QPalette.ColorRole.Base, QColor("#020617"))
        palette.setColor(QPalette.ColorRole.ToolTipBase, QColor("#0f172a"))
        palette.setColor(QPalette.ColorRole.ToolTipText, QColor("#cbd5e1"))
        app.setPalette(palette)
        
        self.setStyleSheet("""
            QMainWindow {
                background-color: #0d111d;
            }
            #HeaderBar {
                background-color: #0b0f19;
            }
        """)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # Optional font setting
    font = QFont("Arial", 10)
    app.setFont(font)
    
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
`
  },
  {
    path: 'canvas.py',
    description: 'Implements the infinite navigable canvas using QGraphicsView with click-drag connections, custom nodes, panning, and drag-and-spawn nodes from output ports.',
    content: `import sys
import os
from PyQt6.QtWidgets import QGraphicsView, QGraphicsScene, QMenu
from PyQt6.QtCore import Qt, QPointF, QLineF
from PyQt6.QtGui import QPainter, QPen, QColor, QBrush

from node_item import GraphicsNodeItem
from connection import ConnectionLineItem

class NodeCanvas(QGraphicsView):
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Setup Scene
        self.scene = QGraphicsScene(self)
        self.scene.setSceneRect(-5000, -5000, 10000, 10000)
        self.setScene(self.scene)
        
        # Configure Graphics View properties for smooth rendering
        self.setRenderHint(QPainter.RenderHint.Antialiasing)
        self.setRenderHint(QPainter.RenderHint.TextAntialiasing)
        self.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)
        self.setViewportUpdateMode(QGraphicsView.ViewportUpdateMode.FullViewportUpdate)
        
        # Navigation configs
        self.setTransformationAnchor(QGraphicsView.ViewportAnchor.AnchorUnderMouse)
        self.setResizeAnchor(QGraphicsView.ViewportAnchor.AnchorUnderMouse)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setVerticalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setDragMode(QGraphicsView.DragMode.NoDrag)
        
        # Interaction variables
        self.is_panning = False
        self.pan_start_pos = None
        self.drawing_line = None
        self.active_port = None
        self.active_source_node = None
        
        # Grid settings
        self.grid_size = 25
        self.setBackgroundBrush(QBrush(QColor("#070a13")))
        
        # Spawn first node in center
        self.create_node("Story Node 1", QPointF(0, 0))

    def reset_view(self):
        self.resetTransform()
        self.centerOn(0, 0)
        
    def drawBackground(self, painter, rect):
        # Draw elegant mesh/dot grid
        super().drawBackground(painter, rect)
        
        left = int(rect.left()) - (int(rect.left()) % self.grid_size)
        top = int(rect.top()) - (int(rect.top()) % self.grid_size)
        right = int(rect.right())
        bottom = int(rect.bottom())
        
        pen = QPen(QColor("#1e293b"), 1)
        painter.setPen(pen)
        
        # Draw tiny grid points
        for x in range(left, right, self.grid_size):
            for y in range(top, bottom, self.grid_size):
                painter.drawPoint(x, y)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.MiddleButton or (event.button() == Qt.MouseButton.LeftButton and event.modifiers() == Qt.KeyboardModifier.ShiftModifier):
            self.is_panning = True
            self.pan_start_pos = event.position().toPoint()
            self.setDragMode(QGraphicsView.DragMode.NoDrag)
            event.accept()
            return
            
        super().mousePressEvent(event)

    def mouseMoveEvent(self, event):
        if self.is_panning:
            delta = event.position().toPoint() - self.pan_start_pos
            self.pan_start_pos = event.position().toPoint()
            self.horizontalScrollBar().setValue(self.horizontalScrollBar().value() - delta.x())
            self.verticalScrollBar().setValue(self.verticalScrollBar().value() - delta.y())
            event.accept()
            return
            
        if self.drawing_line:
            # Update connection curve in real-time
            scene_pos = self.mapToScene(event.position().toPoint())
            self.drawing_line.set_line_points(self.drawing_line.from_point, scene_pos)
            event.accept()
            return
            
        super().mouseMoveEvent(event)

    def mouseReleaseEvent(self, event):
        if self.is_panning:
            self.is_panning = False
            event.accept()
            return
            
        if self.drawing_line:
            # User released mouse while connecting
            scene_pos = self.mapToScene(event.position().toPoint())
            selected_item = self.scene.itemAt(scene_pos, self.transform())
            
            # Check if released over an input port
            node_found = False
            for item in self.scene.items(scene_pos):
                if isinstance(item, GraphicsNodeItem) and item != self.active_source_node:
                    # Successfully connected to another node's input
                    self.drawing_line.set_target_node(item)
                    item.add_input_connection(self.drawing_line)
                    self.active_source_node.add_output_connection(self.drawing_line)
                    node_found = True
                    break
            
            if not node_found:
                # Dragged to empty space: Prompt option to spawn node (As requested!)
                self.show_spawn_menu(event.position().toPoint(), scene_pos)
            
            self.drawing_line = None
            self.active_source_node = None
            self.active_port = None
            event.accept()
            return
            
        super().mouseReleaseEvent(event)
        
    def show_spawn_menu(self, view_pos, scene_pos):
        menu = QMenu(self)
        menu.setStyleSheet("""
            QMenu {
                background-color: #111827;
                color: #e5e7eb;
                border: 1px solid #374151;
                font-family: 'JetBrains Mono';
                font-size: 11px;
                padding: 4px;
            }
            QMenu::item {
                padding: 4px 16px;
                border-radius: 3px;
            }
            QMenu::item:selected {
                background-color: #2563eb;
                color: #ffffff;
            }
        """)
        action = menu.addAction("+ Spawn Connected Cell")
        selected_action = menu.exec(self.mapToGlobal(view_pos))
        
        if selected_action == action:
            # Create node
            new_node_id = f"Story Node {len([i for i in self.scene.items() if isinstance(i, GraphicsNodeItem)]) + 1}"
            new_node = self.create_node(new_node_id, scene_pos)
            
            # Finalize connection Line
            self.drawing_line.set_target_node(new_node)
            new_node.add_input_connection(self.drawing_line)
            if self.active_source_node:
                self.active_source_node.add_output_connection(self.drawing_line)
        else:
            # Delete unfinished line
            if self.drawing_line in self.scene.items():
                self.scene.removeItem(self.drawing_line)

    def wheelEvent(self, event):
        # Zoom parameters
        zoom_factor = 1.2
        if event.angleDelta().y() > 0:
            self.scale(zoom_factor, zoom_factor)
        else:
            self.scale(1.0 / zoom_factor, 1.0 / zoom_factor)

    def create_node(self, title, scene_pos):
        node = GraphicsNodeItem(title)
        node.setPos(scene_pos)
        self.scene.addItem(node)
        return node
        
    def start_connection_drag(self, source_node, start_scene_pos):
        self.active_source_node = source_node
        self.drawing_line = ConnectionLineItem(start_scene_pos, start_scene_pos)
        self.scene.addItem(self.drawing_line)
`
  },
  {
    path: 'node_item.py',
    description: 'Implements the custom graphical node visual structure, embedding standard text input fields, a drop-down tagging system, media upload indicators, custom socket ports, file persistence, and the feature to open Windows File Explorer direct to the folder.',
    content: `import os
import shutil
import subprocess
import sys
from PyQt6.QtWidgets import (QGraphicsItem, QGraphicsProxyWidget, QWidget, QVBoxLayout, QHBoxLayout,
                             QTextEdit, QComboBox, QPushButton, QLabel, QFileDialog, QMessageBox)
from PyQt6.QtCore import Qt, QRectF, QPointF
from PyQt6.QtGui import QColor, QFont, QPen, QBrush

from utils import get_node_dir

class NodeUIWidget(QWidget):
    def __init__(self, node_id, graphics_item):
        super().__init__()
        self.node_id = node_id
        self.graphics_item = graphics_item
        self.attached_media_path = None
        
        self.setFixedSize(260, 240)
        self.init_ui()
        self.load_local_data()
        
    def init_ui(self):
        # Premium Technical Dark Aesthetics
        layout = QVBoxLayout(self)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(8)
        
        # Heading row
        head_layout = QHBoxLayout()
        self.title_label = QLabel(self.node_id)
        head_font = QFont("JetBrains Mono", 10, QFont.Weight.Bold)
        self.title_label.setFont(head_font)
        self.title_label.setStyleSheet("color: #60a5fa;")
        
        head_layout.addWidget(self.title_label)
        head_layout.addStretch()
        layout.addLayout(head_layout)
        
        # 1. Text Plot Script
        self.plot_edit = QTextEdit()
        self.plot_edit.setPlaceholderText("Write plot script here...")
        self.plot_edit.setStyleSheet("""
            QTextEdit {
                background-color: #0b0f19;
                color: #e2e8f0;
                border: 1px solid #1e293b;
                border-radius: 4px;
                padding: 6px;
                font-size: 11px;
            }
            QTextEdit:focus {
                border: 1px solid #3b82f6;
            }
        """)
        layout.addWidget(self.plot_edit)
        
        # 2. Tag selector (as requested: font, action, UI element)
        tag_layout = QHBoxLayout()
        tag_lbl = QLabel("Tag:")
        tag_lbl.setStyleSheet("color: #94a3b8; font-size: 10px; font-family: 'JetBrains Mono';")
        self.tag_combo = QComboBox()
        self.tag_combo.addItems(["action", "font", "UI element", "dialogue", "choice", "other"])
        self.tag_combo.setStyleSheet("""
            QComboBox {
                background-color: #1e293b;
                color: #f1f5f9;
                border: 1px solid #334155;
                font-size: 10px;
                font-family: 'JetBrains Mono';
                padding: 2px 6px;
                border-radius: 3px;
            }
        """)
        tag_layout.addWidget(tag_lbl)
        tag_layout.addWidget(self.tag_combo)
        layout.addLayout(tag_layout)
        
        # 3. Media info row
        media_layout = QHBoxLayout()
        self.media_btn = QPushButton("📎 Attach Media")
        self.media_btn.clicked.connect(self.attach_media)
        self.media_btn.setStyleSheet("""
            QPushButton {
                background-color: #0f172a;
                color: #94a3b8;
                border: 1px solid #334155;
                padding: 4px;
                font-size: 10px;
                font-family: 'JetBrains Mono';
                border-radius: 300
;
            }
            QPushButton:hover {
                background-color: #1e293b;
                color: #f1f5f9;
            }
        """)
        self.media_status = QLabel("No attached file")
        self.media_status.setStyleSheet("color: #64748b; font-size: 9px; font-family: 'JetBrains Mono';")
        media_layout.addWidget(self.media_btn)
        media_layout.addWidget(self.media_status, 1)
        layout.addLayout(media_layout)
        
        # 4. Save and Open Directory Row
        btn_layout = QHBoxLayout()
        
        self.save_btn = QPushButton("Save")
        self.save_btn.clicked.connect(self.save_data)
        self.save_btn.setStyleSheet("""
            QPushButton {
                background-color: #059669;
                color: white;
                font-weight: bold;
                border-radius: 4px;
                padding: 6px;
                font-family: 'JetBrains Mono';
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #10b981;
            }
        """)
        
        self.explorer_btn = QPushButton("Open Dir")
        self.explorer_btn.clicked.connect(self.open_explorer_dir)
        self.explorer_btn.setStyleSheet("""
            QPushButton {
                background-color: #3b82f6;
                color: white;
                border-radius: 4px;
                padding: 6px;
                font-family: 'JetBrains Mono';
                font-size: 11px;
            }
            QPushButton:hover {
                background-color: #60a5fa;
            }
        """)
        
        btn_layout.addWidget(self.save_btn, 1)
        btn_layout.addWidget(self.explorer_btn, 1)
        layout.addLayout(btn_layout)
        
    def attach_media(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "Attach Media Asset (Image/Video)", "", "Media Files (*.png *.jpg *.jpeg *.mp4 *.gif)"
        )
        if file_path:
            self.attached_media_path = file_path
            fn = os.path.basename(file_path)
            self.media_status.setText(fn[:18] + ".." if len(fn) > 18 else fn)
            self.media_status.setStyleSheet("color: #3b82f6; font-size: 9px;")
            
    def save_data(self):
        node_dir = get_node_dir(self.node_id)
        
        # 1. Save plot text script to file as raw .txt (As requested!)
        txt_path = os.path.join(node_dir, "script.txt")
        try:
            with open(txt_path, "w", encoding="utf-8") as f:
                f.write(self.plot_edit.toPlainText())
            
            # Save tag and media references to standard text markers or metadata files
            tag_path = os.path.join(node_dir, "tag.txt")
            with open(tag_path, "w", encoding="utf-8") as f:
                f.write(self.tag_combo.currentText())
                
            # Copy attached media native file inside the node directory (As requested!)
            if self.attached_media_path and os.path.exists(self.attached_media_path):
                dest_path = os.path.join(node_dir, os.path.basename(self.attached_media_path))
                if os.path.abspath(self.attached_media_path) != os.path.abspath(dest_path):
                    shutil.copy2(self.attached_media_path, dest_path)
            
            QMessageBox.information(self, "Success", f"Node '{self.node_id}' files saved locally!")
        except Exception as e:
            QMessageBox.critical(self, "Error", f"Failed saving metadata: {str(e)}")
            
    def load_local_data(self):
        node_dir = get_node_dir(self.node_id)
        txt_path = os.path.join(node_dir, "script.txt")
        if os.path.exists(txt_path):
            with open(txt_path, "r", encoding="utf-8") as f:
                self.plot_edit.setPlainText(f.read())
                
        tag_path = os.path.join(node_dir, "tag.txt")
        if os.path.exists(tag_path):
            with open(tag_path, "r", encoding="utf-8") as f:
                val = f.read().strip()
                idx = self.tag_combo.findText(val)
                if idx >= 0:
                    self.tag_combo.setCurrentIndex(idx)
                    
    def open_explorer_dir(self):
        # Open Windows, Mac, or Linux File Explorer inside folder (As requested!)
        node_dir = os.path.abspath(get_node_dir(self.node_id))
        if sys.platform == "win32":
            os.startfile(node_dir)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", node_dir])
        else:
            subprocess.Popen(["xdg-open", node_dir])


class GraphicsNodeItem(QGraphicsItem):
    def __init__(self, node_id):
        super().__init__()
        self.node_id = node_id
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemIsMovable)
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemIsSelectable)
        self.setFlag(QGraphicsItem.GraphicsItemFlag.ItemSendsGeometryChanges)
        
        # Embedded Widget Proxy
        self.proxy = QGraphicsProxyWidget(self)
        self.widget = NodeUIWidget(self.node_id, self)
        self.proxy.setWidget(self.widget)
        
        # Position proxy
        self.proxy.setPos(0, 0)
        
        self.width = 260
        self.height = 240
        self.port_radius = 8
        
        # Connections list
        self.input_connections = []
        self.output_connections = []
        
    def boundingRect(self):
        return QRectF(-15, -15, self.width + 30, self.height + 30)
        
    def paint(self, painter, option, widget):
        # Painter for styling shadows and high-tech ports
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        
        # Clean rounded border
        border_col = QColor("#3b82f6") if self.isSelected() else QColor("#1e293b")
        pen = QPen(border_col, 2)
        painter.setPen(pen)
        painter.setBrush(QBrush(QColor("#111318")))
        painter.drawRoundedRect(0, 0, self.width, self.height, 8, 8)
        
        # Draw Input Port (Left Anchor Socket)
        painter.setPen(QPen(QColor("#cbd5e1"), 2))
        painter.setBrush(QBrush(QColor("#ef4444"))) # Red input port
        painter.drawEllipse(-self.port_radius, int(self.height / 2) - self.port_radius, self.port_radius * 2, self.port_radius * 2)
        
        # Draw Output Port (Right Anchor Socket)
        painter.setPen(QPen(QColor("#cbd5e1"), 2))
        painter.setBrush(QBrush(QColor("#10b981"))) # Green output port
        painter.drawEllipse(self.width - self.port_radius, int(self.height / 2) - self.port_radius, self.port_radius * 2, self.port_radius * 2)

    def mousePressEvent(self, event):
        scene_pos = event.scenePos()
        # Verify if clicked on the Output Port (extreme right)
        port_rect = QRectF(self.pos().x() + self.width - 15, self.pos().y() + int(self.height / 2) - 15, 30, 30)
        if port_rect.contains(scene_pos):
            # Start drafting modular arrow connection
            canvas = self.scene().views()[0]
            start_point = QPointF(self.pos().x() + self.width, self.pos().y() + int(self.height / 2))
            canvas.start_connection_drag(self, start_point)
            event.accept()
            return
            
        super().mousePressEvent(event)
        
    def itemChange(self, change, value):
        if change == QGraphicsItem.GraphicsItemChange.ItemPositionHasChanged:
            # Re-draw existing narrative arrows in real-time
            for conn in self.input_connections:
                conn.update_target()
            for conn in self.output_connections:
                conn.update_source()
        return super().itemChange(change, value)
        
    def add_input_connection(self, conn):
        self.input_connections.append(conn)
        
    def add_output_connection(self, conn):
        self.output_connections.append(conn)
        
    def get_input_dock_pos(self):
        return QPointF(self.pos().x(), self.pos().y() + int(self.height / 2))
        
    def get_output_dock_pos(self):
        return QPointF(self.pos().x() + self.width, self.pos().y() + int(self.height / 2))
`
  },
  {
    path: 'connection.py',
    description: 'Implements custom drawing for interactive bezier curves and arrow directions that weave together narrative nodes.',
    content: `from PyQt6.QtWidgets import QGraphicsPathItem
from PyQt6.QtCore import QPointF
from PyQt6.QtGui import QPainterPath, QPen, QColor, QPainter

class ConnectionLineItem(QGraphicsPathItem):
    def __init__(self, from_point, to_point):
        super().__init__()
        self.from_point = from_point
        self.to_point = to_point
        self.source_node = None
        self.target_node = None
        
        pen = QPen(QColor("#10b981"), 2)
        self.setPen(pen)
        self.setZValue(-10) # Place lines behind widgets
        
        self.set_line_points(from_point, to_point)
        
    def set_line_points(self, p1, p2):
        self.from_point = p1
        self.to_point = p2
        
        # Generate graceful S-shaped Bezier Curve
        path = QPainterPath()
        path.moveTo(p1)
        
        # Calculate control anchors
        dx = p2.x() - p1.x()
        ctrl_offset = abs(dx) * 0.5
        ctrl1 = QPointF(p1.x() + ctrl_offset, p1.y())
        ctrl2 = QPointF(p2.x() - ctrl_offset, p2.y())
        
        path.cubicTo(ctrl1, ctrl2, p2)
        self.setPath(path)
        
    def set_target_node(self, target):
        self.target_node = target
        self.update_target()
        
    def set_source_node(self, source):
        self.source_node = source
        self.update_source()
        
    def update_source(self):
        if self.source_node:
            p = self.source_node.get_output_dock_pos()
            self.set_line_points(p, self.to_point)
            
    def update_target(self):
        if self.target_node:
            p = self.target_node.get_input_dock_pos()
            self.set_line_points(self.from_point, p)
`
  },
  {
    path: 'utils.py',
    description: 'Workspace helper utilities that manage local file creation, structured scenario subfolders, and multiplatform system explorer commands.',
    content: `import os

BASE_SCENARIOS_DIR = os.path.join(os.path.expanduser("~"), "BranchingScenarios")

def ensure_project_dirs():
    """Create starter project storage under user's home directory"""
    if not os.path.exists(BASE_SCENARIOS_DIR):
        os.makedirs(BASE_SCENARIOS_DIR)

def get_node_dir(node_id):
    """Retrieves or creates directory for specific narrative cell"""
    # Clean file path markers
    clean_id = "".join([c if c.isalnum() else "_" for c in node_id])
    node_dir = os.path.join(BASE_SCENARIOS_DIR, clean_id)
    if not os.path.exists(node_dir):
        os.makedirs(node_dir)
    return node_dir
`
  }
];
