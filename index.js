const { app, BrowserWindow, Menu, nativeTheme } = require('electron')
const { autoUpdater } = require('electron-updater')
const fs = require('fs')
const util = require('util')
const windowStateKeeper = require('electron-window-state')

require('v8-compile-cache')

const isMac = process.platform === 'darwin'

Menu.setApplicationMenu(Menu.buildFromTemplate([
  ...(isMac ? [{
    role: 'appMenu'
  }] : []),
  {
    role: 'fileMenu'
  },
  {
    role: 'windowMenu'
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'Toggle Developer Tools',
        role: 'toggleDevTools'
      },
      ...(!isMac ? [{
        role: 'about'
      }] : [])
    ]
  }
]))

const createWindow = () => {
  const path = require('path')

  const state = windowStateKeeper({
    defaultHeight: 750,
    defaultWidth: 1200
  })

  const window = new BrowserWindow({
    icon: path.join(__dirname, 'assets', 'icon.png'),

    height: state.height,
    minHeight: 100,
    minWidth: 350,
    width: state.width,
    x: state.x,
    y: state.y,

    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1f1f1f' : '#ffffff',
    show: false, // hide window until ready
    title: 'Apple Music',

    // enables DRM
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      plugins: true,
      preload: path.join(__dirname, 'assets', 'preload.js'),
      sandbox: true
    }
  })

  state.manage(window)

  window.loadURL('https://music.apple.com')

  window.webContents.on('did-finish-load', async () => {
    const readFile = util.promisify(fs.readFile)

    const stylePath = path.join(__dirname, 'assets', 'style.css')

    try {
      const style = await readFile(stylePath, 'utf-8')
      await window.webContents.insertCSS(style)
    } catch (error) {
      console.error(error)
    }
  })

  // show window when ready
  window.once('ready-to-show', () => {
    window.show()
  })
}

app.on('ready', function () {
  autoUpdater.checkForUpdatesAndNotify()
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('widevine-ready', createWindow)
