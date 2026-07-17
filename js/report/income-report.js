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

function renderIncomeSummary(reportData) {
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
      ${formatDateShort(latestTransaction.transaction_date)}

      •

      ${formatTime(latestTransaction.created_at)}
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

function renderIncomeDailySummary(reportData) {
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
    ${formatDateShort(date)}
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

  renderIncomeSummary(reportData)

  renderIncomeDailySummary(reportData)
}

incomeStartDate?.addEventListener(
  'change',

  async () => {
    incomeEndDate.value = incomeStartDate.value

    await loadIncomeReport()
  }
)

applyIncomeFilter?.addEventListener('click', async () => {
  await loadIncomeReport()
})

incomeDailySummary?.addEventListener('click', (event) => {
  const button = event.target.closest('.daily-summary-toggle')

  if (!button) return

  const content = button.nextElementSibling
  const arrow = button.querySelector('.daily-arrow')

  content.classList.toggle('open')

  arrow.textContent = content.classList.contains('open') ? '▼' : '▶'
})
