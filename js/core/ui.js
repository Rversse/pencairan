const confirmModal = document.getElementById('confirmModal')

const confirmMessage = document.getElementById('confirmMessage')

const confirmOk = document.getElementById('confirmOk')

const confirmCancel = document.getElementById('confirmCancel')

const toast = document.getElementById('toast')

const showToast = (() => {
  let timer

  return function (message, type = 'success') {
    if (!toast) return

    toast.className = `toast ${type}`
    toast.textContent = message

    requestAnimationFrame(() => {
      toast.classList.add('show')
    })

    clearTimeout(timer)

    timer = setTimeout(() => {
      toast.classList.remove('show')
    }, 3000)
  }
})()

function showConfirm(message) {
  return new Promise((resolve) => {
    confirmMessage.textContent = message

    confirmModal.classList.remove('hidden')
    confirmModal.classList.add('show')

    const close = (result) => {
      confirmModal.classList.remove('show')

      confirmOk.onclick = null
      confirmCancel.onclick = null

      resolve(result)
    }

    confirmOk.onclick = () => close(true)

    confirmCancel.onclick = () => close(false)
  })
}
