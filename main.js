const { exec } = require('node:child_process');
const https = require("node:https")
const fs = require("node:fs")
const path = require('node:path')

const { app, BrowserWindow, ipcMain, dialog } = require('electron/main')

const Seven = require("node-7z")

const ffmpegUrl = "https://www.gyan.dev/ffmpeg/builds/packages/ffmpeg-2024-05-13-git-37db0454e4-full_build.7z"

//.\\ffmpeg\\bin\\ffmpeg.exe -h

function UnzipFFMPEG() {
    return new Promise(resolve => {
        try {
            const myStream = Seven.extractFull('./ffmpeg-git-full.7z', './', {
                $progress: true
            })
            myStream.on("end",()=>{
                console.log(myStream.info.get("Folders"))
                resolve(myStream.info.get("Folders"))
            })
            
        } catch (err) {
            console.log(err)
        }
    })
}

function FFMPEGIsExist() {
    return new Promise((resolve) => {
        exec(`dir ffmpeg`, (err, stdout, stderr) => {
            if (err) {
                resolve(false)
                return;
            }
            resolve(`stdout: ${stdout}`)
        });
    })
}
function DownloadFFMPEG() {
    return new Promise((resolve) => {
        https.get(ffmpegUrl, res => {
            const pathToSave = path.join(__dirname, "ffmpeg-git-full.7z")
            const filePath = fs.createWriteStream(pathToSave)
            res.pipe(filePath)
            filePath.on("finish", () => {
                filePath.close()
                console.log("downloaded")
                resolve(true)
            })
        })
    })
}


async function openFile() {
    const { canceled, filePaths } = await dialog.showOpenDialog()
    console.log(filePaths)

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
    if (!ffmpegisExist) {
        // const downloadFFmpeg = await DownloadFFMPEG()
        // await UnzipFFMPEG()
    }
    createWindow()
    // openFile()

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