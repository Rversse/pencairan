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

  async function fetchAllTransactions({ startDate, endDate, select }) {
    const transactions = []

    let from = 0

    const pageSize = 1000

    while (true) {
      const { data, error } = await supabaseClient
        .from('transactions')
        .select(select)
        .gte('transaction_date', startDate)
        .lte('transaction_date', endDate)
        .order('transaction_date', {
          ascending: true
        })
        .range(from, from + pageSize - 1)

      if (error) {
        throw error
      }

      transactions.push(...data)

      if (data.length < pageSize) {
        break
      }

      from += pageSize
    }

    return transactions
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

  exportExcelButton?.addEventListener(
    'click',

    async () => {
      await exportPelaporanExcel()
    }
  )

  const EXPORT_LAYOUT = {
    Sukaraja: [
      'ARUTALA BRI',
      'KPWS BRI',
      'CV KRAMAT BNI',
      'KOPERASI ARUTALA',
      'KOPERASI SUKALARANG',
      'ARIS',
      'BABINSA'
    ],

    Cihaur: [
      'ARUTALA BRI',
      'CV KRAMAT BNI',
      'UMKM BAROKAH BNI',
      'UD BERKAH MANDIRI BNI',
      'DENISH FRESH CHICKEN BNI',
      'RR JAYA BROILER BNI',
      'RPU NUGRAHA BROILER BNI',
      'KOPERASI ARUTALA'
    ],

    Cibaregbeg: [
      'ARUTALA BNI',
      'CV KRAMAT BNI',
      'UMKM BAROKAH BNI',
      'UD BERKAH MANDIRI BNI',
      'DENISH FRESH CHICKEN BNI',
      'RR JAYA BROILER BNI',
      'RPU NUGRAHA BROILER BNI',
      'KOPERASI ARUTALA'
    ],

    Warungbitung: [
      'ARUTALA BNI',
      'CV KRAMAT BNI',
      'UD BERKAH MANDIRI BNI',
      'IMAM NUGROHO BCA',
      'TOKO SEMBAKO BERKAH BNI',
      'KOPERASI ARUTALA'
    ],

    Campakamulya: [
      'ARUTALA BNI',
      'CV KRAMAT BNI',
      'ASEP RIDWAN BJB',
      'UMKM SUMBER SEGAR BRI',
      'UMKM SUMBER MAKMUR MANDIRI',
      'UMKM TEMPE JAYA MANDIRI BRI',
      'KOPERASI ARUTALA'
    ],

    Kertajadi: [
      'ARUTALA BNI',
      'CV KRAMAT BNI',
      'ITIKURIH BRI',
      'PABRIK TAHU CIOGONG 2 BRI',
      'TOKO FAUZAN DAGING FRESH BNI',
      'UMKM BERKAH AMANAH BRI',
      'UMKM MAJU JAYA BRI',
      'UMKM MITRA BAROKAH BJB',
      'UMKM PURWANTI BRI',
      'UMKM SABILULUNGAN BJB',
      'UMKM SEGAR MAKMUR BRI',
      'UMKM SIMPANG RASA BNI',
      'UMKM SUMBER SEGAR BJB',
      'WARUNG SEMBAKO SERBA ADA BJB',
      'KOPERASI ARUTALA'
    ],

    Cisepat: [
      'ARUTALA BNI',
      'CV KRAMAT BNI',
      'ITIKURIH BRI',
      'PABRIK TAHU CIOGONG 2 BRI',
      'TOKO FAUZAN DAGING FRESH BNI',
      'UMKM BERKAH AMANAH BRI',
      'UMKM MAJU JAYA BRI',
      'UMKM MITRA BAROKAH BJB',
      'UMKM PURWANTI BRI',
      'UMKM SABILULUNGAN BJB',
      'UMKM SEGAR MAKMUR BRI',
      'UMKM SIMPANG RASA BNI',
      'UMKM SUMBER SEGAR BJB',
      'WARUNG SEMBAKO SERBA ADA BJB',
      'KOPERASI ARUTALA'
    ],

    Cipetir: [
      'ARUTALA BNI',
      'CV KRAMAT BNI',
      'UMKM BAROKAH BNI',
      'UD BERKAH MANDIRI BNI',
      'DENISH FRESH CHICKEN BNI',
      'RR JAYA BROILER BNI',
      'RPU NUGRAHA BROILER BNI',
      'KOPERASI ARUTALA'
    ],

    Cimanggu: [
      'ARUTALA BNI',
      'CV KRAMAT BNI',
      'UMKM BAROKAH BNI',
      'UD BERKAH MANDIRI BNI',
      'DENISH FRESH CHICKEN BNI',
      'RR JAYA BROILER BNI',
      'RPU NUGRAHA BROILER BNI',
      'KOPERASI ARUTALA'
    ],

    Cikondang: [
      'ARUTALA BNI',
      'CV KRAMAT BNI',
      'UMKM BAROKAH BNI',
      'UD BERKAH MANDIRI BNI',
      'DENISH FRESH CHICKEN BNI',
      'RR JAYA BROILER BNI',
      'RPU NUGRAHA BROILER BNI',
      'KOPERASI ARUTALA'
    ],

    Ciranca: ['ARUTALA BNI', 'CV KRAMAT BNI', 'KOPERASI ARUTALA']
  }

  function buildWorksheets(sheetData, detailRows, exportLayout) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

    const detailWorksheet = XLSX.utils.aoa_to_sheet(detailRows)

    Object.keys(worksheet).forEach((cell) => {
      if (cell.startsWith('!')) {
        return
      }

      const value = worksheet[cell]?.v

      if (typeof value === 'number') {
        worksheet[cell].z = '#,##0'
      }
    })

    worksheet['!merges'] = []

    worksheet['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 1, c: 0 }
    })

    let currentCol = 1

    Object.entries(exportLayout).forEach(([, columns]) => {
      const startCol = currentCol
      const endCol = currentCol + columns.length - 1

      if (columns.length > 1) {
        worksheet['!merges'].push({
          s: {
            r: 0,
            c: startCol
          },
          e: {
            r: 0,
            c: endCol
          }
        })
      }

      currentCol = endCol + 1
    })

    worksheet['!cols'] = sheetData[0].map((_, colIndex) => {
      let maxLength = 15

      sheetData.forEach((row) => {
        const value = row[colIndex]

        if (value !== undefined && value !== null) {
          maxLength = Math.max(maxLength, String(value).length + 2)
        }
      })

      return {
        wch: Math.min(maxLength, 25)
      }
    })

    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pelaporan')

    XLSX.utils.book_append_sheet(workbook, detailWorksheet, 'Detail Transaksi')

    worksheet['!freeze'] = {
      xSplit: 1,
      ySplit: 2
    }

    return {
      worksheet,
      detailWorksheet,
      workbook
    }
  }

  function buildExportFileName(
    selectedKitchen,
    selectedFlowType,
    startDate,
    endDate
  ) {
    const kitchenPart = selectedKitchen
      ? selectedKitchen.name.toLowerCase().replace(/\s+/g, '-')
      : 'semua'

    const flowLabelMap = {
      income: 'bgn',
      expense: 'supplier',
      neutral: 'gas'
    }

    const flowPart = flowLabelMap[selectedFlowType] || 'semua'

    return `pelaporan-${kitchenPart}-${flowPart}-${startDate}-${endDate}.xlsx`
  }

  function fillPivotRows(
    transactions,
    pivotMap,
    kitchenMap,
    accountMap,
    supplierMap
  ) {
    transactions.forEach((transaction) => {
      const row = pivotMap.get(transaction.transaction_date)

      if (!row) return

      const kitchen = kitchenMap.get(transaction.kitchen_id)

      if (!kitchen) return

      const amount = Number(transaction.amount) || 0

      let columnName = null

      if (transaction.flow_type === 'income') {
        const account = accountMap.get(transaction.account_id)

        if (!account) return

        columnName = `${account.name} ${account.bank}`
      }

      if (transaction.flow_type === 'expense') {
        const supplier = supplierMap.get(transaction.supplier_id)

        if (!supplier) return

        if (supplier.name === 'Koperasi Arutala') {
          columnName = 'KOPERASI ARUTALA'
        }

        if (supplier.name === 'Sukalarang') {
          columnName = 'KOPERASI SUKALARANG'
        }

        if (supplier.name === 'Aris') {
          columnName = 'ARIS'
        }

        if (supplier.name === 'Babinsa') {
          columnName = 'BABINSA'
        }
      }

      if (!columnName) return

      const key = `${kitchen.name}|${columnName}`

      if (row[key] === undefined) return

      row[key] += amount
    })
  }

  function buildDetailRows(transactions, kitchenMap, accountMap, supplierMap) {
    const detailRows = [['Tanggal', 'Dapur', 'Jenis', 'Nama', 'Nominal']]

    transactions.forEach((transaction) => {
      const kitchen = kitchenMap.get(transaction.kitchen_id)

      if (!kitchen) return

      let name = '-'

      if (transaction.flow_type === 'income') {
        const account = accountMap.get(transaction.account_id)

        if (account) {
          name = `${account.name} ${account.bank || ''}`.trim()
        }
      }

      if (transaction.flow_type === 'expense') {
        const supplier = supplierMap.get(transaction.supplier_id)

        if (supplier) {
          name = supplier.name
        }
      }

      detailRows.push([
        transaction.transaction_date,
        kitchen.name,
        transaction.flow_type,
        name,
        Number(transaction.amount) || 0
      ])
    })

    return detailRows
  }

  async function exportPelaporanExcel() {
    const startDate = document.getElementById('startDate').value

    const endDate = document.getElementById('endDate').value

    const selectedKitchenId = exportKitchen.value

    const selectedFlowType = exportFlowType.value

    let transactions = []

    try {
      transactions = await fetchAllTransactions({
        startDate,
        endDate,
        select: `
      transaction_date,
      kitchen_id,
      account_id,
      supplier_id,
      flow_type,
      amount
    `
      })
    } catch (error) {
      console.error(error)

      return
    }

    if (selectedKitchenId) {
      transactions = transactions.filter(
        (transaction) => transaction.kitchen_id === selectedKitchenId
      )
    }

    if (selectedFlowType) {
      transactions = transactions.filter(
        (transaction) => transaction.flow_type === selectedFlowType
      )
    }

    const { data: kitchens } = await supabaseClient
      .from('kitchens')
      .select('id,name')
      .eq('is_active', true)

    const { data: accounts } = await supabaseClient
      .from('accounts')
      .select('id,name,bank')
      .eq('is_active', true)

    const { data: suppliers } = await supabaseClient
      .from('suppliers')
      .select('id,name')
      .eq('is_active', true)

    const selectedKitchen =
      kitchens.find((k) => k.id === selectedKitchenId) || null

    const kitchenMap = new Map(kitchens.map((item) => [item.id, item]))

    const accountMap = new Map(accounts.map((item) => [item.id, item]))

    const supplierMap = new Map(suppliers.map((item) => [item.id, item]))

    let exportLayout = EXPORT_LAYOUT

    if (selectedKitchen) {
      const layout = EXPORT_LAYOUT[selectedKitchen.name]

      if (layout) {
        exportLayout = {
          [selectedKitchen.name]: layout
        }
      }
    }

    function buildHeaders(exportLayout) {
      const headerRow1 = ['Tanggal']
      const headerRow2 = ['']

      Object.entries(exportLayout).forEach(([kitchenName, columns]) => {
        columns.forEach(() => {
          headerRow1.push(kitchenName)
        })

        headerRow2.push(...columns)
      })

      return {
        headerRow1,
        headerRow2
      }
    }

    function buildPivotRows(transactions, exportLayout) {
      const uniqueDates = [
        ...new Set(
          transactions.map((transaction) => transaction.transaction_date)
        )
      ].sort()

      const pivotRows = uniqueDates.map((date) => {
        const row = {
          Tanggal: date
        }

        Object.entries(exportLayout).forEach(([kitchenName, columns]) => {
          columns.forEach((column) => {
            row[`${kitchenName}|${column}`] = 0
          })
        })

        return row
      })

      const pivotMap = new Map()

      pivotRows.forEach((row) => {
        pivotMap.set(row.Tanggal, row)
      })
      return {
        pivotRows,
        pivotMap
      }
    }

    const { headerRow1, headerRow2 } = buildHeaders(exportLayout)

    const { pivotRows, pivotMap } = buildPivotRows(transactions, exportLayout)

    fillPivotRows(transactions, pivotMap, kitchenMap, accountMap, supplierMap)

    const sheetData = [headerRow1, headerRow2]

    const detailRows = buildDetailRows(
      transactions,
      kitchenMap,
      accountMap,
      supplierMap
    )

    pivotRows.forEach((row) => {
      const sheetRow = [row.Tanggal]

      Object.entries(exportLayout).forEach(([kitchenName, columns]) => {
        columns.forEach((column) => {
          const value = row[`${kitchenName}|${column}`]

          sheetRow.push(value === 0 ? '-' : value)
        })
      })

      sheetData.push(sheetRow)
    })

    const totalRow = ['TOTAL']

    Object.entries(exportLayout).forEach(([kitchenName, columns]) => {
      columns.forEach((column) => {
        let total = 0

        pivotRows.forEach((row) => {
          total += Number(row[`${kitchenName}|${column}`]) || 0
        })

        totalRow.push(total)
      })
    })

    sheetData.push(totalRow)

    // ======================
    // BUILD WORKSHEETS
    // ======================

    const { worksheet, detailWorksheet, workbook } = buildWorksheets(
      sheetData,
      detailRows,
      exportLayout
    )

    const fileName = buildExportFileName(
      selectedKitchen,
      selectedFlowType,
      startDate,
      endDate
    )

    XLSX.writeFile(workbook, fileName)
  }
})()
