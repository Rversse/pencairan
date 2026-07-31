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

const filterSupplier = document.getElementById('filterSupplier')

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

let dashboardRequestId = 0

async function loadDashboard() {
  const requestId = ++dashboardRequestId
  const today = getTodayLocal()

  if (!dashboardStartDate.value) {
    dashboardStartDate.value = today
  }

  if (!dashboardEndDate.value) {
    dashboardEndDate.value = dashboardStartDate.value
  }

  const flowTypes =
    window.currentUser?.role === 'viewer'
      ? ['expense', 'neutral']
      : filterFlow.value
        ? [filterFlow.value]
        : null

  const { data, error } = await supabaseClient.rpc('get_dashboard_summary', {
    start_date: dashboardStartDate.value,
    end_date: dashboardEndDate.value,
    kitchen_uuid: filterKitchen.value || null,
    flow_types: flowTypes,
    supplier_filter: filterSupplier.value || null
  })

  if (requestId !== dashboardRequestId) return

  if (error) {
    console.error(error)
    return
  }

  const { income = 0, expense = 0, operational = 0 } = data?.[0] ?? {}

  surplusAmount.textContent = formatRupiah(income)
  totalExpense.textContent = formatRupiah(expense)
  totalOperational.textContent = formatRupiah(operational)
}

async function populateSupplierFilter() {
  const selectedSupplier = filterSupplier.value

  // ======================
  // OPERASIONAL
  // ======================
  if (filterFlow.value === 'neutral') {
    filterSupplier.innerHTML =
      '<option value="">Tidak berlaku untuk Operasional</option>'
    filterSupplier.disabled = true
    return
  }

  filterSupplier.disabled = false

  // ======================
  // BELANJA SUPPLIER
  // ======================
  if (filterFlow.value === 'expense') {
    const selectedKitchen =
      filterKitchen.options[filterKitchen.selectedIndex]?.text || ''

    const isSukaraja = selectedKitchen.includes('Sukaraja')

    const suppliers =
      isSukaraja || !filterKitchen.value
        ? ['Koperasi Arutala', 'Sukalarang', 'Aris', 'Babinsa']
        : ['Koperasi Arutala']

    filterSupplier.innerHTML = '<option value="">Semua Supplier</option>'

    suppliers.forEach((supplier) => {
      const option = document.createElement('option')
      option.value = supplier
      option.textContent = supplier
      filterSupplier.appendChild(option)
    })

    if (!isSukaraja && filterKitchen.value) {
      filterSupplier.value = 'Koperasi Arutala'
      filterSupplier.disabled = true
    } else if (suppliers.includes(selectedSupplier)) {
      filterSupplier.value = selectedSupplier
    }

    return
  }

  // ======================
  // BELANJA BGN
  // ======================
  filterSupplier.innerHTML = '<option value="">Semua Supplier BGN</option>'

  let query = supabaseClient.from('transactions').select(`
    account_id,
    accounts!inner(
      id,
      name,
      bank,
      account_category
    )
  `)

  if (currentUser?.role === 'viewer') {
    query = query.eq('flow_type', 'expense')
  }

  if (filterKitchen.value) {
    query = query.eq('kitchen_id', filterKitchen.value)
  }

  if (filterFlow.value) {
    query = query.eq('flow_type', filterFlow.value)
  }

  const { data, error } = await query
    .gte('transaction_date', dashboardStartDate.value)
    .lte('transaction_date', dashboardEndDate.value)

  if (error) {
    console.error(error)
    return
  }

  const accounts = [
    ...new Map(
      (data || [])
        .map((row) => row.accounts)
        .filter((account) => account && account.account_category === 'supplier')
        .map((account) => [account.id, account])
    ).values()
  ].sort((a, b) =>
    `${a.name} - ${a.bank}`.localeCompare(`${b.name} - ${b.bank}`)
  )

  accounts.forEach((account) => {
    const option = document.createElement('option')
    option.value = account.id
    option.textContent = `${account.name} - ${account.bank}`
    filterSupplier.appendChild(option)
  })

  if (accounts.some((account) => account.id === selectedSupplier)) {
    filterSupplier.value = selectedSupplier
  }
}

async function refreshDashboardSummary() {
  await populateSupplierFilter()
  await loadDashboard()
  await loadDailyStatus()
  await loadTransactions()
}

// ============================================================
// EVENT LISTENERS
// ============================================================

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

filterKitchen?.addEventListener(
  'change',

  async () => {
    filterSupplier.value = ''

    await refreshDashboardSummary()
  }
)

filterFlow?.addEventListener(
  'change',

  async () => {
    await refreshDashboardSummary()
  }
)

filterSupplier?.addEventListener(
  'change',

  async () => {
    await loadDashboard()

    await loadTransactions(false)
  }
)

// ============================================================
// INIT
// ============================================================

initializeDates()
