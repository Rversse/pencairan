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
  }
)

resetFilters.addEventListener(
  'click',

  async () => {
    filterKitchen.value = ''

    filterFlow.value = ''

    filterDate.value = ''

    transactionLimit = 5

    await loadTransactions()

    await loadDashboard()
  }
)
