import { useEffect, useState } from 'react'

function App() {
  const [log, setLog] = useState('')
  const [videos, setVideos] = useState({})

  useEffect(() => {
    window.electron.ipcRenderer.on('path', (_, args) => {
      setLog(args)
    })
    window.electron.ipcRenderer.on('selectDirectoryAndFileNameToSave', (_, args) => {
      console.log(args)
      setVideos(prev=>{
        return {...prev,[args.id]:{...prev[args.id],...args}}
      })
    })
  }, [])

  async function selectVideo() {
    const video = await window.electron.ipcRenderer.invoke('selectVideo')
    setVideos((prev) => {
      return { ...prev, [video.id]: { ...video } }
    })
    console.log(video)
  }

  async function selectVideoOutPathAndName(id) {
    await window.electron.ipcRenderer.send('selectDirectoryAndFileNameToSave', {
      defaultPath: `${videos[id].outFilePath}${videos[id].outFilename}`,
      id
    })
  }

  function submitForm(e) {
    e.preventDefault()
    console.log(e)
  }
  return (
    <>
      <main className="w-screen flex flex-col gap-10 h-screen max-w-3xl mx-auto text-text-1 p-4">
        <form onSubmit={submitForm} className="flex flex-col gap-6 items-center">
          <button
            onClick={selectVideo}
            className="hover:ring-4 ring-gray-2 transition-all p-3 rounded-lg bg-gray-3 w-fit"
            type="button"
          >
            ویدیو خود را انتخاب کنید
          </button>
        </form>
        <section className="p-2 overflow-y-auto max-h-[60svh]">
          <div className="flex flex-col gap-5">
            {Object.keys(videos).map((videoKey) => {
              const videoItem = videos[videoKey]
              return (
                <div className="border-gray-3 rounded-xl border-2 p-2" key={videoKey}>
                  <div className="flex justify-between">
                    <div className="flex-1 border-l border-solid max-w-[50%] p-2 flex gap-2">
                      <span className="text-white-mute font-light min-w-fit">نام:</span>
                      <span className="truncate">{videoItem.filename}</span>
                    </div>
                    <div
                      className="flex-1 max-w-[50%] p-2 flex gap-2 cursor-pointer hover:ring-2 transition-all rounded"
                      onClick={() => selectVideoOutPathAndName(videoKey)}
                    >
                      <span className="text-white-mute font-light min-w-fit">نام خروجی:</span>
                      <span className="truncate">{videoItem.outFilename}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex-1 border-l border-solid max-w-[50%] p-2 flex gap-2">
                      <span className="text-white-mute font-light min-w-fit">آدرس ویدیو:</span>
                      <span className="truncate">{videoItem.filePath}</span>
                    </div>
                    <div
                      className="flex-1 max-w-[50%] p-2 flex gap-2 cursor-pointer hover:ring-2 transition-all rounded"
                      onClick={() => selectVideoOutPathAndName(videoKey)}
                    >
                      <span className="text-white-mute font-light min-w-fit">آدرس خروجی:</span>
                      <span className="truncate">{videoItem.outFilePath}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
      {/* 
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        {log}
        <br />
        Build an Electron app with <span className="react">React</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <button
          onClick={() => {
            window.electron.ipcRenderer.invoke('openFile')
          }}
        >
          openFile
        </button>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={ipcHandle}>
            Send IPC
          </a>
        </div>
      </div> */}
    </>
  )
}

export default App
