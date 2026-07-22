let bankAccounts = []

let currentBankSummary = []

let currentBankIncomes = []

let currentBankExpenses = []

function renderBankTransactionSummary(accounts, incomes, expenses) {
  const incomeMap = new Map()
  const expenseMap = new Map()

  const holdingAccounts = accounts.filter(
    (account) => account.account_category === 'holding'
  )

  const holdingAccount = holdingAccounts[0] ?? null

  for (const item of incomes) {
    incomeMap.set(
      item.account_id,
      (incomeMap.get(item.account_id) ?? 0) + Number(item.amount)
    )
  }

  for (const item of expenses) {
    const current = expenseMap.get(item.account_id) ?? {
      total: 0,
      count: 0
    }

    current.total += Number(item.transfer_amount) + Number(item.admin_fee)

    current.count++

    expenseMap.set(item.account_id, current)
  }

  let holdingIncome = 0
  let holdingExpense = 0

  for (const item of expenses) {
    if (item.transfer_type === 'holding') {
      holdingIncome += Number(item.transfer_amount)
    }

    if (holdingAccount && item.account_id === holdingAccount.id) {
      holdingExpense += Number(item.transfer_amount) + Number(item.admin_fee)
    }
  }

  const holdingOpeningBalance = Number(holdingAccount?.opening_balance) || 0

  const holdingBalance = holdingOpeningBalance + holdingIncome - holdingExpense

  const summary = accounts
    .filter((account) => {
      return (
        account.account_category === 'supplier' &&
        account.income_suppliers?.owner_name &&
        account.bank &&
        account.account_number &&
        account.account_number !== '-'
      )
    })
    .map((account) => {
      const openingBalance = Number(account.opening_balance) || 0

      const income = incomeMap.get(account.id) ?? 0

      const expenseData = expenseMap.get(account.id) ?? {
        total: 0,
        count: 0
      }

      const expense = expenseData.total
      const historyCount = expenseData.count

      const balance = openingBalance + income - expense

      return {
        category: account.account_category,
        accountId: account.id,
        ownerName: account.income_suppliers.owner_name,
        rekening: `${account.bank} • ${getLastFiveDigits(account.account_number)}`,

        openingBalance,

        income,
        expense,
        balance,

        historyCount
      }
    })
  if (holdingAccount) {
    const holdingHistoryCount = expenses.filter(
      (item) =>
        item.transfer_type === 'holding' ||
        (holdingAccount && item.account_id === holdingAccount.id)
    ).length

    summary.push({
      category: 'holding',
      accountId: holdingAccount.id,
      ownerName: holdingAccount.name,
      rekening: `${holdingAccount.bank} • ${getLastFiveDigits(
        holdingAccount.account_number
      )}`,

      openingBalance: holdingOpeningBalance,
      income: holdingIncome,
      expense: holdingExpense,
      balance: holdingBalance,

      historyCount: holdingHistoryCount
    })
  }

  summary.sort((a, b) => a.ownerName.localeCompare(b.ownerName))

  currentBankSummary = summary

  const keyword = bankSearch?.value.trim().toLowerCase() ?? ''

  const filteredSummary = keyword
    ? summary.filter((item) => {
        return (
          item.ownerName.toLowerCase().includes(keyword) ||
          item.rekening.toLowerCase().includes(keyword)
        )
      })
    : summary

  const holdingSummary = filteredSummary.filter(
    (item) => item.category === 'holding'
  )

  const supplierSummary = filteredSummary.filter(
    (item) => item.category === 'supplier'
  )

  let totalOpeningBalance = 0
  let totalIncome = 0
  let totalExpense = 0
  let totalBalance = 0

  for (const item of filteredSummary) {
    totalOpeningBalance += item.openingBalance
    totalIncome += item.income
    totalExpense += item.expense
    totalBalance += item.balance
  }

  bankTransactionTableContainer.innerHTML = `
<div class="dashboard bank-summary-cards">

  <div class="dashboard-card bank-summary-card">
    <div class="dashboard-card-top">
      <div>
        <small>Total Masuk</small>
        <h2>${formatRupiah(totalIncome)}</h2>
      </div>
<div class="dashboard-icon bank-icon income">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      <div class="dashboard-icon bank-icon expense">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
      <div class="dashboard-icon bank-icon balance">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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

      <th class="bank-col-account">Rekening</th>
      <th class="text-center">Saldo Awal</th>
      <th class="text-center">Uang Masuk</th>
      <th class="text-center">Uang Keluar</th>
      <th class="text-center">Saldo Akhir</th>
      <th class="text-center bank-col-action">Aksi</th>

    </tr>

  </thead>

  <tbody>

${[
  {
    title: 'Rekening Penampung',
    items: holdingSummary
  },
  {
    title: 'Rekening Supplier',
    items: supplierSummary
  }
]
  .filter((section) => section.items.length)
  .map(
    (section) => `
      <tr class="bank-section-row">
        <td colspan="6">
          <div class="bank-section-title">
            ${section.title}
          </div>
        </td>
      </tr>

      ${section.items
        .map((item) => {
          const balanceClass = 'balance'

          const [bankName, accountNumber] = item.rekening.split(' • ')

          return `
<tr class="bank-row">

  <td>

    <div class="bank-owner">
      ${item.ownerName}
    </div>

    <div class="bank-account">

      <span class="bank-bank-badge">
        ${bankName}
      </span>

      <span class="bank-account-number">
        ${accountNumber}
      </span>

    </div>

  </td>

  <td class="text-center">
    <div class="bank-money">
      <strong>${formatRupiah(item.openingBalance)}</strong>
    </div>
  </td>

  <td class="text-center">
    <div class="bank-money income">
      <strong>${formatRupiah(item.income)}</strong>
    </div>
  </td>

  <td class="text-center">
    <div class="bank-money expense">
      <strong>${formatRupiah(item.expense)}</strong>
    </div>
  </td>

  <td class="text-center">
    <div class="bank-money ${balanceClass}">
      <strong>${formatRupiah(item.balance)}</strong>
    </div>
  </td>

  <td class="text-center">

    <button
      class="bank-history-button ${item.historyCount > 0 ? 'has-history' : 'no-history'}"
      data-account-id="${item.accountId}"
      title="Lihat History">

      Riwayat

      <span class="history-count ${item.historyCount > 0 ? 'has-history' : 'no-history'}">
        ${item.historyCount}
      </span>

    </button>

  </td>

</tr>
`
        })
        .join('')}

    `
  )
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

  const holdingAccounts = bankAccounts
    .filter((account) => account.account_category === 'holding')
    .sort((a, b) => a.name.localeCompare(b.name))

  const supplierAccounts = bankAccounts
    .filter((account) => {
      return (
        account.account_category === 'supplier' &&
        account.income_suppliers?.owner_name &&
        account.account_number &&
        account.account_number !== '-'
      )
    })
    .sort((a, b) =>
      a.income_suppliers.owner_name.localeCompare(b.income_suppliers.owner_name)
    )

  if (holdingAccounts.length) {
    bankAccountSelect.insertAdjacentHTML(
      'beforeend',
      `
      <optgroup label="Rekening Penampung">
      </optgroup>
      `
    )

    const group = bankAccountSelect.lastElementChild

    holdingAccounts.forEach((account) => {
      group.insertAdjacentHTML(
        'beforeend',
        `
        <option value="${account.id}">
          ${account.name}
          • ${account.bank}
          • ${getLastFiveDigits(account.account_number)}
        </option>
        `
      )
    })
  }

  if (supplierAccounts.length) {
    bankAccountSelect.insertAdjacentHTML(
      'beforeend',
      `
      <optgroup label="Rekening Supplier">
      </optgroup>
      `
    )

    const group = bankAccountSelect.lastElementChild

    supplierAccounts.forEach((account) => {
      group.insertAdjacentHTML(
        'beforeend',
        `
        <option value="${account.id}">
          ${account.income_suppliers.owner_name}
          • ${account.bank}
          • ${getLastFiveDigits(account.account_number)}
        </option>
        `
      )
    })
  }
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
