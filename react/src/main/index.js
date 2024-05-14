import { app, shell, BrowserWindow, ipcMain, dialog, Tray, nativeImage } from 'electron'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ffmpegPath from 'ffmpeg-static'
import { exec } from 'child_process'
import { v4 as uuidv4 } from 'uuid'

import icon from '../../resources/icon.png?asset'
const ffmpegTruePath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')

function addMinToFileName(filename) {
  const arrayOfName = filename.split('.')
  arrayOfName[arrayOfName.length - 1] = '_min.' + arrayOfName[arrayOfName.length - 1]
  return arrayOfName.join('')
}

async function runFFMPEGCcommand(filePath, srcfilename, filename) {
  const outFilePath = filePath.replace(filePath, '')
  const outFilename = filename ? filename : addMinToFileName(srcfilename)
  return new Promise((resolve) => {
    exec(
      `${ffmpegTruePath} -i "${filePath}" -vcodec libx265 -crf 22 "${outFilePath}${outFilename}"`,
      (err, stdout) => {
        if (err) {
          resolve(false)
          return
        }
        resolve(`stdout: ${stdout}`)
      }
    )
  })
}

async function handleFileOpen() {
  const { canceled, filePaths } = await dialog.showOpenDialog()
  if (!canceled) {
    let filename = filePaths[0].split('\\')
    filename = filename[filename.length - 1]
    if (await runFFMPEGCcommand(filePaths, filename)) {
      return filePaths[0]
    } else {
      return 'warn'
    }
  }
}

async function selectVideo() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] }]
  })
  if (!canceled) {
    let filename = filePaths[0].split('\\')
    filename = filename[filename.length - 1]
    const outFilename = addMinToFileName(filename)
    const outFilePath = filePaths[0].replace(filename, '')
    const id = uuidv4()

    return { filePath: filePaths[0], filename, outFilename, outFilePath, id, crf: 22 }
  }
}

async function selectDirectoryAndFileNameToSave(event, { defaultPath, id }) {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [{ name: 'Videos', extensions: ['mp4'] }],
    title: 'مسیر مدنظر و نام آن را مشخص کنید',
    defaultPath,
    buttonLabel: 'اینجا',
    properties: ['promptToCreate']
  })
  if (!canceled) {
    const resultFilePath = filePaths[0].split('\\')

    const outFilename = resultFilePath[resultFilePath.length - 1]
    const outFilePath = filePaths[0].replace(outFilename, '')
    console.log(outFilename, outFilePath)
    event.reply('selectDirectoryAndFileNameToSave', { outFilename, outFilePath, id })
    return { outFilename, outFilePath }
  }
}

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    mainWindow.webContents.send('path', ffmpegTruePath)
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('selectVideo', selectVideo)
  ipcMain.on('selectDirectoryAndFileNameToSave', selectDirectoryAndFileNameToSave)

  createWindow()
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
