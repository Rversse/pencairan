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

// ============================================================
// EVENT LISTENERS
// ============================================================

amountInput?.addEventListener('input', (event) => {
  const raw = event.target.value.replace(/\D/g, '')

  event.target.value = formatNumber(raw)
})

applyDashboardFilter?.addEventListener(
  'click',

  async () => {
    if (applyDashboardFilter.disabled) {
      return
    }

    applyDashboardFilter.disabled = true

    const originalText = applyDashboardFilter.textContent

    applyDashboardFilter.textContent = 'Loading...'

    try {
      await loadDashboard()

      await loadDailyStatus()
    } finally {
      applyDashboardFilter.disabled = false

      applyDashboardFilter.textContent = originalText
    }
  }
)

const logoutButton = document.getElementById('logoutButton')

logoutButton?.addEventListener('click', async () => {
  if (logoutButton.disabled) {
    return
  }

  logoutButton.disabled = true

  const originalText = logoutButton.textContent

  logoutButton.textContent = 'Logout...'

  try {
    const { error } = await supabaseClient.auth.signOut()

    if (error) {
      console.error(error)
      return
    }

    window.location.replace('login.html')
  } catch (error) {
    console.error(error)
  } finally {
    if (window.location.pathname.endsWith('login.html')) return

    logoutButton.disabled = false
    logoutButton.textContent = originalText
  }
})
