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

  function hasTransaction(data) {
    return data.income > 0 || data.expense > 0 || data.gas > 0
  }

  loadKitchenOptions(exportKitchen)
  // ======================
  // PRINT
  // ======================

  function printReport() {
    const printContent = document.getElementById('reportSection').innerHTML

    const html = `
  <!DOCTYPE html>

  <html lang="id">

  <head>

    <meta charset="UTF-8">

    <title>
      Laporan Pencairan
    </title>

    <style>

    .report-filters,
#generateButton,
#printButton,
#exportExcelButton {
  display: none !important;
}

      * {

        box-sizing:
          border-box;

        margin: 0;

        padding: 0;
      }

      body {

        font-family:
          Arial,
          sans-serif;

        color: #18293F;

        padding: 22px 28px;

        font-size: 11px;

        background:
          white;
      }

      .filters,
      button {

        display:
          none !important;
      }

      #reportDetails {

  display:
    none !important;
}

      .container {

        width: 100%;
      }

      .topbar {

        display: flex;

        justify-content:
          space-between;

        align-items: flex-start;

        margin-bottom: 18px;

        border-bottom:
          2px solid #0D2137;

        padding-bottom:
          10px;
      }

      h1 {

        font-size: 20px;

        margin: 0;
      }

      #reportPeriod {

        font-size: 12px;

        color: #637A96;

        margin-top: 4px;
      }

      .summary-grid {

        display: grid;

        grid-template-columns:
          repeat(4, 1fr);

        gap: 12px;

        margin-bottom: 14px;
      }

.summary-card {
  background: #fff;

  border: 1.5px solid #d2daea;

  border-radius: 10px;

  padding: 14px 16px;
}

.summary-card:nth-child(1) {
  border-left: 5px solid #16a34a;
}

.summary-card:nth-child(2) {
  border-left: 5px solid #dc2626;
}

.summary-card:nth-child(3) {
  border-left: 5px solid #d97706;
}

.summary-card:nth-child(4) {
  border-left: 5px solid #2563eb;
}

.summary-card.is-negative {
  border-left-color: #dc2626 !important;
}

      .summary-card small {

        display: block;

        font-size: 10px;

        font-weight: bold;

        text-transform:
          uppercase;

        color: #637A96;

        margin-bottom: 4px;
      }

      .summary-card h2 {

        font-size: 18px;

        margin: 0;
      }

      table {

        width: 100%;

        border-collapse:
          collapse;

          line-height:
  1.4;
      }

      th {

        background:
          #ECF0F6;

        vertical-align:
  middle;

        color:
          #637A96;

        font-size:
          9px;

        text-transform:
          uppercase;

        padding:
          8px 10px;

        border-bottom:
          2px solid #D2DAEA;

        white-space:
          nowrap;
      }

    td {

    font-size:
        12px;

    padding:
        9px 10px;

    text-align:
        center;

    vertical-align:
        middle;

    border-bottom:
        1px solid #D2DAEA;
    }

      tfoot td {

        font-weight:
          bold;

        background:
          #ECF0F6;

        border-top:
          2px solid #D2DAEA;
      }

      .positive {

        color:
          #1DB96A;

        font-weight:
          bold;
      }

      .negative {

        color:
          #E8404A;

        font-weight:
          bold;
      }

    </style>

  </head>

<body>

  ${printContent}

  <div
    style="
      margin-top:18px;
      text-align:right;
      font-size:11px;
      color:#637A96;
    "
  >

    Dicetak:
${new Date()
  .toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
  .replace(/\./g, ':')
  .replace(/\//g, '-')}

  </div>

</body>

  </html>
  `

    const iframe = document.createElement('iframe')

    iframe.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      border: none;
      z-index: 99999;
      background: white;
    `

    document.body.appendChild(iframe)

    iframe.contentDocument.open()

    iframe.contentDocument.write(html)

    iframe.contentDocument.close()

    iframe.contentWindow.onafterprint = () => {
      document.body.removeChild(iframe)
    }

    setTimeout(() => {
      iframe.contentWindow.focus()

      iframe.contentWindow.print()
    }, 400)
  }

  printButton.addEventListener('click', printReport)

  // ======================
  // GENERATE REPORT
  // ======================

  generateButton.addEventListener('click', async () => {
    if (!startDate.value || !endDate.value) {
      alert('Pilih tanggal')

      return
    }

    const sameDate = startDate.value === endDate.value

    reportPeriod.textContent = sameDate
      ? formatDateLong(startDate.value)
      : `${formatDateLong(startDate.value)} — ${formatDateLong(endDate.value)}`

    let data = []

    try {
      data = await fetchAllTransactions({
        startDate: startDate.value,
        endDate: endDate.value,
        select: `
      *,
      kitchens (
        id,
        name,
        total_pm
      )
    `
      })
    } catch (error) {
      console.error(error)

      alert('Gagal generate laporan')

      return
    }

    const { data: kitchens, error: kitchensError } = await supabaseClient
      .from('kitchens')
      .select('*')
      .eq('is_active', true)
      .order('name')

    if (kitchensError) {
      console.error(kitchensError)

      return
    }

    const grouped = {}

    const dailyGrouped = {}

    // ======================
    // PREFILL ALL KITCHENS
    // ======================

    kitchens.forEach((kitchen) => {
      grouped[kitchen.id] = {
        kitchen_name: kitchen.name,

        total_pm: kitchen.total_pm || 0,

        income: 0,

        expense: 0,

        gas: 0
      }

      dailyGrouped[kitchen.id] = {}
    })

    // ======================
    // INJECT TRANSACTIONS
    // ======================

    data.forEach((transaction) => {
      const kitchen = transaction.kitchens

      const amount = Number(transaction.amount) || 0

      if (!kitchen) {
        return
      }

      const date = transaction.transaction_date

      if (!dailyGrouped[kitchen.id][date]) {
        dailyGrouped[kitchen.id][date] = {
          income: 0,
          expense: 0,
          gas: 0
        }
      }

      if (transaction.flow_type === 'income') {
        grouped[kitchen.id].income += amount

        dailyGrouped[kitchen.id][date].income += amount
      }

      if (transaction.flow_type === 'expense') {
        grouped[kitchen.id].expense += amount

        dailyGrouped[kitchen.id][date].expense += amount
      }

      if (transaction.flow_type === 'neutral') {
        grouped[kitchen.id].gas += amount

        dailyGrouped[kitchen.id][date].gas += amount
      }
    })

    let grandIncome = 0

    let grandExpense = 0

    let grandGas = 0

    let grandRemaining = 0

    let tableHtml = ''

    Object.values(grouped)
      .sort((a, b) => {
        const activeA = hasTransaction(a)

        const activeB = hasTransaction(b)

        // ======================
        // YANG TIDAK ADA
        // BELANJA/KOPERASI
        // KE BAWAH
        // ======================

        if (!activeA && activeB) {
          return 1
        }

        if (!activeB && activeA) {
          return -1
        }

        const remainingA = a.income - a.expense

        const remainingB = b.income - b.expense

        return remainingA - remainingB
      })

      .forEach((item) => {
        const remaining = item.income - item.expense

        grandIncome += item.income

        grandExpense += item.expense

        grandGas += item.gas

        grandRemaining += remaining

        tableHtml += `
          <tr>

            <td>
              ${item.kitchen_name}
            </td>

            <td>
              ${item.total_pm.toLocaleString('id-ID')}
            </td>

<td>
  ${formatRupiah(item.income)}
</td>

<td>
  ${formatRupiah(item.expense)}
</td>

<td>
  ${formatRupiah(item.gas)}
</td>

<td class="${remaining < 0 ? 'negative' : 'positive'}">
  ${formatRupiah(remaining)}
</td>

          </tr>
        `
      })

    reportTableBody.innerHTML = tableHtml

    reportTotalIncome.textContent = formatRupiah(grandIncome)

    reportTotalExpense.textContent = formatRupiah(grandExpense)

    reportTotalGas.textContent = formatRupiah(grandGas)

    reportTotalRemaining.textContent = formatRupiah(grandRemaining)

    const totalCard = reportTotalRemaining.closest('.summary-card')
    totalCard.classList.toggle('is-negative', grandRemaining < 0)

    let detailsHtml = ''

    Object.entries(grouped)
      .sort((a, b) => {
        const totalA = a[1].income - a[1].expense

        const totalB = b[1].income - b[1].expense

        return totalA - totalB
      })
      .forEach(([kitchenId, kitchen]) => {
        const dates = dailyGrouped[kitchenId]

        if (!hasTransaction(kitchen)) {
          return
        }

        if (Object.keys(dates).length === 0) {
          return
        }

        const rows = Object.entries(dates)
          .sort((a, b) => b[0].localeCompare(a[0]))
          .map(([date, values]) => {
            const remaining = values.income - values.expense

            return `
        <tr>
          <td>${date.split('-').reverse().join('-')}</td>
          <td>${formatRupiah(values.income)}</td>
          <td>${formatRupiah(values.expense)}</td>
          <td>${formatRupiah(values.gas)}</td>
          <td class="${remaining < 0 ? 'negative' : 'positive'}">
            ${formatRupiah(remaining)}
          </td>
        </tr>
      `
          })
          .join('')

        const remaining = kitchen.income - kitchen.expense

        detailsHtml += `
  <details style="
    margin-top:14px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
  ">
<summary
  style="
    list-style:none;
    cursor:pointer;
    font-weight:600;
    padding:16px 18px;
    background: var(--bg-soft);
  "
>
  <div style="display:flex; justify-content:space-between; align-items:center; gap:20px;">
    <span>${kitchen.kitchen_name}</span>
    <span style="color:${remaining < 0 ? 'var(--danger)' : 'var(--success)'};">
      ${formatRupiah(remaining)}
    </span>
  </div>
</summary>

  <div style="padding: 0 18px 18px;">
    <table class="summary-table" style="margin-top:14px">
      <thead>
        <tr>
          <th>Tanggal</th>
          <th>BGN</th>
          <th>Supplier</th>
          <th>Gas</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  </div>
</details>
`
      })

    reportDetails.innerHTML = detailsHtml
  })

  exportExcelButton?.addEventListener('click', exportPelaporanExcel)
})()
