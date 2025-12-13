import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

const streamPipeline = promisify(pipeline);
let store: any;

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

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('download-batch-images', async (event, { basePath, topic, dateStr, images }: { basePath: string, topic: string, dateStr?: string, images: { uploadPath: string, content: string }[] }) => {
  try {
    // Sanitize topic for folder name
    const safeTopic = topic.replace(/[^\w\u4e00-\u9fa5]/g, "");
    // Create path: basePath/dateStr/topic OR basePath/topic
    const targetDir = dateStr 
      ? path.join(basePath, dateStr, safeTopic)
      : path.join(basePath, safeTopic);

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
          // Get original filename
          const originalName = path.basename(pathname);
          // Add sequence prefix (01_, 02_, etc.) to ensure order
          fileName = `${(i + 1).toString().padStart(2, '0')}_${originalName}`;
        } catch (e) {
          // Fallback if URL parsing fails
          fileName = `${(i + 1).toString().padStart(2, '0')}_${Date.now()}.png`;
        }
      } else {
        // Fallback for data URIs or others
        fileName = `${(i + 1).toString().padStart(2, '0')}_${Date.now()}.png`;
      }
      
      // Ensure we have a valid filename, fallback if empty or invalid
      if (!fileName || fileName === '.' || fileName === '/') {
          fileName = `${(i + 1).toString().padStart(2, '0')}_${Date.now()}.png`;
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

ipcMain.handle('save-image', async (event, { url, defaultName }: { url: string, defaultName?: string }) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      defaultPath: defaultName || 'image.png',
      filters: [
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
      ]
    });

    if (canceled || !filePath) {
      return { success: false, canceled: true };
    }

    if (url.startsWith('http')) {
      const client = url.startsWith('https') ? https : http;
      await new Promise<void>((resolve, reject) => {
         client.get(url, (response) => {
           if (response.statusCode !== 200) {
             reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
             return;
           }
           const fileStream = fs.createWriteStream(filePath);
           streamPipeline(response, fileStream)
             .then(() => resolve())
             .catch(reject);
         }).on('error', reject);
      });
    } else if (url.startsWith('data:image')) {
      const base64Data = url.replace(/^data:image\/\w+;base64,/, "");
      fs.writeFileSync(filePath, base64Data, 'base64');
    } else {
        // Assume local path, copy it
        if (fs.existsSync(url)) {
            fs.copyFileSync(url, filePath);
        } else {
            throw new Error(`Local file not found: ${url}`);
        }
    }
    return { success: true, filePath };
  } catch (error: any) {
    console.error('Save image error:', error);
    return { success: false, error: error.message };
  }
});

// Store IPC handlers
ipcMain.handle('store:get', (_event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', (_event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('store:delete', (_event, key) => {
  store.delete(key);
});

ipcMain.handle('store:clear', () => {
  store.clear();
});

ipcMain.handle('store:has', (_event, key) => {
  return store.has(key);
});

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'] || 'http://localhost:5173';

ipcMain.handle('open-log-folder', () => {
  const logPath = log.transports.file.getFile().path;
  const logDir = path.dirname(logPath);
  shell.openPath(logDir);
  return logDir;
});

ipcMain.handle('shell:openPath', async (event, path) => {
  await shell.openPath(path);
});

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

function setupAutoUpdater() {
  log.transports.file.level = 'info';
  autoUpdater.logger = log;
  const repo = 'yangshare/MediaPicGen';
  
  // 异步配置更新源
  (async () => {
    try {
      // 1. 获取最新的 Release (包括 Pre-release)
      // 直接访问 GitHub API 获取版本信息。注意：ghfast.top 等镜像源通常不支持代理 API 请求 (会返回 403)。
      // 如果直接访问 API 成功，我们将构建镜像下载链接加速下载；如果失败，将回退到默认更新逻辑。
      const apiUrl = `https://api.github.com/repos/${repo}/releases?per_page=1`;
      
      log.info(`Fetching latest release info from: ${apiUrl}`);
      
      // 使用内建的 net 模块或者 fetch (Electron 29 支持 fetch)
      const response = await fetch(apiUrl, { headers: { 'User-Agent': 'MediaPicGen' } });
      if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.status} ${response.statusText}`);
      }
      
      const releases = await response.json();
      if (!Array.isArray(releases) || releases.length === 0) {
        throw new Error('No releases found');
      }
      
      const latestRelease = releases[0];
      const tagName = latestRelease.tag_name;
      
      log.info(`Found latest release tag: ${tagName}`);
      
      // 2. 构造指向该 Tag 的 Generic Feed URL
      const feedUrl = `https://github.com/${repo}/releases/download/${tagName}`;
      
      log.info(`Setting auto-updater feed to: ${feedUrl}`);
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: feedUrl
      });
      
      // 立即检查更新
      if (app.isPackaged) {
         autoUpdater.checkForUpdatesAndNotify();
      }
      
    } catch (e) {
      log.error('Failed to configure mirror feed, falling back to default GitHub provider.', e);
      // 如果获取失败，回退到默认的 GitHub Provider (读取 package.json 配置)
      // 这种情况下不做任何 setFeedURL 操作，electron-updater 会自动使用 package.json 里的 repository 信息
      if (app.isPackaged) {
         autoUpdater.checkForUpdatesAndNotify();
      }
    }
  })();

  // Allow updating from prerelease
  autoUpdater.allowPrerelease = true;
  
  autoUpdater.on('checking-for-update', () => {
    log.info('Checking for update...');
    win?.webContents.send('update-status', '正在检查更新...');
  });
  autoUpdater.on('update-available', (info) => {
    log.info('Update available.', info);
    win?.webContents.send('update-status', `发现新版本 v${info.version}，正在下载...`);
  });
  autoUpdater.on('update-not-available', (info) => {
    log.info('Update not available.', info);
    // win?.webContents.send('update-status', '当前已是最新版本');
  });
  autoUpdater.on('error', (err) => {
    log.error('Error in auto-updater. ' + err);
    const errorMessage = err.message || err.toString();
    win?.webContents.send('update-status', `检查更新失败: ${errorMessage}`);
    win?.webContents.send('update-error', errorMessage);
  });
  autoUpdater.on('download-progress', (progressObj) => {
    let log_message = "Download speed: " + progressObj.bytesPerSecond;
    log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
    log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
    log.info(log_message);
    win?.webContents.send('update-progress', progressObj.percent);
  });
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded', info);
    dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: '新版本已下载完成，应用将重启以进行更新。',
      buttons: ['立即重启', '稍后']
    }).then((returnValue) => {
      if (returnValue.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  });
}

app.whenReady().then(async () => {
  // Dynamic import for electron-store (ESM only)
  const { default: Store } = await import('electron-store');
  store = new Store();
  
  createWindow();
  setupAutoUpdater();
  // 注意：checkForUpdatesAndNotify 已移动到 setupAutoUpdater 内部的异步逻辑中，
  // 无论是成功配置镜像源还是回退到默认源，都会在那里触发，避免竞争条件。
});
