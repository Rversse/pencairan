let bankAccounts = []

let currentBankSummary = []

let currentBankIncomes = []

let currentBankExpenses = []

function renderBankTransactionSummary(accounts, incomes, expenses) {
  const incomeMap = new Map()
  const expenseMap = new Map()
  const summary = []

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

  // ======================
  // SUPPLIER
  // ======================

  accounts
    .filter((account) => {
      return (
        account.account_category === 'supplier' &&
        !account.is_holding_destination &&
        account.income_suppliers?.owner_name &&
        account.bank &&
        account.account_number &&
        account.account_number !== '-'
      )
    })
    .forEach((account) => {
      const openingBalance = Number(account.opening_balance) || 0

      const dashboardIncome = incomeMap.get(account.id) ?? 0

      const transferIncome = currentBankExpenses
        .filter((item) =>
          item.recipient_account_id
            ? item.recipient_account_id === account.id
            : item.recipient_name === account.name
        )
        .reduce((total, item) => total + Number(item.transfer_amount || 0), 0)

      const income = dashboardIncome + transferIncome

      const expenseData = expenseMap.get(account.id) ?? {
        total: 0,
        count: 0
      }

      const expense = expenseData.total

      summary.push({
        category: 'supplier',
        accountId: account.id,
        ownerName: account.income_suppliers.owner_name,
        supplierName: account.name || null,
        rekening: `${account.bank} • ${getLastThreeDigits(account.account_number)}`,
        openingBalance,
        disbursementIncome: dashboardIncome,
        transferIncome,
        income,
        expense,
        balance: openingBalance + income - expense,
        historyCount: expenseData.count
      })
    })

  // ======================
  // HOLDING
  // ======================

  accounts
    .filter((account) => account.is_holding_destination)
    .forEach((holdingAccount) => {
      let holdingIncome = 0
      let holdingExpense = 0

      for (const item of expenses) {
        if (item.recipient_account_id) {
          if (item.recipient_account_id === holdingAccount.id) {
            holdingIncome += Number(item.transfer_amount)
          }
        } else if (item.recipient_name === holdingAccount.name) {
          holdingIncome += Number(item.transfer_amount)
        }

        if (item.account_id === holdingAccount.id) {
          holdingExpense +=
            Number(item.transfer_amount) + Number(item.admin_fee)
        }
      }

      const openingBalance = Number(holdingAccount.opening_balance) || 0

      const dashboardIncome =
        holdingAccount.account_category === 'supplier'
          ? (incomeMap.get(holdingAccount.id) ?? 0)
          : 0

      summary.push({
        category: 'holding',
        accountId: holdingAccount.id,
        ownerName:
          holdingAccount.income_suppliers?.owner_name || holdingAccount.name,
        supplierName: holdingAccount.income_suppliers?.owner_name
          ? holdingAccount.name
          : null,
        rekening: `${holdingAccount.bank} • ${getLastThreeDigits(holdingAccount.account_number)}`,
        openingBalance,
        disbursementIncome: dashboardIncome,
        transferIncome: holdingIncome,
        income: dashboardIncome + holdingIncome,
        expense: holdingExpense,
        balance:
          openingBalance + dashboardIncome + holdingIncome - holdingExpense,
        historyCount: expenses.filter((item) => {
          if (item.account_id === holdingAccount.id) return true

          if (item.recipient_account_id) {
            return item.recipient_account_id === holdingAccount.id
          }

          return item.recipient_name === holdingAccount.name
        }).length
      })
    })

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

  const PINNED_OWNERS = ['DEDE JAELANI', 'AYI SUHERLAN', 'TAUFIK SUKALARANG']

  const isPinned = (item) =>
    PINNED_OWNERS.includes(item.ownerName.trim().toUpperCase())

  const supplierSummaryRaw = filteredSummary.filter(
    (item) => item.category === 'supplier'
  )

  const pinnedSupplierSummary = supplierSummaryRaw
    .filter(isPinned)
    .sort(
      (a, b) =>
        PINNED_OWNERS.indexOf(a.ownerName.trim().toUpperCase()) -
        PINNED_OWNERS.indexOf(b.ownerName.trim().toUpperCase())
    )

  const restSupplierSummary = supplierSummaryRaw.filter(
    (item) => !isPinned(item)
  )

  const supplierSummary = [...pinnedSupplierSummary, ...restSupplierSummary]

  let totalOpeningBalance = 0
  let totalDisbursementIncome = 0
  let totalTransferIncome = 0
  let totalIncome = 0
  let totalExpense = 0
  let totalBalance = 0

  const countedAccounts = new Set()

  for (const item of filteredSummary) {
    if (countedAccounts.has(item.accountId)) continue

    countedAccounts.add(item.accountId)

    totalOpeningBalance += item.openingBalance
    totalDisbursementIncome += item.disbursementIncome
    totalTransferIncome += item.transferIncome
    totalIncome += item.income
    totalExpense += item.expense
    totalBalance += item.balance
  }

  bankTransactionTableContainer.innerHTML = `
<div class="bank-summary-cards">

  <div class="dashboard-card bank-summary-card">
    <div class="dashboard-card-top">
      <div>
        <small>Total Pencairan Masuk</small>
        <h2>${formatRupiah(totalDisbursementIncome)}</h2>
        <span class="bank-card-source">dari pencairan dashboard</span>
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
        <small>Total Transfer Masuk</small>
        <h2>${formatRupiah(totalTransferIncome)}</h2>
        <span class="bank-card-source">dari transfer antar rekening</span>
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
        <small>Total Transfer Keluar</small>
        <h2>${formatRupiah(totalExpense)}</h2>
        <span class="bank-card-source">termasuk biaya admin</span>
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
        <small>Total Saldo Akhir</small>
        <h2>${formatRupiah(totalBalance)}</h2>
        <span class="bank-card-source">(saldo awal + masuk) - keluar</span>
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

      <th class="bank-col-account">REKENING</th>
        <th class="text-center">SALDO AWAL</th>
        <th class="text-center">PENCAIRAN MASUK</th>
        <th class="text-center">TRANSFER MASUK</th>
        <th class="text-center">TRANSFER KELUAR</th>
        <th class="text-center">SALDO AKHIR</th>
      <th class="text-center bank-col-action">AKSI</th>

    </tr>

  </thead>

  <tbody>

${[
  {
    title: 'Rekening Penampung',
    items: holdingSummary
  },
  {
    title: 'Rekening Prioritas',
    items: pinnedSupplierSummary,
    pinned: true
  },
  {
    title: 'Rekening Supplier',
    items: restSupplierSummary
  }
]
  .filter((section) => section.items.length)
  .map(
    (section) => `
      <tr class="bank-section-row${section.pinned ? ' bank-section-row-pinned' : ''}">
        <td colspan="7">
          <div class="bank-section-title${section.pinned ? ' bank-section-title-pinned' : ''}">
            ${section.pinned ? '<i data-lucide="pin"></i>' : ''}
            ${section.title}
          </div>
        </td>
      </tr>

      ${section.items
        .map((item) => {
          const balanceClass = 'balance'

          const [bankName, accountNumber] = item.rekening.split(' • ')

          return `
<tr class="bank-row${section.pinned ? ' bank-row-pinned' : ''}">

  <td>

    <div class="bank-owner"${item.supplierName ? ` title="${item.supplierName}"` : ''}>
      ${section.pinned ? '<i data-lucide="pin" class="bank-pin-icon"></i>' : ''}
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
      <strong>${formatRupiah(item.disbursementIncome)}</strong>
    </div>
  </td>

  <td class="text-center">
    <div class="bank-money income">
      <strong>${formatRupiah(item.transferIncome)}</strong>
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
      title="${item.historyCount} transaksi">

      Riwayat

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

  lucide.createIcons()
}

function populateBankAccountDropdown() {
  bankAccountSelect.innerHTML = `
    <option value="">
      Pilih Pengirim
    </option>
  `

  const holdingAccounts = bankAccounts
    .filter((account) => account.is_holding_destination)
    .sort((a, b) =>
      (a.income_suppliers?.owner_name || a.name).localeCompare(
        b.income_suppliers?.owner_name || b.name
      )
    )

  const supplierAccounts = bankAccounts
    .filter((account) => {
      return (
        account.account_category === 'supplier' &&
        !account.is_holding_destination &&
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
          ${account.income_suppliers?.owner_name || account.name}
          • ${account.bank}
          • ${getLastThreeDigits(account.account_number)}
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
          • ${getLastThreeDigits(account.account_number)}
        </option>
        `
      )
    })
  }
}

function getLastThreeDigits(accountNumber) {
  const digits = String(accountNumber ?? '').replace(/\D/g, '')

  if (!digits) return 'Belum diisi'

  return `••${digits.slice(-3)}`
}

bankSearch?.addEventListener('input', () => {
  renderBankTransactionSummary(
    bankAccounts,
    currentBankIncomes,
    currentBankExpenses
  )
})
