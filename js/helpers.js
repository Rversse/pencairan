function formatRupiah(number) {
  const value = Number(number)

  if (!value) {
    return '-'
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',

    currency: 'IDR',

    maximumFractionDigits: 0
  }).format(value)
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
