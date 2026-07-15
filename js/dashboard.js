// ============================================================
// DOM REFERENCES
// ============================================================

const dashboardSection = document.getElementById('dashboardSection')
const supplierSection = document.getElementById('supplierSection')
const supplierMasterSection = document.getElementById('supplierMasterSection')
const supplierMasterTable = document.getElementById('supplierMasterTable')
const supplierMasterSearch = document.getElementById('supplierMasterSearch')
const addSupplierButton = document.getElementById('addSupplierButton')
const reportSection = document.getElementById('reportSection')
const incomeSection = document.getElementById('incomeSection')
const disbursementSection = document.getElementById('disbursementSection')
const disbursementDate = document.getElementById('disbursementDate')

const dashboardTab = document.getElementById('dashboardTab')
const supplierMasterTab = document.getElementById('supplierMasterTab')
const supplierReportTab = document.getElementById('supplierReportTab')
const incomeReportTab = document.getElementById('incomeReportTab')
const reportTab = document.getElementById('reportTab')
const disbursementTab = document.getElementById('disbursementTab')

const applySupplierFilter = document.getElementById('applySupplierFilter')
const applyIncomeFilter = document.getElementById('applyIncomeFilter')

const dailyStatusSummary = document.getElementById('dailyStatusSummary')
const dailyStatusDate = document.getElementById('dailyStatusDate')
const dailyStatusPanel = document.getElementById('dailyStatusPanel')

const transactionFab = document.getElementById('openTransactionModal')

// ============================================================
// CONSTANTS
// ============================================================

const DISBURSEMENT_ITEMS = 5
const DISBURSEMENT_DATE_KEY = 'disbursement_selected_date'

// ============================================================
// HELPERS
// ============================================================

function getNearestFriday() {
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  const previousFriday = new Date(today)
  const nextFriday = new Date(today)

  const prevDiff =
    previousFriday.getDay() >= 5
      ? previousFriday.getDay() - 5
      : previousFriday.getDay() + 2

  previousFriday.setDate(previousFriday.getDate() - prevDiff)

  nextFriday.setDate(previousFriday.getDate() + 7)

  const diffPrev = Math.abs(today - previousFriday)
  const diffNext = Math.abs(nextFriday - today)

  const target = diffPrev <= diffNext ? previousFriday : nextFriday

  return [
    target.getFullYear(),
    String(target.getMonth() + 1).padStart(2, '0'),
    String(target.getDate()).padStart(2, '0')
  ].join('-')
}

function calculateDisbursementProgress(record) {
  if (!record) {
    return 0
  }

  const completed = [
    record.relawan,
    record.pic_sekolah,
    record.kader_posyandu,
    record.sewa_kendaraan,
    record.fasilitas_sppg
  ].filter(Boolean).length

  return Math.round((completed / DISBURSEMENT_ITEMS) * 100)
}

function getProgressClass(progress) {
  if (progress === 100) {
    return 'progress-complete'
  }

  if (progress >= 80) {
    return 'progress-high'
  }

  if (progress >= 40) {
    return 'progress-medium'
  }

  if (progress > 0) {
    return 'progress-low'
  }

  return 'progress-empty'
}

function isDisbursementLocked(checklistDate) {
  const selectedDate = new Date(checklistDate)

  const today = new Date()

  selectedDate.setHours(0, 0, 0, 0)

  today.setHours(0, 0, 0, 0)

  const diffDays = Math.floor((today - selectedDate) / (1000 * 60 * 60 * 24))

  return diffDays > 7
}

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

async function saveDisbursementCheckbox(kitchenId, field, value) {
  if (isDisbursementLocked(disbursementDate.value)) {
    return
  }

  const checklistDate = disbursementDate.value

  const { data: existingRow } = await supabaseClient
    .from('disbursement_checklists')
    .select('id')
    .eq('kitchen_id', kitchenId)
    .eq('checklist_date', checklistDate)
    .maybeSingle()

  if (existingRow) {
    await supabaseClient
      .from('disbursement_checklists')
      .update({
        [field]: value
      })
      .eq('id', existingRow.id)

    return
  }

  await supabaseClient.from('disbursement_checklists').insert({
    kitchen_id: kitchenId,

    checklist_date: checklistDate,

    relawan: false,

    pic_sekolah: false,

    kader_posyandu: false,

    sewa_kendaraan: false,

    fasilitas_sppg: false,

    [field]: value
  })
}

async function loadDisbursementTable() {
  const selectedDate = disbursementDate.value

  const isLocked = isDisbursementLocked(selectedDate)

  const container = document.getElementById('disbursementTable')

  if (!container) {
    return
  }

  const { data: kitchens, error } = await supabaseClient
    .from('kitchens')
    .select('id,name')
    .eq('include_disbursement', true)
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error(error)

    return
  }

  const { data: checklistRows, error: checklistError } = await supabaseClient
    .from('disbursement_checklists')
    .select('*')
    .eq('checklist_date', selectedDate)

  if (checklistError) {
    console.error(checklistError)
  }

  const checklistMap = new Map()

  ;(checklistRows || []).forEach((row) => {
    checklistMap.set(row.kitchen_id, row)
  })

  const summary = document.getElementById('disbursementSummary')

  let completedKitchens = 0

  let totalProgress = 0

  let notStartedCount = 0

  let inProgressCount = 0

  kitchens.forEach((kitchen) => {
    const record = checklistMap.get(kitchen.id)

    const progress = calculateDisbursementProgress(record)

    if (progress === 0) {
      notStartedCount++
    } else if (progress === 100) {
      completedKitchens++
    } else {
      inProgressCount++
    }

    totalProgress += progress
  })

  const overallProgress = kitchens.length
    ? Math.round(totalProgress / kitchens.length)
    : 0

  summary.innerHTML = `
<div class="disbursement-progress">

<strong>
  ${completedKitchens}
  /
  ${kitchens.length}
  Dapur Selesai
</strong>

<br>

<small>
  Progress:
  ${overallProgress}%
</small>

<br>
<br>

<div class="disbursement-status-summary">

  <small>
    🔴 ${notStartedCount}
  </small>

  <small>
    🟡 ${inProgressCount}
  </small>

  <small>
    🟢 ${completedKitchens}
  </small>

</div>

  ${
    isLocked
      ? `
        <br>
        <small class="lock-text">
          🔒 Data Terkunci
        </small>
      `
      : ''
  }

</div>
`

  container.innerHTML = `
<div class="supplier-summary">

  <table class="disbursement-table">

    <thead>
      <tr>
        <th>Dapur</th>
        <th>Relawan</th>
        <th>PIC Sekolah</th>
        <th>Kader Posyandu</th>
        <th>Sewa Kendaraan</th>
        <th>Fasilitas SPPG</th>
        <th>Progress</th>
      </tr>
    </thead>

    <tbody>

${kitchens
  .map((kitchen) => {
    const record = checklistMap.get(kitchen.id)

    const progress = calculateDisbursementProgress(record)

    const progressClass = getProgressClass(progress)

    return `
            <tr>

              <td>
                ${kitchen.name}
              </td>

<td>
<input
  type="checkbox"
  ${record?.relawan ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="relawan"
>
</td>

<td>
<input
  type="checkbox"
  ${record?.pic_sekolah ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="pic_sekolah"
>
</td>

<td>
<input
  type="checkbox"
  ${record?.kader_posyandu ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="kader_posyandu"
>
</td>

<td>
<input
  type="checkbox"
  ${record?.sewa_kendaraan ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="sewa_kendaraan"
>
</td>

<td>
<input
  type="checkbox"
  ${record?.fasilitas_sppg ? 'checked' : ''}
  ${isLocked ? 'disabled' : ''}
  data-kitchen="${kitchen.id}"
  data-field="fasilitas_sppg"
>
</td>

<td>
  <span class="progress-badge ${progressClass}">
    ${progress === 100 ? '✓ Selesai' : `${progress}%`}
  </span>
</td>

            </tr>
          `
  })
  .join('')}

    </tbody>

  </table>

  </div>
  
`

  container.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener(
      'change',

      async (event) => {
        const kitchenId = event.target.dataset.kitchen

        const field = event.target.dataset.field

        const value = event.target.checked

        await saveDisbursementCheckbox(kitchenId, field, value)

        await loadDisbursementTable()
      }
    )
  })
}

async function loadSupplierReport() {
  let query = supabaseClient.from('transactions').select(`
      *,
      kitchens (
        name
      ),
      suppliers (
        name
      )
    `)

  const today = getTodayLocal()

  if (!supplierStartDate.value) {
    supplierStartDate.value = today
  }

  if (!supplierEndDate.value) {
    supplierEndDate.value = supplierStartDate.value
  }

  query = query
    .gte('transaction_date', supplierStartDate.value)
    .lte('transaction_date', supplierEndDate.value)

  if (filterKitchen.value) {
    query = query.eq('kitchen_id', filterKitchen.value)
  }

  const { data, error } = await query

  if (error) {
    console.error(error)

    return
  }

  const reportData = buildSupplierData(data)

  await renderSupplierSummary(reportData)

  await renderSupplierDailySummary(reportData)
}

async function loadIncomeReport() {
  let query = supabaseClient
    .from('transactions')
    .select(
      `
  amount,
  created_at,
  transaction_date,
  accounts (
    name,
    bank,
    account_number,
    income_suppliers (
      owner_name
    )
  )
`
    )
    .eq('flow_type', 'income')

  const today = getTodayLocal()

  if (!incomeStartDate.value) {
    incomeStartDate.value = today
  }

  if (!incomeEndDate.value) {
    incomeEndDate.value = incomeStartDate.value
  }

  query = query
    .gte('transaction_date', incomeStartDate.value)
    .lte('transaction_date', incomeEndDate.value)

  const { data, error } = await query

  if (error) {
    console.error(error)
    return
  }

  const reportData = buildIncomeData(data)

  await renderIncomeSummary(reportData)

  await renderIncomeDailySummary(reportData)
}

function getLatestTransaction(data) {
  return data.reduce((latest, item) => {
    if (
      !latest ||
      Date.parse(item.created_at) > Date.parse(latest.created_at)
    ) {
      return item
    }

    return latest
  }, null)
}

function buildSupplierData(data) {
  const summaryTotals = {
    Arutala: 0,
    Sukalarang: 0,
    Aris: 0,
    Babinsa: 0,
    Gas: 0,
    Total: 0
  }

  const dailyTotals = {}

  const latestTransaction = getLatestTransaction(data)

  const summary = {}

  const daily = {}

  data.forEach((item) => {
    const kitchen = item.kitchens?.name || 'Tidak diketahui'

    const supplier = item.suppliers?.name || '-'

    const date = item.transaction_date

    if (!summary[kitchen]) {
      summary[kitchen] = {
        Arutala: 0,
        Sukalarang: 0,
        Aris: 0,
        Babinsa: 0,
        Gas: 0,
        Total: 0
      }
    }

    if (!daily[date]) {
      daily[date] = {}
    }

    if (!daily[date][kitchen]) {
      daily[date][kitchen] = {
        Arutala: 0,
        Sukalarang: 0,
        Aris: 0,
        Babinsa: 0,
        Gas: 0,
        Total: 0
      }
    }

    if (!dailyTotals[date]) {
      dailyTotals[date] = {
        Arutala: 0,
        Sukalarang: 0,
        Aris: 0,
        Babinsa: 0,
        Gas: 0,
        Total: 0
      }
    }

    const targetSummary = summary[kitchen]

    const targetDaily = daily[date][kitchen]

    if (item.flow_type === 'expense') {
      const amount = Number(item.amount)

      if (supplier.includes('Arutala')) {
        targetSummary.Arutala += amount
        summaryTotals.Arutala += amount
        dailyTotals[date].Arutala += amount
        targetDaily.Arutala += amount
      }

      if (supplier.includes('Sukalarang')) {
        targetSummary.Sukalarang += amount
        targetDaily.Sukalarang += amount
        summaryTotals.Sukalarang += amount
        dailyTotals[date].Sukalarang += amount
      }

      if (supplier.includes('Aris')) {
        targetSummary.Aris += amount
        targetDaily.Aris += amount
        summaryTotals.Aris += amount
        dailyTotals[date].Aris += amount
      }

      if (supplier.includes('Babinsa')) {
        targetSummary.Babinsa += amount
        targetDaily.Babinsa += amount
        summaryTotals.Babinsa += amount
        dailyTotals[date].Babinsa += amount
      }

      targetSummary.Total += amount
      targetDaily.Total += amount
      summaryTotals.Total += amount
      dailyTotals[date].Total += amount
    }

    if (item.flow_type === 'neutral') {
      const amount = Number(item.amount)

      targetSummary.Gas += amount
      targetDaily.Gas += amount
      summaryTotals.Gas += amount
      dailyTotals[date].Gas += amount
    }
  })

  return {
    latestTransaction,
    summary,
    daily,
    summaryTotals,
    dailyTotals
  }
}

async function renderSupplierSummary(reportData) {
  const latestTransaction = reportData.latestTransaction

  const grouped = reportData.summary

  let rows = ''

  Object.entries(grouped).forEach(([kitchen, values]) => {
    rows += `
          <tr>

            <td>
              ${kitchen}
            </td>

            <td>
              ${formatRupiah(values.Arutala)}
            </td>

            <td>
              ${formatRupiah(values.Sukalarang)}
            </td>

            <td>
              ${formatRupiah(values.Aris)}
            </td>

            <td>
              ${formatRupiah(values.Babinsa)}
            </td>

            <td>
              ${formatRupiah(values.Gas)}
            </td>

            <td>
              <strong>
                ${formatRupiah(values.Total)}
              </strong>
            </td>

          </tr>
        `
  })

  const totals = reportData.summaryTotals

  supplierSummary.innerHTML = `
      <div class="supplier-summary-top">

        <span id="lastUpdated">

${
  latestTransaction
    ? `
      Update Data Terakhir :
      ${formatDateID(latestTransaction.transaction_date)}

      •

      ${formatTimeID(latestTransaction.created_at)}
    `
    : 'Belum ada data'
}

        </span>

      </div>

      <table class="summary-table">

        <thead>

          <tr>

<th>DAPUR</th>
<th>ARUTALA</th>
<th>SUKALARANG</th>
<th>ARIS</th>
<th>BABINSA</th>
<th>GAS</th>
<th>TOTAL (TANPA GAS)</th>

          </tr>

        </thead>

        <tbody>

          ${rows}

          <tr class="summary-total-row">

            <td>

              <strong>
                GRAND TOTAL
              </strong>

            </td>

            <td>

              <strong>
                ${formatRupiah(totals.Arutala)}
              </strong>

            </td>

            <td>

              <strong>
                ${formatRupiah(totals.Sukalarang)}
              </strong>

            </td>

            <td>

              <strong>
                ${formatRupiah(totals.Aris)}
              </strong>

            </td>

            <td>

              <strong>
                ${formatRupiah(totals.Babinsa)}
              </strong>

            </td>

            <td>

              <strong>
                ${formatRupiah(totals.Gas)}
              </strong>

            </td>

            <td>

              <strong>
                ${formatRupiah(totals.Total)}
              </strong>

            </td>

          </tr>

        </tbody>

      </table>

    </div>
  `
}

async function renderSupplierDailySummary(reportData) {
  const container = document.getElementById('supplierDailySummary')

  if (!container) {
    return
  }

  const groupedByDate = reportData.daily

  const sortedDates = Object.keys(groupedByDate).sort()

  if (sortedDates.length <= 1) {
    container.innerHTML = ''

    return
  }

  let html = ''

  sortedDates.forEach((date) => {
    const grouped = groupedByDate[date]

    const totals = reportData.dailyTotals[date]

    let rows = ''

    Object.entries(grouped).forEach(([kitchen, values]) => {
      rows += `
              <tr>

                <td>
                  ${kitchen}
                </td>

                <td>
                  ${formatRupiah(values.Arutala)}
                </td>

                <td>
                  ${formatRupiah(values.Sukalarang)}
                </td>

                <td>
                  ${formatRupiah(values.Aris)}
                </td>

                <td>
                  ${formatRupiah(values.Babinsa)}
                </td>

                <td>
                  ${formatRupiah(values.Gas)}
                </td>

                <td>
                  <strong>
                    ${formatRupiah(values.Total)}
                  </strong>
                </td>

              </tr>
            `
    })

    html += `
        <div class="daily-summary-group">

          <button
            class="daily-summary-toggle"
          >

            <span>

              Detail Pengeluaran •
${formatDateID(date)}

            </span>

            <span class="daily-arrow">
              ▶
            </span>

          </button>

          <div
            class="daily-summary-content"
          >

            <table
              class="summary-table"
            >

              <thead>

                <tr>

<th>DAPUR</th>
<th>ARUTALA</th>
<th>SUKALARANG</th>
<th>ARIS</th>
<th>BABINSA</th>
<th>GAS</th>
<th>TOTAL</th>

                </tr>

              </thead>

              <tbody>

                ${rows}

                <tr class="summary-total-row">

                  <td>

                    <strong>
                      GRAND TOTAL
                    </strong>

                  </td>

                  <td>

                    <strong>
                      ${formatRupiah(totals.Arutala)}
                    </strong>

                  </td>

                  <td>

                    <strong>
                      ${formatRupiah(totals.Sukalarang)}
                    </strong>

                  </td>

                  <td>

                    <strong>
                      ${formatRupiah(totals.Aris)}
                    </strong>

                  </td>

                  <td>

                    <strong>
                      ${formatRupiah(totals.Babinsa)}
                    </strong>

                  </td>

                  <td>

                    <strong>
                      ${formatRupiah(totals.Gas)}
                    </strong>

                  </td>

                  <td>

                    <strong>
                      ${formatRupiah(totals.Total)}
                    </strong>

                  </td>

                </tr>

              </tbody>

            </table>

          </div>

        </div>
      `
  })

  container.innerHTML = html

  container.onclick = (event) => {
    const button = event.target.closest('.daily-summary-toggle')

    if (!button) return

    const content = button.nextElementSibling

    const arrow = button.querySelector('.daily-arrow')

    content.classList.toggle('open')

    arrow.textContent = content.classList.contains('open') ? '▼' : '▶'
  }
}

function buildIncomeData(data) {
  const latestTransaction = getLatestTransaction(data)

  const summary = {}
  const daily = {}

  let grandTotal = 0

  data.forEach((item) => {
    const amount = Number(item.amount || 0)

    const supplierName = item.accounts?.name ?? '-'
    const ownerName = item.accounts?.income_suppliers?.owner_name ?? '-'

    const bank = item.accounts
      ? `${item.accounts.bank} - ${item.accounts.account_number ?? '-'}`
      : '-'

    const key = `${supplierName}|${ownerName}|${bank}`

    if (!summary[key]) {
      summary[key] = {
        supplierName,
        ownerName,
        bank,
        total: 0
      }
    }

    summary[key].total += amount

    if (!daily[key]) {
      daily[key] = {
        supplierName,
        ownerName,
        bank,
        total: 0,
        dates: {}
      }
    }

    daily[key].total += amount

    if (!daily[key].dates[item.transaction_date]) {
      daily[key].dates[item.transaction_date] = 0
    }

    daily[key].dates[item.transaction_date] += amount

    grandTotal += amount
  })

  return {
    latestTransaction,
    summary,
    daily,
    grandTotal
  }
}

async function renderIncomeSummary(reportData) {
  const incomeSummary = document.getElementById('incomeSummary')

  if (!incomeSummary) return

  const latestTransaction = reportData.latestTransaction
  const grouped = reportData.summary
  const grandTotal = reportData.grandTotal

  if (!Object.keys(grouped).length) {
    incomeSummary.innerHTML = `
      <div class="empty-state">
        Belum ada transaksi
        pada periode ini
      </div>
    `
    return
  }

  let rows = ''

  Object.values(grouped)
    .sort((a, b) => a.supplierName.localeCompare(b.supplierName))
    .forEach((item) => {
      rows += `
        <tr>

          <td>${item.supplierName}</td>

          <td>${item.ownerName}</td>

          <td>${item.bank}</td>

          <td>${formatRupiah(item.total)}</td>

        </tr>
      `
    })

  incomeSummary.innerHTML = `
<div class="supplier-summary-top">

  <span id="lastUpdated">

${
  latestTransaction
    ? `
      Update Data Terakhir :
      ${formatDateID(latestTransaction.transaction_date)}

      •

      ${formatTimeID(latestTransaction.created_at)}
    `
    : 'Belum ada data'
}

  </span>

</div>

<table class="summary-table">

  <thead>

    <tr>

      <th>NAMA SUPPLIER</th>
      <th>NAMA PEMILIK</th>
      <th>REKENING BANK</th>
      <th>TOTAL</th>

    </tr>

  </thead>

  <tbody>

    ${rows}

    <tr class="summary-total-row">

      <td colspan="3">

        <strong>
          GRAND TOTAL
        </strong>

      </td>

      <td>

        <strong>
          ${formatRupiah(grandTotal)}
        </strong>

      </td>

    </tr>

  </tbody>

</table>
`
}

async function renderIncomeDailySummary(reportData) {
  const container = document.getElementById('incomeDailySummary')

  if (!container) return

  const suppliers = Object.values(reportData.daily).sort((a, b) =>
    a.supplierName.localeCompare(b.supplierName)
  )

  const start = incomeStartDate.value
  const end = incomeEndDate.value

  if (start && end && start === end) {
    container.innerHTML = ''
    return
  }

  if (!suppliers.length) {
    container.innerHTML = ''
    return
  }

  let html = ''

  suppliers.forEach((supplier) => {
    const rows = Object.entries(supplier.dates)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(
        ([date, total]) => `
<tr>

  <td>
    ${formatDateID(date)}
  </td>

  <td>
    <strong>
      ${formatRupiah(total)}
    </strong>
  </td>

</tr>
`
      )
      .join('')

    html += `
<div class="daily-summary-group">

  <button
    class="daily-summary-toggle"
  >

<span>

  <strong>
    ${supplier.supplierName}
  </strong>

  &nbsp;•&nbsp;

  ${supplier.ownerName}

  &nbsp;•&nbsp;

  <small>
    ${supplier.bank}
  </small>

</span>

    <span>

      <strong>
        ${formatRupiah(supplier.total)}
      </strong>

      &nbsp;

      <span class="daily-arrow">
        ▶
      </span>

    </span>

  </button>

  <div
    class="daily-summary-content"
  >

    <table
      class="summary-table"
    >

      <thead>

        <tr>

          <th>TANGGAL</th>

          <th>TOTAL</th>

        </tr>

      </thead>

      <tbody>

        ${rows}

      </tbody>

    </table>

  </div>

</div>
`
  })

  container.innerHTML = html

  container.onclick = (event) => {
    const button = event.target.closest('.daily-summary-toggle')

    if (!button) return

    const content = button.nextElementSibling

    const arrow = button.querySelector('.daily-arrow')

    content.classList.toggle('open')

    arrow.textContent = content.classList.contains('open') ? '▼' : '▶'
  }
}

async function loadDailyStatus() {
  const dailyStatusList = document.getElementById('dailyStatusList')

  const dailyStatusSummaryEl = document.getElementById('dailyStatusSummary')

  if (!dailyStatusList || !dailyStatusSummaryEl) {
    return
  }

  const today = getTodayLocal()

  const selectedDate = filterDate?.value || today

  if (dailyStatusDate) {
    dailyStatusDate.textContent = formatDateID(selectedDate)
  }

  const [{ data: kitchens }, { data: transactions }] = await Promise.all([
    supabaseClient
      .from('kitchens')
      .select('id,name')
      .eq('is_active', true)
      .order('name'),

    supabaseClient
      .from('transactions')
      .select('kitchen_id,flow_type')
      .eq('transaction_date', selectedDate)
  ])

  const transactionMap = new Map()

  transactions.forEach((item) => {
    if (!transactionMap.has(item.kitchen_id)) {
      transactionMap.set(item.kitchen_id, [])
    }

    transactionMap.get(item.kitchen_id).push(item)
  })

  if (!kitchens || !transactions) {
    return
  }

  let green = 0
  let yellow = 0
  let red = 0

  let html = ''

  const statusRows = []

  kitchens.forEach((kitchen) => {
    const kitchenTransactions = transactionMap.get(kitchen.id) ?? []

    const needsGas = !['Sukaraja', 'Cihaur'].includes(kitchen.name)

    let hasIncome = false
    let hasExpense = false
    let hasGas = false

    for (const item of kitchenTransactions) {
      if (item.flow_type === 'income') hasIncome = true
      else if (item.flow_type === 'expense') hasExpense = true
      else if (item.flow_type === 'neutral') hasGas = true

      if (hasIncome && hasExpense && (needsGas ? hasGas : true)) {
        break
      }
    }

    let completed = 0
    let required = needsGas ? 3 : 2

    if (hasIncome) completed++
    if (hasExpense) completed++
    if (needsGas && hasGas) completed++

    let icon = ''
    let cssClass = ''

    if (completed === required) {
      green++
      icon = '🟢'
      cssClass = 'daily-status-green'
    } else if (completed === 0) {
      red++
      icon = '🔴'
      cssClass = 'daily-status-red'
    } else {
      yellow++
      icon = '🟡'
      cssClass = 'daily-status-yellow'
    }

    let statusText = ''

    if (needsGas) {
      statusText = `
  B${hasIncome ? '🟢' : '🔴'}
  S${hasExpense ? '🟢' : '🔴'}
  G${hasGas ? '🟢' : '🔴'}
`
    } else {
      statusText = `
  B${hasIncome ? '🟢' : '🔴'}
  S${hasExpense ? '🟢' : '🔴'}
`
    }

    statusRows.push({
      priority: completed === required ? 2 : completed === 0 ? 0 : 1,

      html: `
    <div
      class="daily-status-row ${cssClass}"
    >
      <span class="daily-kitchen-name">
        ${icon}
        ${kitchen.name}
      </span>

      <span class="daily-kitchen-status">
        ${statusText}
      </span>
    </div>
  `
    })
  })

  statusRows.sort((a, b) => a.priority - b.priority)

  html = statusRows.map((item) => item.html).join('')

  dailyStatusSummaryEl.innerHTML = `
  <div class="status-trigger">
    ❯
  </div>

  <div class="status-hover">
    <div class="status-item">
      <span class="green-dot"></span>
      <span>${green}</span>
    </div>

    <div class="status-item">
      <span class="yellow-dot"></span>
      <span>${yellow}</span>
    </div>

    <div class="status-item">
      <span class="red-dot"></span>
      <span>${red}</span>
    </div>
  </div>
`

  dailyStatusList.innerHTML = html
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

document.querySelectorAll('.nav-dropdown-toggle').forEach((button) => {
  button.addEventListener('click', (e) => {
    e.stopPropagation()

    const dropdown = button.parentElement

    document.querySelectorAll('.nav-dropdown').forEach((item) => {
      if (item !== dropdown) {
        item.classList.remove('open')
      }
    })

    dropdown.classList.toggle('open')
  })
})

document.addEventListener('click', () => {
  document.querySelectorAll('.nav-dropdown').forEach((item) => {
    item.classList.remove('open')
  })
})

document.querySelectorAll('.nav-dropdown-menu .nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav-dropdown').forEach((item) => {
      item.classList.remove('open')
    })
  })
})

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return

  document.querySelectorAll('.nav-dropdown').forEach((item) => {
    item.classList.remove('open')
  })
})

supplierStartDate?.addEventListener(
  'change',

  async () => {
    supplierEndDate.value = supplierStartDate.value

    await loadSupplierReport()
  }
)

incomeStartDate?.addEventListener(
  'change',

  async () => {
    incomeEndDate.value = incomeStartDate.value

    await loadIncomeReport()
  }
)

dailyStatusSummary?.addEventListener(
  'click',

  (event) => {
    event.stopPropagation()

    const isHidden = dailyStatusPanel.style.display === 'none'

    if (isHidden) {
      dailyStatusPanel.style.display = 'block'

      requestAnimationFrame(() => {
        dailyStatusPanel.classList.add('open')
      })

      dailyStatusSummary.style.display = 'none'
    } else {
      dailyStatusPanel.classList.remove('open')

      setTimeout(() => {
        dailyStatusPanel.style.display = 'none'
      }, 200)

      dailyStatusSummary.style.display = 'flex'
    }
  }
)

document.addEventListener(
  'click',

  (event) => {
    const widget = document.getElementById('dailyStatusWidget')

    if (widget && !widget.contains(event.target)) {
      dailyStatusPanel.style.display = 'none'

      dailyStatusSummary.style.display = 'flex'
    }
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

disbursementDate?.addEventListener('change', async () => {
  if (disbursementDate.value) {
    localStorage.setItem(DISBURSEMENT_DATE_KEY, disbursementDate.value)
  }

  await loadDisbursementTable()
})

disbursementTab?.addEventListener('click', async (event) => {
  if (currentUser?.role === 'viewer') return

  event.preventDefault()

  hideAllSections()
  resetActiveTabs()

  disbursementSection.style.display = 'block'
  disbursementTab.classList.add('active')

  updateActiveDropdown()

  await loadDisbursementTable()
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

applyIncomeFilter?.addEventListener('click', async () => {
  await loadIncomeReport()
})

applySupplierFilter?.addEventListener('click', async () => {
  await loadSupplierReport()
})

// ============================================================
// INIT
// ============================================================

initializeDates()

updateActiveDropdown()
