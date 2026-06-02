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

  const today = new Date().toISOString().split('T')[0]

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

  const today = new Date().toISOString().split('T')[0]

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
        Barokah: 0,
        Sukalarang: 0,
        Aris: 0,
        Babinsa: 0,
        Gas: 0,
        Total: 0,
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

      if (supplier.includes('UMKM Barokah')) {
        grouped[kitchen].Barokah += Number(item.amount)
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
              ${formatRupiah(values.Barokah)}
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
    Barokah: 0,
    Sukalarang: 0,
    Aris: 0,
    Babinsa: 0,
    Gas: 0,
    Total: 0,
  }

  Object.values(grouped).forEach((item) => {
    totals.Arutala += item.Arutala

    totals.Barokah += item.Barokah

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
          year: 'numeric',
        })
        .replace(/\//g, '-')}

•

${new Date(latestTransaction.created_at)
  .toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
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
<th>UMKM BAROKAH</th>
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
                ${formatRupiah(totals.Barokah)}
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
          Barokah: 0,
          Sukalarang: 0,
          Aris: 0,
          Babinsa: 0,
          Gas: 0,
          Total: 0,
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

        if (supplier.includes('UMKM Barokah')) {
          grouped[kitchen].Barokah += Number(item.amount)
        }

        grouped[kitchen].Total += Number(item.amount)
      }

      if (item.flow_type === 'neutral') {
        grouped[kitchen].Gas += Number(item.amount)
      }
    })

    const totals = {
      Arutala: 0,
      Barokah: 0,
      Sukalarang: 0,
      Aris: 0,
      Babinsa: 0,
      Gas: 0,
      Total: 0,
    }

    Object.values(grouped).forEach((item) => {
      totals.Arutala += item.Arutala

      totals.Barokah += item.Barokah

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
                  ${formatRupiah(values.Barokah)}
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
                  year: 'numeric',
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
<th>UMKM BAROKAH</th>
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
                ${formatRupiah(totals.Barokah)}
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

  const today = new Date().toISOString().split('T')[0]

  const selectedDate = filterDate?.value || today

  if (dailyStatusDate) {
    dailyStatusDate.textContent = new Date(selectedDate)
      .toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
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
  `,
    })
  })

  statusRows.sort((a, b) => a.priority - b.priority)

  html = statusRows.map((item) => item.html).join('')

  dailyStatusSummary.innerHTML = `
  <div
    class="status-trigger"
    title="STATUS"
  >
    ❯
  </div>
`
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

const today = new Date().toISOString().split('T')[0]

dashboardStartDate.value = today
dashboardEndDate.value = today

supplierStartDate.value = today
supplierEndDate.value = today

const dashboardSection = document.getElementById('dashboardSection')

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

    supplierReportTab?.classList.add('active')

    await loadSupplierReport()
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

    dashboardSection.style.display = 'block'

    supplierReportTab?.classList.remove('active')

    reportTab?.classList.remove('active')

    dashboardTab?.classList.add('active')
  }
)
