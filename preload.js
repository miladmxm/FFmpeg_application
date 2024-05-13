const { contextBridge, ipcRenderer } = require('electron/renderer')

contextBridge.exposeInMainWorld('actions', {
  openFile:()=>ipcRenderer.invoke("openFile")
})