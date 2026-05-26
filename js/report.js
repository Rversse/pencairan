const startDate = document.getElementById('startDate')

const endDate = document.getElementById('endDate')

const generateButton = document.getElementById('generateButton')

const printButton = document.getElementById('printButton')

const reportPeriod = document.getElementById('reportPeriod')

const reportTableBody = document.getElementById('reportTableBody')

const totalIncome = document.getElementById('totalIncome')

const totalExpense = document.getElementById('totalExpense')

const totalGas = document.getElementById('totalGas')

const totalRemaining = document.getElementById('totalRemaining')

// ======================
// DEFAULT DATE
// ======================

const today = new Date().toISOString().split('T')[0]

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

function formatRupiah(number) {
  return `Rp. ${Number(number || 0).toLocaleString('id-ID')}`
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

// ======================
// PRINT
// ======================

function printReport() {
  const printContent = document.querySelector('.container').innerHTML

  const html = `
  <!DOCTYPE html>

  <html lang="id">

  <head>

    <meta charset="UTF-8">

    <title>
      Laporan Pencairan
    </title>

    <style>

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

        background:
          #ECF0F6;

        border-radius:
          8px;

        padding:
          14px 16px;
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
    minute: '2-digit',
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
    ? formatDate(startDate.value)
    : `
          ${formatDate(startDate.value)}
          —
          ${formatDate(endDate.value)}
        `

  let query = supabaseClient
    .from('transactions')
    .select(
      `
          *,
          kitchens (
            id,
            name,
            total_pm
          )
        `
    )
    .gte('transaction_date', startDate.value)
    .lte('transaction_date', endDate.value)

  if (window.currentUser?.role === 'viewer') {
    query = query
      .eq('flow_type', 'expense')
      .eq('supplier_id', '3e80a99f-a5af-499e-bad5-32cce54c7361')
  }

  const { data, error } = await query

  if (error) {
    console.error(error)

    alert('Gagal generate laporan')

    return
  }

  // lanjut bawahnya tetap 😭

  const { data: kitchens, error: kitchensError } = await supabaseClient
    .from('kitchens')
    .select('*')
    .order('name')

  if (kitchensError) {
    console.error(kitchensError)

    return
  }

  const grouped = {}

  // ======================
  // PREFILL ALL KITCHENS
  // ======================

  kitchens.forEach((kitchen) => {
    grouped[kitchen.id] = {
      kitchen_name: kitchen.name,

      total_pm: kitchen.total_pm || 0,

      income: 0,

      expense: 0,

      gas: 0,
    }
  })

  // ======================
  // INJECT TRANSACTIONS
  // ======================

  data.forEach((transaction) => {
    const kitchen = transaction.kitchens

    if (!kitchen) {
      return
    }

    if (transaction.flow_type === 'income') {
      grouped[kitchen.id].income += Number(transaction.amount)
    }

    if (transaction.flow_type === 'expense') {
      grouped[kitchen.id].expense += Number(transaction.amount)
    }

    if (transaction.flow_type === 'neutral') {
      grouped[kitchen.id].gas += Number(transaction.amount)
    }
  })

  reportTableBody.innerHTML = ''

  let grandIncome = 0

  let grandExpense = 0

  let grandGas = 0

  let grandRemaining = 0

  let grandPM = 0

  Object.values(grouped)
    .sort((a, b) => {
      const activeA = a.income > 0 || a.expense > 0

      const activeB = b.income > 0 || b.expense > 0

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

      grandPM += item.total_pm

      reportTableBody.innerHTML += `
          <tr>

            <td>
              ${item.kitchen_name}
            </td>

            <td>
              ${item.total_pm.toLocaleString('id-ID')}
            </td>

            <td>
              ${item.income ? formatRupiah(item.income) : '-'}
            </td>

            <td>
              ${item.expense ? formatRupiah(item.expense) : '-'}
            </td>

            <td>
              ${item.gas ? formatRupiah(item.gas) : '-'}
            </td>

<td class="${remaining < 0 ? 'negative' : 'positive'}">
  ${remaining ? formatRupiah(remaining) : '-'}
            </td>

          </tr>
        `
    })

  totalIncome.textContent = formatRupiah(grandIncome)

  totalExpense.textContent = formatRupiah(grandExpense)

  totalGas.textContent = formatRupiah(grandGas)

  totalRemaining.textContent = formatRupiah(grandRemaining)
})
