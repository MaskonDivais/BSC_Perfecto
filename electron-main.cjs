const { app, BrowserWindow } = require('electron');
const path = require('path');

// Fix text/node blurriness: disable GPU rasterization which is known to cause fuzzy text on Windows (especially with FXAA enabled on NVIDIA cards)
app.commandLine.appendSwitch('disable-gpu-rasterization');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    backgroundColor: '#0a0c13',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Scenario Project Builder",
    autoHideMenuBar: true,
  });

  // Load production compiled build from Vite's dist folder
  const htmlPath = path.join(__dirname, 'dist', 'index.html');
  mainWindow.loadFile(htmlPath).catch((err) => {
    console.error("Failed to load local HTML bundle:", err);
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
