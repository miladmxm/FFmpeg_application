const btn = document.querySelector("#btn")

const func = async ()=>{
    const response = await window.actions.openFile()
    alert(response)
}

btn.addEventListener("click",func)