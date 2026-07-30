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

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value)

  return `${formatDateShort(date)} • ${date
    .toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta'
    })
    .replace(/\./g, ':')}`
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

async function fetchAllTransactions({ startDate, endDate, select }) {
  const transactions = []

  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabaseClient
      .from('transactions')
      .select(select)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', {
        ascending: true
      })
      .range(from, from + pageSize - 1)

    if (error) {
      throw error
    }

    transactions.push(...data)

    if (data.length < pageSize) {
      break
    }

    from += pageSize
  }

  return transactions
}
