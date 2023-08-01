import { app, BrowserWindow, ipcMain, session, shell } from 'electron';
import isDev from 'electron-is-dev';
import Store from 'electron-persist-secure/lib/store';
import path from 'path';

const DEFAULT_PORT = 4160;

// This allows TypeScript to pick up the magic constants that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Squirrel.Windows will spawn the app multiple times while installing/updating
// to make sure only one app is running, we quit if we detect squirrel
if (require('electron-squirrel-startup')) {
  app.quit();
}

export let store: Store;
const createStore = () => {
  store = new Store({
    configName: 'config',
  });

  store.set('port', store.get('port', DEFAULT_PORT));
  store.set('startup', store.get('startup', false));
};

const createWindow = () => {
  const suffix =
    process.platform === 'darwin'
      ? 'icns'
      : process.platform === 'linux'
      ? 'png'
      : 'ico';
  const icon = `icon.${suffix}`;

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    frame: false,
    height: 720,
    icon: app.isPackaged
      ? path.join(process.resourcesPath, icon)
      : path.join(__dirname, '..', '..', 'src', 'assets', 'icons', icon),
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    width: 1024,
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // remove the menu
  mainWindow.removeMenu();
  mainWindow.setWindowButtonVisibility?.(false);

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `connect-src 'self' data: http://localhost:* https://*.defly.app wss://*.walletconnect.org wss://*.defly.app; font-src 'self' https://fonts.gstatic.com; object-src 'none'; script-src 'self'; style-src 'unsafe-inline' https://fonts.googleapis.com`,
        ],
      },
    });
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createStore();
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// make sure all links open in the default browser
app.on('web-contents-created', (_, contents) => {
  contents.on('will-attach-webview', (event) => event.preventDefault());
  contents.on('will-navigate', (event) => event.preventDefault());
  contents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
});

// IPC handlers
import './bridge/goal';

ipcMain.on('isDev', () =>
  BrowserWindow.getAllWindows()[0]?.webContents.send('isDev', null, isDev),
);

ipcMain.on('maximize', () => {
  BrowserWindow.getAllWindows()[0]?.maximize();
  BrowserWindow.getAllWindows()[0]?.webContents.send('maximize');
});

ipcMain.on('maximized', () => {
  BrowserWindow.getAllWindows()[0]?.webContents.send(
    'maximized',
    null,
    BrowserWindow.getAllWindows()[0]?.isMaximized(),
  );
});

ipcMain.on('minimize', () => {
  if (process.platform === 'darwin') {
    app.hide();
  } else {
    BrowserWindow.getAllWindows()[0]?.minimize();
  }

  BrowserWindow.getAllWindows()[0]?.webContents.send('minimize');
});

ipcMain.on('platform', () => {
  BrowserWindow.getAllWindows()[0]?.webContents.send(
    'platform',
    null,
    process.platform,
  );
});

ipcMain.on('refresh', () => {
  createWindow();
  BrowserWindow.getAllWindows()[0]?.close();
});

ipcMain.on('quit', () => {
  // close all the windows
  BrowserWindow.getAllWindows().forEach((window) => window.close());
});

ipcMain.on('setStartup', (_, { startup }) => {
  const appFolder = path.dirname(process.execPath);
  const updateExe = path.resolve(appFolder, '..', 'Update.exe');
  const exeName = path.basename(process.execPath);

  app.setLoginItemSettings({
    args: ['--processStart', `"${exeName}"`],
    openAtLogin: startup,
    path: updateExe,
  });

  store.set('startup', startup);
  BrowserWindow.getAllWindows()[0]?.webContents.send('setStartup');
});

ipcMain.on('unmaximize', () => {
  BrowserWindow.getAllWindows()[0]?.unmaximize();
  BrowserWindow.getAllWindows()[0]?.webContents.send('unmaximize');
});
