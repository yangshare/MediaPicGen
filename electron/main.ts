import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import http from 'http';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';

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

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
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

ipcMain.handle('open-log-folder', () => {
  const logPath = log.transports.file.getFile().path;
  const logDir = path.dirname(logPath);
  require('electron').shell.openPath(logDir);
  return logDir;
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

app.whenReady().then(() => {
  createWindow();
  setupAutoUpdater();
  // 注意：checkForUpdatesAndNotify 已移动到 setupAutoUpdater 内部的异步逻辑中，
  // 无论是成功配置镜像源还是回退到默认源，都会在那里触发，避免竞争条件。
});
