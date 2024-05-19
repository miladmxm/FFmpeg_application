import { useEffect, useState } from 'react'
import { FaCheck, FaPause, FaPlay, FaTrash } from 'react-icons/fa'

const numberRegex = /^\d+$/
function App() {
  const [videos, setVideos] = useState({})

  useEffect(() => {
    window.electron.ipcRenderer.on('progress', (_, args) => {
      setVideos((prev) => {
        return {
          ...prev,
          [args.id]: { ...prev[args.id], progress: args.progress }
        }
      })
    })
    window.electron.ipcRenderer.on('done', (_, args) => {
      setVideos((prev) => {
        return {
          ...prev,
          [args.id]: { ...prev[args.id], progress: 100, status: 'done' }
        }
      })
    })
    window.electron.ipcRenderer.on('resetStatus', (_, args) => {
      setVideos((prev) => {
        return {
          ...prev,
          [args.id]: { ...prev[args.id], progress: 0, status: 'ready' }
        }
      })
    })
    window.electron.ipcRenderer.on('selectDirectoryAndFileNameToSave', (_, args) => {
      console.log(args)
      setVideos((prev) => {
        return { ...prev, [args.id]: { ...prev[args.id], ...args } }
      })
    })
  }, [])

  async function selectVideo() {
    const video = await window.electron.ipcRenderer.invoke('selectVideo')
    if (video) {
      setVideos((prev) => {
        return { ...prev, [video.id]: { ...video } }
      })
    }
  }
  function deleteFromList(id) {
    setVideos((prev) => {
      const newItems = { ...prev }
      delete newItems[id]
      return newItems
    })
  }
  async function selectVideoOutPathAndName(id) {
    if (videos[id].status && (videos[id].status === 'doing' || videos[id].status === 'done')) {
      return
    }
    await window.electron.ipcRenderer.send('selectDirectoryAndFileNameToSave', {
      defaultPath: `${videos[id].outFilePath}${videos[id].outFilename}`,
      id
    })
  }
  function abortProcess(id) {
    window.electron.ipcRenderer.send('abortById', id)
  }
  function CRFinputChange(e, id) {
    if (videos[id].status && (videos[id].status === 'doing' || videos[id].status === 'done')) {
      return
    }
    if (
      (numberRegex.test(e.target.value) && e.target.value >= 1 && e.target.value <= 51) ||
      e.target.value === ''
    ) {
      setVideos((prev) => {
        return {
          ...prev,
          [id]: {
            ...prev[id],
            crf: Number(e.target.value) > 0 ? Number(e.target.value) : ''
          }
        }
      })
    }
  }

  async function startProcess(id) {
    const { status, crf, filePath, outFilePath, outFilename } = videos[id]
    if (
      (status && status === 'doing') ||
      status === 'done' ||
      !crf ||
      crf === '' ||
      crf < 1 ||
      crf > 51
    ) {
      return
    }
    setVideos((pre) => {
      return {
        ...pre,
        [id]: { ...pre[id], status: 'doing' }
      }
    })

    await window.electron.ipcRenderer.send('startProcess', {
      filePath,
      outFilePath,
      outFilename,
      crf,
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
                <div
                  className={`border-gray-3 rounded-xl border-2 p-2 ${videoItem.status === 'done' ? 'opacity-50 [&_*]:pointer-events-none' : ''}`}
                  key={videoKey}
                >
                  <div className="flex justify-between">
                    {/* <img src={src} alt="" /> */}
                    <div className="flex-1 border-l border-gray-1 border-solid max-w-[50%] p-2 flex gap-2">
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
                    <div className="flex-1 border-l border-solid border-gray-1 max-w-[50%] p-2 flex gap-2">
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
                  <div className="border-t p-2 border-gray-1 border-solid space-y-4">
                    <h6>تنظیمات:</h6>
                    <div className="flex items-center justify-between gap-5">
                      <div className="flex gap-2 items-center">
                        <span>ضریب نرخ ثابت(CRF):</span>
                        <input
                          placeholder="یک عدد بین 1 تا 51"
                          onChange={(e) => CRFinputChange(e, videoKey)}
                          className={
                            videoItem.crf === ''
                              ? 'ring-red-400 outline-none border-none bg-transparent ring-2 p-1 rounded'
                              : videoItem.crf > 17 && videoItem.crf < 29
                                ? 'ring-green-400 outline-none border-none bg-transparent ring-2 p-1 rounded'
                                : 'outline-none border-none bg-transparent ring-2 p-1 rounded'
                          }
                          type="text"
                          value={videoItem.crf}
                        />
                      </div>
                      <div className="flex gap-2 flex-auto items-center justify-end">
                        {videoItem.status === 'doing' && (
                          <div className="relative flex-auto h-1 bg-text-3 ">
                            <div
                              style={{ width: videoItem.progress + '%' }}
                              className="absolute transition-all bg-[#3b82f680] left-0 h-full top-0"
                            >
                              {videoItem.progress > 0 && <small>{videoItem.progress + '%'}</small>}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {videoItem.status === 'doing' ? (
                            <button onClick={() => abortProcess(videoKey)} className="text-red-400">
                              <FaPause />
                            </button>
                          ) : videoItem.status === 'done' ? (
                            <>
                              <FaCheck className="text-green-500" />
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => deleteFromList(videoKey)}
                                className="text-red-400"
                              >
                                <FaTrash />
                              </button>
                              <button
                                onClick={() => startProcess(videoKey)}
                                className="text-green-500"
                              >
                                <FaPlay />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </>
  )
}

export default App
