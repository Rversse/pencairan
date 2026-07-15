function formatRupiah(number) {
  const value = Number(number)

  if (Number.isNaN(value)) {
    return '-'
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(value)
}

function formatDateID(date) {
  return new Date(date)
    .toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    .replace(/\//g, '-')
}

function formatTimeID(date) {
  return new Date(date)
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta'
    })
    .replace(/\./g, ':')
}

function formatNumber(value) {
  return value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function setSelectValueByText(selectElement, text) {
  const option = [...selectElement.options].find((option) =>
    option.text.includes(text)
  )

  if (option) {
    selectElement.value = option.value
  }
}

function showToast(message) {
  const toast = document.getElementById('toast')

  toast.textContent = message

  toast.classList.add('show')

  clearTimeout(toast.timeout)

  toast.timeout = setTimeout(() => {
    toast.classList.remove('show')
  }, 2200)
}

function isTransactionLocked() {
  // TODO: implement lock period
  return false
}

let inactivityTimer

function resetInactivityTimer() {
  clearTimeout(inactivityTimer)

  inactivityTimer = setTimeout(
    async () => {
      await supabaseClient.auth.signOut()

      window.location.href = 'login.html'
    },

    30 * 60 * 1000
  )
}

function getTodayLocal() {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-')
}
