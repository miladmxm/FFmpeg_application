import { useEffect, useState } from 'react'

import { FaCheck, FaPause, FaPlay, FaTrash, FaPlus, FaUndo } from 'react-icons/fa'

const numberRegex = /^\d+$/

function App() {
  const [videos, setVideos] = useState({})
  const [finished, setFinished] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [formatError, setFormatError] = useState(false)

  useEffect(() => {
    document.addEventListener('drop', async (event) => {
      event.preventDefault()
      event.stopPropagation()
      for (const f of event.dataTransfer.files) {
        let fileExt = f.path.split('.')
        fileExt = fileExt[fileExt.length - 1]
        if (fileExt === 'mp4' || fileExt === 'mkv') {
          setIsLoading(true)
          await window.electron.ipcRenderer.send('dropFiles', f.path)
        } else {
          setFormatError(true)
          setTimeout(() => {
            setFormatError(false)
          }, 1000)
        }
      }
    })

    document.addEventListener('dragover', (e) => {
      e.preventDefault()
      e.stopPropagation()
    })
    window.electron.ipcRenderer.on('progress', (_, args) => {
      setVideos((prev) => {
        return {
          ...prev,
          [args.id]: { ...prev[args.id], progress: args.progress }
        }
      })
    })
    window.electron.ipcRenderer.on('done', (_, args) => {
      setFinished((prev) => {
        return [...prev, args.id]
      })
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
      setVideos((prev) => {
        return { ...prev, [args.id]: { ...prev[args.id], ...args } }
      })
    })
    window.electron.ipcRenderer.on('selectedVideo', (_, videoData) => {
      setIsLoading(false)
      setVideos((prev) => {
        return { ...prev, [videoData.id]: { ...videoData } }
      })
    })
  }, [])

  function resetFinished() {
    if (finished.length > 0) {
      const newVideos = { ...videos }
      finished.forEach((id) => {
        delete newVideos[id]
      })
      setFinished([])
      setVideos(newVideos)
    }
  }

  function openIdDir(id) {
    if (videos[id] && videos[id].outFilePath && videos[id].status === 'done') {
      window.electron.ipcRenderer.send('openOutDir', videos[id].outFilePath)
    }
  }
  async function selectVideo() {
    if (isLoading) {
      return
    }
    setIsLoading(true)
    const video = await window.electron.ipcRenderer.invoke('selectVideo')
    setIsLoading(false)
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
      defaultPath: `${videos[id].outFilePath}`,
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
    const { status, crf, filePath, outFilePath } = videos[id]
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
      crf,
      id
    })
  }
  function submitForm(e) {
    e.preventDefault()
    console.log(e)
  }

  function setFormat(id, format) {
    if (videos[id].status && (videos[id].status === 'doing' || videos[id].status === 'done')) {
      return
    }
    let newOutFormat = videos[id].outFilePath
    newOutFormat = newOutFormat.split('.')
    newOutFormat[newOutFormat.length - 1] = format
    newOutFormat = newOutFormat.join('.')
    setVideos((prev) => ({
      ...prev,
      [id]: { ...prev[id], outFilePath: newOutFormat }
    }))
  }

  return (
    <>
      <main className="w-screen relative flex flex-col gap-10 h-screen max-w-3xl mx-auto text-text-1 p-4">
        {formatError && (
          <div className="fixed left-3 top-3 right-3 bottom-3 bg-transparent rounded-lg ring-2 ring-red-500 pointer-events-none z-20" />
        )}
        {finished.length > 0 && (
          <button
            onClick={resetFinished}
            className="absolute hover:ring-2 ring-gray-2 left-4 top-4 p-2 bg-gray-3 cursor-pointer z-10 transition-all rounded-full"
          >
            <FaUndo />
          </button>
        )}
        <form
          onSubmit={submitForm}
          className={`transition-all
        ${Object.keys(videos).length > 0 ? 'translate-y-0' : 'translate-y-[calc(50svh-100%)]'}
       flex flex-col gap-6 items-center`}
        >
          <button
            onClick={selectVideo}
            className="hover:ring-4 ring-gray-2 transition-all flex items-center gap-2 p-3 rounded-lg bg-gray-3 w-fit"
            type="button"
          >
            {isLoading ? (
              <>
                صبر کنید
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-text-1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </>
            ) : (
              <>
                ویدیو خود را اضافه کنید
                <FaPlus className="text-text-1" />
              </>
            )}
          </button>
        </form>
        <section className="p-2 overflow-y-auto max-h-[70svh]">
          <div className="flex flex-col gap-5">
            {Object.keys(videos).map((videoKey) => {
              const videoItem = videos[videoKey]
              let extFile = videoItem.outFilePath.split('.')

              extFile = extFile[extFile.length - 1]

              return (
                <div
                  className={`border-gray-3 relative rounded-xl border-2 p-2 ${videoItem.status === 'done' ? 'opacity-50' : ''}`}
                  key={videoKey}
                >
                  {videoItem.status === 'done' && (
                    <div
                      onClick={() => openIdDir(videoKey)}
                      className="absolute w-full h-full left-0 top-0 cursor-pointer"
                    ></div>
                  )}
                  <div className="flex">
                    <div className="thumbnail border-l border-gray-1 border-solid p-2">
                      <img
                        className="aspect-video rounded-lg min-w-32 object-cover max-h-32"
                        src={videoItem.thumbnail}
                        alt=""
                      />
                    </div>
                    <div className="flex-auto flex flex-col justify-between overflow-hidden p-2">
                      <div className="flex gap-2 p-2">
                        <span className="text-white-mute font-light min-w-fit">
                          نام/آدرس ویدیو:
                        </span>
                        <span className="truncate">{videoItem.filePath}</span>
                      </div>
                      <div
                        className="flex gap-2 cursor-pointer hover:ring-2 transition-all rounded p-2"
                        onClick={() => selectVideoOutPathAndName(videoKey)}
                      >
                        <span className="text-white-mute font-light min-w-fit">
                          نام/آدرس خروجی:
                        </span>
                        <span className="truncate">{videoItem.outFilePath}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t p-2 border-gray-1 border-solid space-y-4">
                    <h6>تنظیمات:</h6>
                    <div className="flex items-center justify-between gap-5">
                      <div className="flex gap-2 items-center">
                        <span>ضریب نرخ ثابت(CRF):</span>
                        <input
                          placeholder="1 تا 51"
                          onChange={(e) => CRFinputChange(e, videoKey)}
                          className={
                            videoItem.crf === ''
                              ? 'ring-red-400 outline-none border-none bg-transparent ring-2 p-1 rounded w-20 text-center'
                              : videoItem.crf > 17 && videoItem.crf < 29
                                ? 'ring-green-400 outline-none border-none bg-transparent ring-2 p-1 rounded w-20 text-center'
                                : 'outline-none border-none bg-transparent ring-2 p-1 rounded w-20 text-center'
                          }
                          type="text"
                          value={videoItem.crf}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span>فرمت خروجی:</span>
                        <div className="flex items-center gap-1 [&>.active]:opacity-100 [&>.active]:ring-2">
                          <button
                            onClick={() => {
                              setFormat(videoKey, 'mp4')
                            }}
                            type="button"
                            className={`px-2 opacity-60 hover:ring-2 transition-all py-1 bg-black rounded-md ${extFile === 'mp4' ? 'active' : ''}`}
                          >
                            MP4
                          </button>
                          <button
                            onClick={() => {
                              setFormat(videoKey, 'mkv')
                            }}
                            type="button"
                            className={`px-2 opacity-60 hover:ring-2 transition-all py-1 bg-black rounded-md ${extFile === 'mkv' ? 'active' : ''}`}
                          >
                            MKV
                          </button>
                        </div>
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
