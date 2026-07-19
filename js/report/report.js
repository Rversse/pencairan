;(() => {
  const startDate = document.getElementById('startDate')

  const endDate = document.getElementById('endDate')

  const exportKitchen = document.getElementById('exportKitchen')

  const exportFlowType = document.getElementById('exportFlowType')

  const generateButton = document.getElementById('generateButton')

  const printButton = document.getElementById('printButton')

  const reportPeriod = document.getElementById('reportPeriod')

  const reportTableBody = document.getElementById('reportTableBody')

  const reportDetails = document.getElementById('reportDetails')

  const reportTotalIncome = document.getElementById('reportTotalIncome')

  const reportTotalExpense = document.getElementById('reportTotalExpense')

  const reportTotalGas = document.getElementById('reportTotalGas')

  const reportTotalRemaining = document.getElementById('reportTotalRemaining')

  // ======================
  // DEFAULT DATE
  // ======================

  const today = getTodayLocal()

  startDate.value = today
  endDate.value = today

  startDate.addEventListener('change', () => {
    endDate.value = startDate.value
  })

  endDate.addEventListener('change', () => {
    if (endDate.value < startDate.value) {
      startDate.value = endDate.value
    }
  })

  // ======================
  // HELPERS
  // ======================

  loadKitchenOptions(exportKitchen)
  // ======================
  // PRINT
  // ======================

  printButton.addEventListener('click', printReport)

  // ======================
  // GENERATE REPORT
  // ======================

  exportExcelButton?.addEventListener('click', exportPelaporanExcel)
})()

generateButton.addEventListener('click', generateReport)
