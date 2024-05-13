const information = document.getElementById('info')
information.innerText = `This app is using Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), and Electron (v${window.versions.electron()})`



const func = async ()=>{
    alert("helo")
    const title = document.getElementById("title").value
    const response = await window.versions.setTitle(title)
}

const setTitleButton = document.getElementById("setTitle")
setTitleButton.addEventListener("click",func)