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
    operational: 0
  }

  surplusAmount.textContent = formatRupiah(summary.income)
  totalExpense.textContent = formatRupiah(summary.expense)
  totalOperational.textContent = formatRupiah(summary.operational)
}

// ============================================================
// EVENT LISTENERS
// ============================================================

async function refreshDashboardSummary() {
  await loadDashboard()
  await loadDailyStatus()
}

dashboardStartDate?.addEventListener(
  'change',

  async () => {
    dashboardEndDate.value = dashboardStartDate.value
    dashboardEndDate.min = dashboardStartDate.value

    await refreshDashboardSummary()
  }
)

dashboardEndDate?.addEventListener(
  'change',

  async () => {
    if (dashboardEndDate.value < dashboardStartDate.value) {
      dashboardEndDate.value = dashboardStartDate.value
    }

    await refreshDashboardSummary()
  }
)

// ============================================================
// INIT
// ============================================================

initializeDates()
