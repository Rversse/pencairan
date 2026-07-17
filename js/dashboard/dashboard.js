// ============================================================
// DOM REFERENCES
// ============================================================

const dashboardSection = document.getElementById('dashboardSection')
const supplierSection = document.getElementById('supplierSection')
const supplierMasterSection = document.getElementById('supplierMasterSection')

const reportSection = document.getElementById('reportSection')
const incomeSection = document.getElementById('incomeSection')
const disbursementSection = document.getElementById('disbursementSection')
const disbursementDate = document.getElementById('disbursementDate')

const dashboardTab = document.getElementById('dashboardTab')
const supplierMasterTab = document.getElementById('supplierMasterTab')
const supplierReportTab = document.getElementById('supplierReportTab')
const incomeReportTab = document.getElementById('incomeReportTab')
const reportTab = document.getElementById('reportTab')

const bankTransactionTab = document.getElementById('bankTransactionTab')
const bankTransactionSection = document.getElementById('bankTransactionSection')

const transactionFab = document.getElementById('openTransactionModal')

// ============================================================
// HELPERS
// ============================================================

function initializeDates() {
  const today = getTodayLocal()

  dashboardStartDate.value = today
  dashboardEndDate.value = today

  supplierStartDate.value = today
  supplierEndDate.value = today

  incomeStartDate.value = today
  incomeEndDate.value = today

  filterDate.value = today

  if (disbursementDate) {
    const savedDate = localStorage.getItem(DISBURSEMENT_DATE_KEY)

    const defaultFriday = getNearestFriday()

    if (!savedDate) {
      disbursementDate.value = defaultFriday
    } else {
      const saved = new Date(savedDate)
      const nearest = new Date(defaultFriday)

      const diffDays = Math.abs(saved - nearest) / (1000 * 60 * 60 * 24)

      disbursementDate.value = diffDays <= 7 ? savedDate : defaultFriday
    }
  }
}

function hideAllSections() {
  dashboardSection.style.display = 'none'

  supplierSection.style.display = 'none'

  supplierMasterSection.style.display = 'none'

  reportSection.style.display = 'none'

  kitchenMasterSection.style.display = 'none'

  disbursementSection.style.display = 'none'

  incomeSection.style.display = 'none'

  bankTransactionSection.style.display = 'none'

  transactionFab.style.display = 'none'
}

function resetActiveTabs() {
  document.querySelectorAll('.nav-link').forEach((link) => {
    link.classList.remove('active')
  })

  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    dropdown.classList.remove('active')
  })
}

function updateActiveDropdown() {
  document.querySelectorAll('.nav-dropdown').forEach((dropdown) => {
    const hasActive = dropdown.querySelector('.nav-link.active')

    dropdown.classList.toggle('active', !!hasActive)
  })
}

// ============================================================
// LOAD / RENDER FUNCTIONS
// ============================================================

async function loadDashboard() {
  const today = getTodayLocal()

  if (!dashboardStartDate.value) {
    dashboardStartDate.value = today
  }

  if (!dashboardEndDate.value) {
    dashboardEndDate.value = dashboardStartDate.value
  }

  const kitchenUuid = filterKitchen.value || null

  let flowTypes = null

  if (window.currentUser?.role === 'viewer') {
    flowTypes = ['expense', 'neutral']
  } else if (filterFlow.value) {
    flowTypes = [filterFlow.value]
  }

  const { data, error } = await supabaseClient.rpc('get_dashboard_summary', {
    start_date: dashboardStartDate.value,
    end_date: dashboardEndDate.value,
    kitchen_uuid: kitchenUuid,
    flow_types: flowTypes
  })

  if (error) {
    console.error(error)
    return
  }

  const summary = data?.[0] ?? {
    income: 0,
    expense: 0,
    gas: 0
  }

  surplusAmount.textContent = formatRupiah(summary.income)

  totalExpense.textContent = formatRupiah(summary.expense)

  totalGas.textContent = formatRupiah(summary.gas)
}

// ============================================================
// EVENT LISTENERS
// ============================================================

dashboardTab?.addEventListener('click', async (event) => {
  if (currentUser?.role === 'viewer') return

  event.preventDefault()

  hideAllSections()
  resetActiveTabs()

  dashboardSection.style.display = 'block'
  transactionFab.style.display = 'flex'

  dashboardTab.classList.add('active')

  updateActiveDropdown()

  await loadDashboard()
  await loadTransactions()
  await loadDailyStatus()
})

dashboardStartDate?.addEventListener(
  'change',

  async () => {
    dashboardEndDate.value = dashboardStartDate.value

    await loadDashboard()

    await loadDailyStatus()
  }
)

supplierMasterTab?.addEventListener('click', async (e) => {
  e.preventDefault()

  hideAllSections()
  resetActiveTabs()

  supplierMasterSection.style.display = 'block'
  supplierMasterTab.classList.add('active')

  updateActiveDropdown()

  await loadSupplierMaster()
})

supplierReportTab?.addEventListener('click', async (event) => {
  event.preventDefault()

  hideAllSections()
  resetActiveTabs()

  supplierSection.style.display = 'block'
  supplierReportTab.classList.add('active')

  updateActiveDropdown()

  await loadSupplierReport()
})

incomeReportTab?.addEventListener('click', async (event) => {
  event.preventDefault()

  hideAllSections()
  resetActiveTabs()

  incomeSection.style.display = 'block'
  incomeReportTab.classList.add('active')

  updateActiveDropdown()

  await loadIncomeReport()
})

reportTab?.addEventListener('click', (event) => {
  if (currentUser?.role === 'viewer') return

  event.preventDefault()

  hideAllSections()
  resetActiveTabs()

  reportSection.style.display = 'block'
  reportTab.classList.add('active')

  updateActiveDropdown()
})

bankTransactionTab?.addEventListener('click', async (event) => {
  event.preventDefault()

  hideAllSections()

  resetActiveTabs()

  bankTransactionTab.classList.add('active')

  updateActiveDropdown()

  bankTransactionSection.style.display = 'block'

  await loadBankTransactions()
})

// ============================================================
// INIT
// ============================================================

initializeDates()

updateActiveDropdown()
