async function loadReportTransactions(startDate, endDate) {
  let data = []

  try {
    data = await fetchAllTransactions({
      startDate,
      endDate,
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
    return null
  }

  return data
}

function hasTransaction(data) {
  return data.income > 0 || data.expense > 0 || data.operational > 0
}

function buildGroupedData(kitchens, data) {
  const grouped = {}
  const dailyGrouped = {}

  kitchens.forEach((kitchen) => {
    grouped[kitchen.id] = {
      kitchen_name: kitchen.name,
      total_pm: kitchen.total_pm || 0,
      income: 0,
      expense: 0,
      operational: 0
    }

    dailyGrouped[kitchen.id] = {}
  })

  data.forEach((transaction) => {
    const kitchen = transaction.kitchens
    const amount = Number(transaction.amount) || 0

    if (!kitchen) return

    const date = transaction.transaction_date

    if (!dailyGrouped[kitchen.id][date]) {
      dailyGrouped[kitchen.id][date] = {
        income: 0,
        expense: 0,
        operational: 0
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
      grouped[kitchen.id].operational += amount
      dailyGrouped[kitchen.id][date].operational += amount
    }
  })

  return {
    grouped,
    dailyGrouped
  }
}

function renderSummaryTable(grouped) {
  let grandIncome = 0
  let grandExpense = 0
  let grandOperational = 0
  let grandRemaining = 0

  let tableHtml = ''

  Object.values(grouped)
    .sort((a, b) => {
      const activeA = hasTransaction(a)
      const activeB = hasTransaction(b)

      if (!activeA && activeB) return 1
      if (!activeB && activeA) return -1

      const remainingA = a.income - a.expense
      const remainingB = b.income - b.expense

      return remainingA - remainingB
    })
    .forEach((item) => {
      const remaining = item.income - item.expense

      grandIncome += item.income
      grandExpense += item.expense
      grandOperational += item.operational
      grandRemaining += remaining

      tableHtml += `
      <tr>
        <td>${item.kitchen_name}</td>
        <td>${item.total_pm.toLocaleString('id-ID')}</td>
        <td>${formatRupiah(item.income)}</td>
        <td>${formatRupiah(item.expense)}</td>
        <td>${formatRupiah(item.operational)}</td>
        <td class="${remaining < 0 ? 'negative' : 'positive'}">
          ${formatRupiah(remaining)}
        </td>
      </tr>`
    })

  reportTableBody.innerHTML = tableHtml

  return {
    grandIncome,
    grandExpense,
    grandOperational,
    grandRemaining
  }
}

function updateSummaryCards(summary) {
  const { grandIncome, grandExpense, grandOperational, grandRemaining } =
    summary

  reportTotalIncome.textContent = formatRupiah(grandIncome)
  reportTotalExpense.textContent = formatRupiah(grandExpense)
  reportTotalOperational.textContent = formatRupiah(grandOperational)
  reportTotalRemaining.textContent = formatRupiah(grandRemaining)

  reportTotalRemaining
    .closest('.summary-card')
    .classList.toggle('is-negative', grandRemaining < 0)
}

function renderReportDetails(grouped, dailyGrouped) {
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
          <td>${formatRupiah(values.operational)}</td>
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
          <th>OPS</th>
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
}

async function generateReport() {
  if (!startDate.value || !endDate.value) {
    alert('Pilih tanggal')
    return
  }

  const data = await loadReportTransactions(startDate.value, endDate.value)

  if (!data) return

  const sameDate = startDate.value === endDate.value

  reportPeriod.textContent = sameDate
    ? formatDateLong(startDate.value)
    : `${formatDateLong(startDate.value)} — ${formatDateLong(endDate.value)}`

  const { data: kitchens, error } = await supabaseClient
    .from('kitchens')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error(error)
    return
  }

  const { grouped, dailyGrouped } = buildGroupedData(kitchens, data)

  const summary = renderSummaryTable(grouped)

  updateSummaryCards(summary)

  renderReportDetails(grouped, dailyGrouped)
}
