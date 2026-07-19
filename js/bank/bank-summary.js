let bankAccounts = []

let currentBankSummary = []

let currentBankIncomes = []

let currentBankExpenses = []

function renderBankTransactionSummary(accounts, incomes, expenses) {
  const summary = accounts
    .filter((account) => {
      return (
        account.income_suppliers?.owner_name &&
        account.bank &&
        account.account_number &&
        account.account_number !== '-'
      )
    })
    .map((account) => {
      const accountIncome = incomes.filter(
        (item) => item.account_id === account.id
      )

      const accountExpense = expenses.filter(
        (item) => item.account_id === account.id
      )

      const income = accountIncome.reduce(
        (t, item) => t + Number(item.amount),
        0
      )

      const expense = accountExpense.reduce(
        (t, item) => t + Number(item.transfer_amount) + Number(item.admin_fee),
        0
      )

      const balance = income - expense

      return {
        accountId: account.id,
        ownerName: account.income_suppliers.owner_name,
        rekening: `${account.bank} • ${getLastFiveDigits(
          account.account_number
        )}`,
        income,
        expense,
        balance,
        historyCount: accountExpense.length
      }
    })
    .sort((a, b) => a.ownerName.localeCompare(b.ownerName))

  currentBankSummary = summary

  const keyword = bankSearch?.value.trim().toLowerCase() ?? ''

  const filteredSummary = summary.filter((item) => {
    if (!keyword) return true

    return (
      item.ownerName.toLowerCase().includes(keyword) ||
      item.rekening.toLowerCase().includes(keyword)
    )
  })

  const totalIncome = filteredSummary.reduce((t, x) => t + x.income, 0)

  const totalExpense = filteredSummary.reduce((t, x) => t + x.expense, 0)

  const totalBalance = filteredSummary.reduce((t, x) => t + x.balance, 0)

  bankTransactionTableContainer.innerHTML = `
<div class="dashboard bank-summary-cards">

  <div class="dashboard-card bank-summary-card">
    <div class="dashboard-card-top">
      <div>
        <small>Total Masuk</small>
        <h2>${formatRupiah(totalIncome)}</h2>
      </div>
      <div class="dashboard-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
          <path d="M12 19V5M5 12l7-7 7 7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>

  <div class="dashboard-card bank-summary-card">
    <div class="dashboard-card-top">
      <div>
        <small>Total Keluar</small>
        <h2>${formatRupiah(totalExpense)}</h2>
      </div>
      <div class="dashboard-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2">
          <path d="M12 5v14M5 12l7 7 7-7" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
  </div>

  <div class="dashboard-card bank-summary-card">
    <div class="dashboard-card-top">
      <div>
        <small>Total Saldo</small>
        <h2>${formatRupiah(totalBalance)}</h2>
      </div>
      <div class="dashboard-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M2 10h20" stroke-linecap="round"/>
        </svg>
      </div>
    </div>
  </div>

</div>

    <table class="table">

      <thead>

        <tr>

          <th style="width:34%">Rekening</th>
          <th class="text-end">Masuk</th>
          <th class="text-end">Keluar</th>
          <th class="text-end">Saldo</th>
          <th class="text-center" style="width:90px">Aksi</th>

        </tr>

      </thead>

      <tbody>

      ${filteredSummary
        .map((item) => {
          const balanceClass =
            item.balance > 0
              ? 'positive'
              : item.balance < 0
                ? 'negative'
                : 'zero'

          return `
            <tr class="bank-row">

              <td>

                <div class="bank-owner">
                  ${item.ownerName}
                </div>

                <div class="bank-account">
                  ${item.rekening}
                </div>

              </td>

              <td class="text-end bank-income">
                ${formatRupiah(item.income)}
              </td>

              <td class="text-end bank-expense">
                ${formatRupiah(item.expense)}
              </td>

              <td class="text-end bank-balance ${balanceClass}">
                ${formatRupiah(item.balance)}
              </td>

              <td class="text-center">

                <button
                  class="bank-history-button"
                  data-account-id="${item.accountId}"
                  title="Lihat History"
                >
                  📊 ${item.historyCount}
                </button>

              </td>

            </tr>
          `
        })
        .join('')}

      </tbody>

    </table>
  `

  bankTransactionTableContainer
    .querySelectorAll('.bank-history-button')
    .forEach((button) => {
      button.addEventListener('click', () => {
        openBankHistory(button.dataset.accountId)
      })
    })
}

function populateBankAccountDropdown() {
  bankAccountSelect.innerHTML = `
    <option value="">
      Pilih Pengirim
    </option>
  `

  bankAccounts.forEach((account) => {
    if (
      !account.income_suppliers?.owner_name ||
      !account.account_number ||
      account.account_number === '-'
    ) {
      return
    }

    const income = currentBankIncomes
      .filter((item) => item.account_id === account.id)
      .reduce((t, item) => t + Number(item.amount), 0)

    const expense = currentBankExpenses
      .filter((item) => item.account_id === account.id)
      .reduce(
        (t, item) => t + Number(item.transfer_amount) + Number(item.admin_fee),
        0
      )

    const saldo = income - expense

    bankAccountSelect.insertAdjacentHTML(
      'beforeend',
      `
      <option value="${account.id}">
        ${account.income_suppliers.owner_name}
        • ${account.bank}
        • ${getLastFiveDigits(account.account_number)}
        • ${formatRupiah(saldo)}
      </option>
    `
    )
  })
}

function getLastFiveDigits(accountNumber) {
  const digits = String(accountNumber ?? '').replace(/\D/g, '')

  if (!digits) return 'Belum diisi'

  return `•••••${digits.slice(-5)}`
}

bankSearch?.addEventListener('input', () => {
  renderBankTransactionSummary(
    bankAccounts,
    currentBankIncomes,
    currentBankExpenses
  )
})
