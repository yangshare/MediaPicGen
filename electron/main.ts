import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { pipeline } from 'stream';
import { promisify } from 'util';

const streamPipeline = promisify(pipeline);

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;
ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });
  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});

ipcMain.handle('download-batch-images', async (event, { basePath, topic, images }: { basePath: string, topic: string, images: { uploadPath: string, content: string }[] }) => {
  try {
    // Sanitize topic for folder name
    const safeTopic = topic.replace(/[\\/:*?"<>|]/g, "_");
    const targetDir = path.join(basePath, safeTopic);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    for (let i = 0; i < images.length; i++) {
      const { uploadPath } = images[i];
      
      let fileName = '';
      if (uploadPath.startsWith('http')) {
        try {
          const url = new URL(uploadPath);
          const pathname = url.pathname;
          fileName = path.basename(pathname);
        } catch (e) {
          // Fallback if URL parsing fails
          fileName = `${Date.now()}_${i}.png`;
        }
      } else {
        // Fallback for data URIs or others
        fileName = `${Date.now()}_${i}.png`;
      }
      
      // Ensure we have a valid filename, fallback if empty or invalid
      if (!fileName || fileName === '.' || fileName === '/') {
          fileName = `${Date.now()}_${i}.png`;
      }

      // Ensure unique filename to prevent overwrites if multiple files have same name
      let filePath = path.join(targetDir, fileName);
      let counter = 1;
      while (fs.existsSync(filePath)) {
          const ext = path.extname(fileName);
          const name = path.basename(fileName, ext);
          filePath = path.join(targetDir, `${name}_${counter}${ext}`);
          counter++;
      }

      if (uploadPath.startsWith('http')) {
        const client = uploadPath.startsWith('https') ? https : http;
        await new Promise<void>((resolve, reject) => {
           client.get(uploadPath, (response) => {
             if (response.statusCode !== 200) {
               reject(new Error(`Failed to download ${uploadPath}: ${response.statusCode}`));
               return;
             }
             const fileStream = fs.createWriteStream(filePath);
             streamPipeline(response, fileStream)
               .then(() => resolve())
               .catch(reject);
           }).on('error', reject);
        });
      } else if (uploadPath.startsWith('data:image')) {
        const base64Data = uploadPath.replace(/^data:image\/\w+;base64,/, "");
        fs.writeFileSync(filePath, base64Data, 'base64');
      }
    }
    return { success: true, path: targetDir };
  } catch (error: any) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
});

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'] || 'http://localhost:5173';

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'icon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false, // For simplicity in this tool, enabling node integration. Better security would use contextIsolation: true and IPC.
    },
  });

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString());
  });

  if (!app.isPackaged) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(process.env.DIST, 'index.html'));
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
