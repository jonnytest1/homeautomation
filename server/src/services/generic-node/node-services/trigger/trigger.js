


document.querySelector("button").addEventListener("click", () => {
  window.parent.postMessage(JSON.stringify({
    type: "change",
    data: `${Date.now()}`
  }))
})


//# sourceURL=content.trigger_script.js