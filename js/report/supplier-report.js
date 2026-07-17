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

function renderSupplierSummary(reportData) {
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

function renderSupplierDailySummary(reportData) {
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
${formatDateShort(date)}

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

  renderSupplierSummary(reportData)

  renderSupplierDailySummary(reportData)
}

supplierStartDate?.addEventListener(
  'change',

  async () => {
    supplierEndDate.value = supplierStartDate.value

    await loadSupplierReport()
  }
)

applySupplierFilter?.addEventListener('click', async () => {
  await loadSupplierReport()
})
