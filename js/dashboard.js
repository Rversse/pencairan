async function loadDashboard() {
  let summaryQuery = supabaseClient.from('transactions').select(`
    *,
    kitchens (
      name
    ),
    suppliers (
      name
    )
  `)

  if (filterKitchen.value) {
    summaryQuery = summaryQuery.eq('kitchen_id', filterKitchen.value)
  }

  if (window.currentUser?.role === 'viewer') {
    summaryQuery = summaryQuery.in('flow_type', ['expense', 'neutral'])
  } else {
    if (filterFlow.value) {
      summaryQuery = summaryQuery.eq('flow_type', filterFlow.value)
    }
  }

  const today = getTodayLocal()

  if (!dashboardStartDate.value) {
    dashboardStartDate.value = today
  }

  if (!dashboardEndDate.value) {
    dashboardEndDate.value = dashboardStartDate.value
  }

  summaryQuery = summaryQuery
    .gte('transaction_date', dashboardStartDate.value)
    .lte('transaction_date', dashboardEndDate.value)

  const { data: summaryData, error: summaryError } = await summaryQuery

  if (summaryError) {
    console.error(summaryError)

    return
  }

  const income = summaryData
    .filter((item) => item.flow_type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const expense = summaryData
    .filter((item) => item.flow_type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  const gas = summaryData
    .filter((item) => item.flow_type === 'neutral')
    .reduce((sum, item) => sum + Number(item.amount), 0)

  surplusAmount.textContent = income ? formatRupiah(income) : 'Rp 0'

  totalGas.textContent = gas ? formatRupiah(gas) : 'Rp 0'

  totalExpense.textContent = expense ? formatRupiah(expense) : 'Rp 0'
}

const DISBURSEMENT_ITEMS = 5

const DISBURSEMENT_DATE_KEY = 'disbursement_selected_date'

function getTodayLocal() {
  const today = new Date()

  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getLastFriday() {
  const date = new Date()

  const day = date.getDay()

  const diff = day >= 5 ? day - 5 : day + 2

  date.setDate(date.getDate() - diff)

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const dayOfMonth = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${dayOfMonth}`
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

  if (disbursementDate) {
    const savedDate = localStorage.getItem(DISBURSEMENT_DATE_KEY)

    disbursementDate.value = savedDate || getLastFriday()
  }
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

<td class="${progressClass}">
  ${progress === 100 ? '✓ Selesai' : `${progress}%`}
</td>

            </tr>
          `
  })
  .join('')}

    </tbody>

  </table>
  
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

  await renderSupplierSummary(data)

  await renderSupplierDailySummary(data)
}

async function renderSupplierSummary(data) {
  const latestTransaction = [...data].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )[0]

  const supplierSummary = document.getElementById('supplierSummary')

  if (!supplierSummary) {
    return
  }

  supplierSummary.innerHTML = `
    <div class="empty-state">
      Memuat data...
    </div>
  `

  if (!data.length) {
    supplierSummary.innerHTML = `
      <div class="empty-state">
        Belum ada transaksi
        pada periode ini
      </div>
    `

    return
  }

  const grouped = {}

  data.forEach((item) => {
    const kitchen = item.kitchens?.name || 'Tidak diketahui'

    const supplier = item.suppliers?.name || '-'

    if (!grouped[kitchen]) {
      grouped[kitchen] = {
        Arutala: 0,
        Sukalarang: 0,
        Aris: 0,
        Babinsa: 0,
        Gas: 0,
        Total: 0
      }
    }

    if (item.flow_type === 'expense') {
      if (supplier.includes('Arutala')) {
        grouped[kitchen].Arutala += Number(item.amount)
      }

      if (supplier.includes('Sukalarang')) {
        grouped[kitchen].Sukalarang += Number(item.amount)
      }

      if (supplier.includes('Aris')) {
        grouped[kitchen].Aris += Number(item.amount)
      }

      if (supplier.includes('Babinsa')) {
        grouped[kitchen].Babinsa += Number(item.amount)
      }

      grouped[kitchen].Total += Number(item.amount)
    }

    if (item.flow_type === 'neutral') {
      grouped[kitchen].Gas += Number(item.amount)
    }
  })

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

  const totals = {
    Arutala: 0,
    Sukalarang: 0,
    Aris: 0,
    Babinsa: 0,
    Gas: 0,
    Total: 0
  }

  Object.values(grouped).forEach((item) => {
    totals.Arutala += item.Arutala

    totals.Sukalarang += item.Sukalarang

    totals.Aris += item.Aris

    totals.Babinsa += item.Babinsa

    totals.Gas += item.Gas

    totals.Total += item.Total
  })

  supplierSummary.innerHTML = `
      <div class="supplier-summary-top">

        <h3>
          Rekap Supplier
        </h3>

        <span id="lastUpdated">

${
  latestTransaction
    ? `
      Update Data Terakhir :
      ${new Date(latestTransaction.transaction_date)
        .toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
        .replace(/\//g, '-')}

•

${new Date(latestTransaction.created_at)
  .toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta'
  })
  .replace(/\./g, ':')}
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
  `
}

async function renderSupplierDailySummary(data) {
  const container = document.getElementById('supplierDailySummary')

  if (!container) {
    return
  }

  const groupedByDate = {}

  data.forEach((item) => {
    const date = item.transaction_date

    if (!groupedByDate[date]) {
      groupedByDate[date] = []
    }

    groupedByDate[date].push(item)
  })

  const sortedDates = Object.keys(groupedByDate).sort()

  if (sortedDates.length <= 1) {
    container.innerHTML = ''

    return
  }

  let html = ''

  sortedDates.forEach((date) => {
    const items = groupedByDate[date]

    const grouped = {}

    items.forEach((item) => {
      const kitchen = item.kitchens?.name || 'Tidak diketahui'

      const supplier = item.suppliers?.name || '-'

      if (!grouped[kitchen]) {
        grouped[kitchen] = {
          Arutala: 0,
          Sukalarang: 0,
          Aris: 0,
          Babinsa: 0,
          Gas: 0,
          Total: 0
        }
      }

      if (item.flow_type === 'expense') {
        if (supplier.includes('Arutala')) {
          grouped[kitchen].Arutala += Number(item.amount)
        }

        if (supplier.includes('Sukalarang')) {
          grouped[kitchen].Sukalarang += Number(item.amount)
        }

        if (supplier.includes('Aris')) {
          grouped[kitchen].Aris += Number(item.amount)
        }

        if (supplier.includes('Babinsa')) {
          grouped[kitchen].Babinsa += Number(item.amount)
        }

        grouped[kitchen].Total += Number(item.amount)
      }

      if (item.flow_type === 'neutral') {
        grouped[kitchen].Gas += Number(item.amount)
      }
    })

    const totals = {
      Arutala: 0,
      Sukalarang: 0,
      Aris: 0,
      Babinsa: 0,
      Gas: 0,
      Total: 0
    }

    Object.values(grouped).forEach((item) => {
      totals.Arutala += item.Arutala

      totals.Sukalarang += item.Sukalarang

      totals.Aris += item.Aris

      totals.Babinsa += item.Babinsa

      totals.Gas += item.Gas

      totals.Total += item.Total
    })

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

              Detail Pengeluaran —
              ${new Date(date)
                .toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })
                .replace(/\//g, '-')}

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

  document.querySelectorAll('.daily-summary-toggle').forEach((button) => {
    button.addEventListener(
      'click',

      () => {
        const content = button.nextElementSibling

        const arrow = button.querySelector('.daily-arrow')

        content.classList.toggle('open')

        if (content.classList.contains('open')) {
          arrow.textContent = '▼'
        } else {
          arrow.textContent = '▶'
        }
      }
    )
  })
}

async function loadDailyStatus() {
  const dailyStatusList = document.getElementById('dailyStatusList')

  const dailyStatusSummary = document.getElementById('dailyStatusSummary')

  if (!dailyStatusList || !dailyStatusSummary) {
    return
  }

  const today = getTodayLocal()

  const selectedDate = filterDate?.value || today

  if (dailyStatusDate) {
    dailyStatusDate.textContent = new Date(selectedDate)
      .toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
      .replace(/\//g, '-')
  }

  const { data: kitchens } = await supabaseClient
    .from('kitchens')
    .select('id,name')
    .order('name')

  const { data: transactions } = await supabaseClient
    .from('transactions')
    .select(
      `
        kitchen_id,
        flow_type
      `
    )
    .eq('transaction_date', selectedDate)

  if (!kitchens || !transactions) {
    return
  }

  let green = 0
  let yellow = 0
  let red = 0

  let html = ''

  const statusRows = []

  kitchens.forEach((kitchen) => {
    const kitchenTransactions = transactions.filter(
      (item) => item.kitchen_id === kitchen.id
    )

    const hasIncome = kitchenTransactions.some(
      (item) => item.flow_type === 'income'
    )

    const hasExpense = kitchenTransactions.some(
      (item) => item.flow_type === 'expense'
    )

    const hasGas = kitchenTransactions.some(
      (item) => item.flow_type === 'neutral'
    )

    const needsGas = !['Sukaraja', 'Cihaur'].includes(kitchen.name)

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
  K${hasExpense ? '🟢' : '🔴'}
  G${hasGas ? '🟢' : '🔴'}
`
    } else {
      statusText = `
  B${hasIncome ? '🟢' : '🔴'}
  K${hasExpense ? '🟢' : '🔴'}
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

  dailyStatusSummary.innerHTML = `
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

dashboardStartDate?.addEventListener(
  'change',

  async () => {
    dashboardEndDate.value = dashboardStartDate.value

    await loadDashboard()

    await loadDailyStatus()
  }
)

supplierStartDate?.addEventListener(
  'change',

  async () => {
    supplierEndDate.value = supplierStartDate.value

    await loadSupplierReport()
  }
)

const dailyStatusSummary = document.getElementById('dailyStatusSummary')

const dailyStatusDate = document.getElementById('dailyStatusDate')

const dailyStatusPanel = document.getElementById('dailyStatusPanel')

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

const dashboardSection = document.getElementById('dashboardSection')

const disbursementDate = document.getElementById('disbursementDate')

const disbursementSection = document.getElementById('disbursementSection')

initializeDates()

const disbursementTab = document.getElementById('disbursementTab')

const supplierSection = document.getElementById('supplierSection')

const reportSection = document.getElementById('reportSection')

const reportTab = document.getElementById('reportTab')

const supplierReportTab = document.getElementById('supplierReportTab')

supplierReportTab?.addEventListener(
  'click',

  async (event) => {
    event.preventDefault()

    dashboardSection.style.display = 'none'

    supplierSection.style.display = 'block'

    reportSection.style.display = 'none'

    dashboardTab?.classList.remove('active')

    reportTab?.classList.remove('active')

    disbursementTab?.classList.remove('active')

    disbursementSection.style.display = 'none'

    supplierReportTab?.classList.add('active')

    await loadSupplierReport()
  }
)

disbursementDate?.addEventListener(
  'change',

  async () => {
    localStorage.setItem(DISBURSEMENT_DATE_KEY, disbursementDate.value)

    await loadDisbursementTable()
  }
)

disbursementTab?.addEventListener(
  'click',

  async (event) => {
    event.preventDefault()

    dashboardSection.style.display = 'none'

    supplierSection.style.display = 'none'

    reportSection.style.display = 'none'

    disbursementSection.style.display = 'block'

    dashboardTab?.classList.remove('active')

    supplierReportTab?.classList.remove('active')

    reportTab?.classList.remove('active')

    disbursementTab?.classList.add('active')

    await loadDisbursementTable()
  }
)

reportTab?.addEventListener(
  'click',

  (event) => {
    event.preventDefault()

    dashboardSection.style.display = 'none'

    supplierSection.style.display = 'none'

    reportSection.style.display = 'block'

    dashboardTab?.classList.remove('active')

    disbursementSection.style.display = 'none'

    supplierReportTab?.classList.remove('active')

    reportTab?.classList.add('active')
  }
)

const applySupplierFilter = document.getElementById('applySupplierFilter')

applySupplierFilter?.addEventListener(
  'click',

  async () => {
    await loadSupplierReport()
  }
)

const dashboardTab = document.getElementById('dashboardTab')

dashboardTab?.addEventListener(
  'click',

  (event) => {
    event.preventDefault()

    supplierSection.style.display = 'none'

    reportSection.style.display = 'none'

    disbursementSection.style.display = 'none'

    dashboardSection.style.display = 'block'

    supplierReportTab?.classList.remove('active')

    reportTab?.classList.remove('active')

    disbursementTab?.classList.remove('active')

    dashboardTab?.classList.add('active')
  }
)
