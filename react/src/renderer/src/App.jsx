import { useState } from 'react'

function App() {
  const [log, setLog] = useState('')
  const [videos, setVideos] = useState({})
  console.log(videos)

  // const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  window.electron.ipcRenderer.on('path', (_, args) => {
    setLog(args)
  })

  window.electron.ipcRenderer.on('srcVideo', (_, args) => {
    setVideos((prev) => {
      return { ...prev, [args.id]: args.src }
    })
  })

  function submitForm(e) {
    e.preventDefault()
    console.log(e)
  }
  return (
    <>
      <main className="w-screen  flex flex-col gap-10 h-screen bg-black-soft text-text-1 p-4">
        <form onSubmit={submitForm} className="flex flex-col gap-6 items-center">
          <button className="p-3 rounded-lg bg-slate-600 w-fit" type="button">
            ویدیو خود را انتخاب کنید
          </button>
          <input className='bg-transparent' type="text" name="text" id="" />
          <button type="submit">submit</button>
        </form>
        <section className="border-2 rounded-xl border-gray-3">
          <ul className="flex flex-col">
            {Object.keys(videos).map((videoKey) => {
              const video = videos[videoKey]
              return (
                <li key={videoKey}>
                  <video controls>
                    <source src={video.src} />
                  </video>
                </li>
              )
            })}
          </ul>
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
