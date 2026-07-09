filterKitchen.addEventListener(
  'change',

  async () => {
    transactionLimit = 5

    await loadTransactions()

    await loadDashboard()
  }
)

filterFlow.addEventListener(
  'change',

  async () => {
    transactionLimit = 5

    await loadTransactions()

    await loadDashboard()
  }
)

filterDate.addEventListener(
  'change',

  async () => {
    transactionLimit = 5

    await loadTransactions()

    await loadDashboard()

    await loadDailyStatus()
  }
)

resetFilters.addEventListener(
  'click',

  async () => {
    filterKitchen.value = ''

    filterFlow.value = ''

    filterDate.value = getTodayLocal() // ← ganti dari '' jadi ini

    transactionLimit = 5

    await loadTransactions()

    await loadDashboard()

    await loadDailyStatus()
  }
)
