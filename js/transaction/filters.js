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

    if (filterDate.value) {
      dashboardStartDate.value = filterDate.value
      dashboardEndDate.value = filterDate.value
    }

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

    filterDate.value = getTodayLocal()

    dashboardStartDate.value = getTodayLocal()
    dashboardEndDate.value = getTodayLocal()

    transactionLimit = 5

    await loadTransactions()

    await loadDashboard()

    await loadDailyStatus()
  }
)
