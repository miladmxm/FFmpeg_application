import { app, shell, BrowserWindow, ipcMain, dialog, Notification } from 'electron'
import fs from 'fs'
import path, { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import ffmpegPath from 'ffmpeg-static'
import { exec, spawn } from 'child_process'
import { v4 as uuidv4 } from 'uuid'

import icon from '../../resources/icon.png?asset'
const ffmpegTruePath = ffmpegPath.replace('app.asar', 'app.asar.unpacked')
function createNotification(title, body) {
  new Notification({
    title,
    body
  }).show()
}
function addMinToFileName(filename) {
  const arrayOfName = filename.split('.')
  arrayOfName[arrayOfName.length - 1] = '_min.' + arrayOfName[arrayOfName.length - 1]
  return arrayOfName.join('')
}

function returnFileName(fullpath) {
  let filename = fullpath.split('\\')
  return filename[filename.length - 1]
}

const allProcess = {}

async function runCRFffmpeg(event, { outFilePath, outFilename, filePath, crf, id }) {
  return new Promise((resolve) => {
    const controller = new AbortController()
    const { signal } = controller
    allProcess[id] = { abort: () => controller.abort(), fullPath: outFilePath + outFilename }
    const child = spawn(
      ffmpegTruePath,
      [
        '-i',
        `${filePath}`,
        '-vcodec',
        'libx265',
        '-crf',
        `${crf}`,
        `${outFilePath}${outFilename}`,
        `-y`,
        '-stats'
      ],
      { signal }
    )

    let stdOUTCunter = 0
    let videoDuration = 0
    child.stdout.on('data', (data) => {
      console.log(`stdout:\n${data}`)
    })

    child.stderr.on('data', (data) => {
      const stringData = data.toString('utf-8')
      if (videoDuration === 0) {
        const indexOfDurationInString = stringData.indexOf('Duration: ')
        if (indexOfDurationInString > -1) {
          const indexOfStartInString = stringData.indexOf(', start')
          const startSlice = indexOfDurationInString + 'Duration: '.length
          videoDuration = stringData.slice(startSlice, indexOfStartInString)
          videoDuration = videoDuration.replaceAll(':', '')
          videoDuration = Number(videoDuration)
        }
      } else {
        const startTimeIndex = stringData.indexOf('time=')
        if (startTimeIndex !== -1) {
          const bitrateForEndIndex = stringData.indexOf('bitrate')
          const startSlice = startTimeIndex + 'time='.length
          let progress = stringData.slice(startSlice, bitrateForEndIndex)
          if (!progress.startsWith('-')) {
            progress = progress.replaceAll(':', '')
            progress = Number(progress)
            progress = Math.round((progress * 100) / videoDuration)
            event.reply('progress', { id, progress })
          }
        }
      }
      stdOUTCunter++
    })
    child.on('error', (error) => {
      if (error.code === 'ABORT_ERR') {
        event.reply('resetStatus', { id })
        setTimeout(() => {
          fs.unlinkSync(outFilePath + outFilename)
        }, 2000)
      }
    })

    child.on('close', (code) => {
      if (code === 0) {
        delete allProcess[id]
        // todo send progress to frontend
        createNotification(
          'ذخیره شد',
          `فایل مدنظر شما در مسیر ${outFilePath} با نام ${outFilename} ذخیره شد!`
        )
        resolve(id)
        event.reply('done', { id })
        console.log(`child process exited with code ${code}`)
      }
    })
  })
}
async function abortById(_, id) {
  try {
    if (allProcess[id]) {
      await allProcess[id].abort()
      delete allProcess[id]
    }
  } catch (err) {}
}
async function runRtbufsizeFfmpeg(filePath, srcfilename, filename) {
  const outFilePath = filePath.replace(filePath, '')
  const outFilename = filename ? filename : addMinToFileName(srcfilename)
  return new Promise((resolve) => {
    // -rtbufsize 1M for custom size
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

async function selectVideo() {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4'] }]
  })
  if (!canceled) {
    let filename = filePaths[0].split('\\')
    filename = filename[filename.length - 1]
    const outFilename = addMinToFileName(filename)
    const outFilePath = filePaths[0].replace(filename, '')
    const id = uuidv4()
    // const thumbnail = await getThumbnail(filePaths[0])
    return {
      filePath: filePaths[0],
      filename,
      outFilename,
      outFilePath,
      id,
      crf: 22,
      thumbnail: null
    }
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

async function getThumbnail(filePath) {
  const filename = returnFileName(filePath)
  const writePath = path.join(__dirname, filename + 'T.jpeg')
  return new Promise((resolve) => {
    exec(
      `${ffmpegTruePath} -i "${filePath}" -vf scale=-1:200 -vframes 1 "${writePath}"`,
      (err, stdout) => {
        if (err) {
          resolve(false)
          console.log(err)
          return
        }
        fs.readFile(writePath, (err, filedata) => {
          if (err) {
            console.log(err)
            resolve(err)
          }
          resolve(filedata)
          fs.unlinkSync(writePath)
        })
      }
    )
  })
}
function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    icon: icon,
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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  ipcMain.handle('selectVideo', selectVideo)
  ipcMain.on('selectDirectoryAndFileNameToSave', selectDirectoryAndFileNameToSave)
  ipcMain.on('startProcess', runCRFffmpeg)
  ipcMain.on('abortById', abortById)

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
