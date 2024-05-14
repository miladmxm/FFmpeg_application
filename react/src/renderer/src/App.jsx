import { useState } from 'react'

function App() {
  const [log, setLog] = useState('')
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  window.electron.ipcRenderer.on('path', (_, args) => {
    setLog(args)
  })

  function submitForm(e) {
    e.preventDefault()
    console.log(e)
  }
  return (
    <>
      <main className="w-screen  h-screen bg-black-soft text-text-1 p-4">
        <form onSubmit={submitForm}>
          <button type="button">ویدیو خود را انتخاب کنید</button>
          <input type="text" name="text" id="" />
          <button type="submit">submit</button>
        </form>
        <section className="border-2 rounded-xl border-gray-3">
          <ul className="flex flex-col">
            <li>fdsfsd</li>
            <li>fdsfsd</li>
            <li>fdsfsd</li>
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
