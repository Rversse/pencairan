// ======================
// FORMATTERS
// ======================

function formatRupiah(number) {
  if (
    number === null ||
    number === undefined ||
    number === '' ||
    Number.isNaN(Number(number))
  ) {
    return '-'
  }

  return `Rp. ${Number(number).toLocaleString('id-ID')}`
}

function formatDateShort(date) {
  return new Date(date)
    .toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
    .replace(/\//g, '-')
}

function formatDateLong(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatTime(date) {
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

function parseNumber(value) {
  return Number(String(value ?? '').replace(/\D/g, '')) || 0
}

// ======================
// DATE
// ======================

function getTodayLocal() {
  const now = new Date()

  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0')
  ].join('-')
}

// ======================
// AUTH
// ======================

const resetInactivityTimer = (() => {
  let inactivityTimer

  return function () {
    clearTimeout(inactivityTimer)

    inactivityTimer = setTimeout(
      async () => {
        await supabaseClient.auth.signOut()

        window.location.href = 'login.html'
      },
      30 * 60 * 1000
    )
  }
})()

// ======================
// TRANSACTION
// ======================

function isTransactionLocked() {
  // TODO: implement lock period
  return false
}
