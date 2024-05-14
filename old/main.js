const { exec } = require('node:child_process');
const fs = require("node:fs")
const path = require('node:path')

const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')

// const Zip = require("node-7z")

//.\\ffmpeg\\bin\\ffmpeg.exe -h
// ffmpeg -i input.mp4 -vcodec libx265 -crf 28 output.mp4

async function runFFMPEGCcommand(path,filename){
    return new Promise(resolve=>{
        exec(`.\\resources\\ffmpeg\\bin\\ffmpeg.exe -i ${path} -vcodec libx265 -crf 28 ${path}min.mp4`, (err, stdout, stderr) => {
            if (err) {
                resolve(false)
                return;
            }
            console.log(stdout)
            resolve(`stdout: ${stdout}`)
            
        });
    })
}

async function handleFileOpen () {
    const { canceled, filePaths } = await dialog.showOpenDialog()
    if (!canceled) {
        let filename = filePaths[0].split("\\")
        filename = filename[filename.length-1]
        if(await runFFMPEGCcommand(filePaths,filename)){
            return filePaths[0]
        }else{
            return "warn"
        }
    }
  }

function FFMPEGIsExist() {
    return new Promise((resolve) => {
        exec(`dir resources\\ffmpeg`, (err, stdout, stderr) => {
            if (err) {
                resolve(false)
                return;
            }
            resolve(`stdout: ${stdout}`)
        });
    })
}


const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })
    // win.loadURL("https://github.com")
    ipcMain.on("set-title", (event, title) => {
        console.log(title)
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        win.setTitle(title)
    })
    mainWindow.loadFile('index.html')
}

app.whenReady().then(async () => {
    const ffmpegisExist = await FFMPEGIsExist()
    if (ffmpegisExist) {
        ipcMain.handle('openFile', handleFileOpen)
        createWindow()
    }else{
        app.quit()
    }

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})