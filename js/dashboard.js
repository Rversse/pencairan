async function loadDashboard() {
  if (currentUser.role === 'viewer') {
    viewerSummary.innerHTML = `
    <div class="empty-state">
      Memuat data...
    </div>
  `

    dailyViewerSummary.innerHTML = ''
  }

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
    .reduce(
      (sum, item) => sum + Number(item.amount),

      0
    )

  const expense = summaryData
    .filter((item) => item.flow_type === 'expense')
    .reduce(
      (sum, item) => sum + Number(item.amount),

      0
    )

  const gas = summaryData
    .filter((item) => item.flow_type === 'neutral')
    .reduce(
      (sum, item) => sum + Number(item.amount),

      0
    )

  surplusAmount.textContent = formatRupiah(income)

  totalGas.textContent = formatRupiah(gas)

  totalExpense.textContent = formatRupiah(expense)

  if (window.currentUser?.role === 'viewer') {
    await renderViewerSummary(summaryData, gas)

    await renderDailyViewerSummary(summaryData)
  }
}

async function renderViewerSummary(data, gas) {
  const latestTransaction = data?.[0]

  const viewerSummary = document.getElementById('viewerSummary')

  if (!viewerSummary) {
    return
  }

  viewerSummary.innerHTML = `
    <div class="empty-state">
      Memuat data...
    </div>
  `

  if (!data.length) {
    viewerSummary.innerHTML = `
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
    Total: 0,
  }

  Object.values(grouped).forEach((item) => {
    totals.Arutala += item.Arutala

    totals.Sukalarang += item.Sukalarang

    totals.Aris += item.Aris

    totals.Babinsa += item.Babinsa

    totals.Gas += item.Gas

    totals.Total += item.Total
  })

  viewerSummary.innerHTML = `
    <div class="viewer-summary">

      <div class="viewer-summary-top">

        <h3>
          Catatan Belanja Koperasi
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

async function renderDailyViewerSummary(data) {
  const container = document.getElementById('dailyViewerSummary')

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
      Total: 0,
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

                  <th>Dapur</th>

                  <th>Arutala</th>

                  <th>Sukalarang</th>

                  <th>Aris</th>

                  <th>Babinsa</th>

                  <th>Gas</th>

                  <th>Total</th>

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

dashboardStartDate?.addEventListener(
  'change',

  async () => {
    if (!dashboardEndDate.dataset.manual) {
      dashboardEndDate.value = dashboardStartDate.value
    }

    if (dashboardStartDate.value === dashboardEndDate.value) {
      delete dashboardEndDate.dataset.manual
    }

    await loadDashboard()
  }
)
