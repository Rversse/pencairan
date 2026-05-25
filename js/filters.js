filterKitchen.addEventListener('change', async () => {
  transactionLimit = 5

  await loadTransactions()

  await loadDashboard()
})

filterFlow.addEventListener('change', async () => {
  transactionLimit = 5

  await loadTransactions()

  await loadDashboard()
})

filterDate.addEventListener('change', async () => {
  transactionLimit = 5

  await loadTransactions()

  await loadDashboard()
})

sortTransactions.addEventListener('change', async () => {
  transactionLimit = 5

  await loadTransactions()
})

resetFilters.addEventListener('click', async () => {
  filterKitchen.value = ''

  filterFlow.value = ''

  filterDate.value = ''

  sortTransactions.value = ''

  transactionLimit = 5

  await loadTransactions()

  await loadDashboard()
})
